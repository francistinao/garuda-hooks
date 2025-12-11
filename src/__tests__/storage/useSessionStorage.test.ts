import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSessionStorage } from '../../hooks'

describe('useSessionStorage', () => {
  const key = 'session-key'

  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value when key is absent', () => {
    // baseline: nothing stored yet -> hook should return initial
    const { result } = renderHook(() => useSessionStorage(key, 'initial', 500))
    expect(result.current.storedValue).toBe('initial')
  })

  it('hydrates from existing non-expired value and schedules cleanup', () => {
    // preload storage with future expiry -> hydrate now, drop after ttl passes
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    const expiresAt = Date.now() + 1000
    sessionStorage.setItem(key, JSON.stringify({ value: 'persisted', expiresAt }))

    const { result } = renderHook(() => useSessionStorage(key, 'initial', 500))
    expect(result.current.storedValue).toBe('persisted')

    vi.advanceTimersByTime(1001)
    expect(sessionStorage.getItem(key)).toBeNull()
  })

  it('discards expired stored value on init', () => {
    // stale entry should be removed and state reset to initial
    const expiresAt = Date.now() - 1000
    sessionStorage.setItem(key, JSON.stringify({ value: 'old', expiresAt }))

    const { result } = renderHook(() => useSessionStorage(key, 'initial'))
    expect(result.current.storedValue).toBe('initial')
    expect(sessionStorage.getItem(key)).toBeNull()
  })

  it('setValue stores non-expiring payload and keeps it', () => {
    // non-TTL path should persist with expiresAt: null and not auto-clean
    vi.useFakeTimers()
    const { result } = renderHook(() => useSessionStorage(key, 'initial'))

    act(() => {
      result.current.setValue('next')
    })

    const payloadRaw = sessionStorage.getItem(key)
    expect(payloadRaw).not.toBeNull()

    const parsed = JSON.parse(payloadRaw as string)
    expect(parsed.value).toBe('next')
    expect(parsed.expiresAt).toBeNull()
    expect(result.current.storedValue).toBe('next')

    vi.runAllTimers()
    expect(sessionStorage.getItem(key)).not.toBeNull() // no cleanup scheduled for non-expiring writes
  })

  it('supports functional updater and falsy values', () => {
    // functional update should accept prev value and allow falsy results like 0
    const { result } = renderHook(() => useSessionStorage(key, 1, 500))

    act(() => {
      result.current.setValue((prev: number) => prev - 1)
    })

    expect(result.current.storedValue).toBe(0)
    const parsed = JSON.parse(sessionStorage.getItem(key) as string)
    expect(parsed.value).toBe(0)
  })

  it('removeValue clears storage and resets to initial', () => {
    // remove should delete persisted data and reset state
    sessionStorage.setItem(key, JSON.stringify({ value: 'cached', expiresAt: Date.now() + 5000 }))

    const { result } = renderHook(() => useSessionStorage(key, 'initial'))
    act(() => {
      result.current.removeValue()
    })

    expect(sessionStorage.getItem(key)).toBeNull()
    expect(result.current.storedValue).toBe('initial')
  })

  it('setValueWithTTL respects override ttl and triggers cleanup', () => {
    // override ttl should dictate expiry and auto-clean removal
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    const { result } = renderHook(() => useSessionStorage(key, 'initial'))

    act(() => {
      result.current.setValueWithTTL('custom', 500)
    })

    const parsed = JSON.parse(sessionStorage.getItem(key) as string)
    expect(parsed.value).toBe('custom')
    expect(parsed.expiresAt).toBe(Date.now() + 500)

    vi.advanceTimersByTime(501)
    expect(sessionStorage.getItem(key)).toBeNull()
  })

  it('is tolerant when storage access fails (SSR-ish)', () => {
    // if storage is unavailable, hook should fall back to initial and not throw
    const getItemSpy = vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => {
      throw new Error('no storage')
    })

    const { result } = renderHook(() => useSessionStorage(key, 'initial'))
    expect(result.current.storedValue).toBe('initial')

    getItemSpy.mockRestore()
  })

  it('gets the stored value with the key', () => {
    sessionStorage.setItem(key, JSON.stringify('stored'))
    const { result } = renderHook(() => useSessionStorage(key, 'initial'))
    expect(result?.current?.storedValue).toBe('stored')
  })
})
