import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../../hooks/storage'

describe('useLocalStorage', () => {
  const key = 'test-key'

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns initial value when key is absent', () => {
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    expect(result.current[0]).toBe('initial')
  })

  it('returns stored value when key exists', () => {
    localStorage.setItem(key, JSON.stringify('stored'))
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    expect(result.current[0]).toBe('stored')
  })

  it('sets value and syncs to localStorage (direct value)', () => {
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    act(() => {
      result.current[1]('next')
    })
    expect(result.current[0]).toBe('next')
    expect(localStorage.getItem(key)).toBe(JSON.stringify('next'))
  })

  it('sets value with functional updater', () => {
    const { result } = renderHook(() => useLocalStorage(key, 1))
    act(() => {
      result.current[1](prev => prev + 1)
    })
    expect(result.current[0]).toBe(2)
    expect(localStorage.getItem(key)).toBe('2')
  })

  it('removeValue clears storage and resets to initial', () => {
    localStorage.setItem(key, JSON.stringify('stored'))
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    act(() => {
      result.current[2]() // removeValue
    })
    expect(localStorage.getItem(key)).toBeNull()
    expect(result.current[0]).toBe('initial')
  })

  it('getStoredValue returns current storage contents', () => {
    localStorage.setItem(key, JSON.stringify('stored'))
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    expect(result.current[3]()).toBe('stored')
  })

  it('is SSR-safe (returns initial when window is undefined)', () => {
    const getItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => { throw new Error('no storage') })
    const { result } = renderHook(() => useLocalStorage('k', 'initial'))
    expect(result.current[0]).toBe('initial')
    getItem.mockRestore()
  })
})