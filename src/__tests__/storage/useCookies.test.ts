import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCookie } from '../../hooks/storage/useCookies'

describe('useCookie', () => {
  const clearCookie = (key: string) => {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }

  beforeEach(() => {
    // clear jsdom cookies between tests
    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=')
      const key = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
      if (key) clearCookie(key)
    })
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns initial value when cookie is missing', () => {
    const { result } = renderHook(() => useCookie('missing', 'init'))
    expect(result.current.value).toBe('init')
  })

  it('reads existing cookie with custom decode', () => {
    document.cookie = 'token=abc123'
    const decode = vi.fn((v: string | null) => (v ? `decoded-${v}` : null))

    const { result } = renderHook(() => useCookie('token', null, { decode }))
    expect(decode).toHaveBeenCalled()
    expect(result.current.value).toBe('decoded-abc123')
  })

  it('writes cookie with encode and updates state', () => {
    const encode = vi.fn((v: string | null) => (v ? `enc-${v}` : ''))

    const { result } = renderHook(() => useCookie('token', null, { encode }))
    act(() => {
      result.current.setCookie('value')
    })

    expect(encode).toHaveBeenCalledWith('value')
    expect(result.current.value).toBe('value')
    expect(document.cookie).toContain('token=enc-value')
  })

  it('removes cookie and sets value to null', () => {
    document.cookie = 'token=existing'
    const { result } = renderHook(() => useCookie('token', 'init'))

    expect(result.current.value).toBe('existing')

    act(() => {
      result.current.removeCookie()
    })

    expect(result.current.value).toBeNull()
    expect(document.cookie).not.toContain('token=existing')
  })

  it('applies options to cookie string (path/domain/sameSite/secure/maxAge)', () => {
    const cookieSetter = vi.spyOn(document, 'cookie', 'set')
    const options = {
      path: '/test',
      domain: 'example.com',
      sameSite: 'strict' as const,
      secure: true,
      maxAge: 3600,
    }

    const { result } = renderHook(() => useCookie<string>('opt', null, options))
    act(() => {
      result.current.setCookie('val')
    })

    expect(cookieSetter).toHaveBeenCalled()
    const setValue = cookieSetter.mock.calls.find(Boolean)?.[0] as string
    expect(setValue).toContain('opt=val')
    expect(setValue).toContain('path=/test')
    expect(setValue).toContain('domain=example.com')
    expect(setValue).toContain('SameSite=strict')
    expect(setValue).toContain('secure')
    expect(setValue).toContain('max-age=3600')
  })
})

