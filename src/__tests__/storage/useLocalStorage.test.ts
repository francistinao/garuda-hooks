import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../../hooks/storage'
import { STORAGE_ENV } from '../../utils/storage/storage-env'

describe('useLocalStorage', () => {
  const key = 'test-key'

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns initial value when key is absent', () => {
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    expect(result?.current?.storedValue).toBe('initial')
  })

  it('returns stored value when key exists', () => {
    localStorage.setItem(key, JSON.stringify('stored'))
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    expect(result?.current?.storedValue).toBe('stored')
  })

  it('sets value and syncs to localStorage (direct value)', () => {
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    act(() => {
      result.current.setValue('next')
    })
    expect(result?.current?.storedValue).toBe('next')
    expect(localStorage.getItem(key)).toBe(JSON.stringify('next'))
  })

  it('sets value with functional updater', () => {
    const { result } = renderHook(() => useLocalStorage(key, 1))
    act(() => {
      result.current.setValue(prev => prev + 1)
    })
    expect(result?.current?.storedValue).toBe(2)
    expect(localStorage.getItem(key)).toBe('2')
  })

  it('removeValue clears storage and resets to initial', () => {
    localStorage.setItem(key, JSON.stringify('stored'))
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    act(() => {
      result.current.removeValue() // removeValue
    })
    expect(localStorage.getItem(key)).toBeNull()
    expect(result?.current?.storedValue).toBe('initial')
  })

  it('getStoredValue returns current storage contents', () => {
    localStorage.setItem(key, JSON.stringify('stored'))
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    expect(result?.current?.getStoredValue()).toBe('stored')
  })

  it('getStoredValue can read from specified storage env', () => {
    sessionStorage.setItem(key, JSON.stringify('session-stored'))
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    expect(result?.current?.getStoredValue(STORAGE_ENV.SESSION_STORAGE)).toBe('session-stored')
  })

  it('is SSR-safe (returns initial when window is undefined)', () => {
    const getItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => { throw new Error('no storage') })
    const { result } = renderHook(() => useLocalStorage('k', 'initial'))
    expect(result?.current?.storedValue).toBe('initial')
    getItem.mockRestore()
  })

  it('searchValue returns an array of values that match the search', () => {
    localStorage.setItem(key, JSON.stringify(['apple', 'banana', 'cherry']))
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    expect(result?.current?.searchValue('apple')).toEqual(['apple'])
    expect(result?.current?.searchValue('banana')).toEqual(['banana'])
    expect(result?.current?.searchValue('cherry')).toEqual(['cherry'])
    expect(result?.current?.searchValue('orange')).toEqual([])
  })

  it('searchValue returns an empty array when no values match the search', () => {
    localStorage.setItem(key, JSON.stringify(['apple', 'banana', 'cherry']))
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    expect(result?.current?.searchValue('orange')).toEqual([])
  })

  it('searchValue works against sessionStorage when requested', () => {
    sessionStorage.setItem(key, JSON.stringify(['alpha', 'beta']))
    const { result } = renderHook(() => useLocalStorage(key, 'initial'))
    expect(result?.current?.searchValue('alpha', STORAGE_ENV.SESSION_STORAGE)).toEqual(['alpha'])
    expect(result?.current?.searchValue('zeta', STORAGE_ENV.SESSION_STORAGE)).toEqual([])
  })
})