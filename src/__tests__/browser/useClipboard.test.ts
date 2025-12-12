import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useClipboard } from '../../hooks/browser/useClipboard'

describe('useClipboard', () => {
  const originalWindow = globalThis.window
  const originalNavigator = globalThis.navigator

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.window = originalWindow
    globalThis.navigator = originalNavigator
    vi.restoreAllMocks()
  })

  it('returns false when no element is attached', async () => {
    const { result } = renderHook(() => useClipboard())
    const success = await result.current.copy()
    expect(success).toBe(false)
    expect(result.current.copied).toBe(false)
  })

  it('returns false when clipboard API is missing', async () => {
    globalThis.navigator = { clipboard: undefined as unknown as Clipboard } as Navigator
    const { result } = renderHook(() => useClipboard())
    const div = document.createElement('div')
    div.textContent = 'sample'
    ;(result.current.ref as React.MutableRefObject<HTMLElement | null>).current = div

    const success = await result.current.copy()
    expect(success).toBe(false)
    expect(result.current.copied).toBe(false)
  })

  it('copies text and resets copied after timeout', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    // @ts-expect-error allow overriding navigator for the test
    globalThis.navigator = { clipboard: { writeText } } as Navigator

    const { result } = renderHook(() => useClipboard())
    const div = document.createElement('div')
    div.textContent = 'copied text'
    ;(result.current.ref as React.MutableRefObject<HTMLElement | null>).current = div

    const success = await act(async () => result.current.copy())
    expect(success).toBe(true)
    expect(writeText).toHaveBeenCalledWith('copied text')
    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.copied).toBe(false)
  })
})
