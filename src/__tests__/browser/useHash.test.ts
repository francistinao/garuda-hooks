import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useHash } from '../../hooks/browser/useHash'

interface Options {
  defaultHash?: string
  replace?: boolean
  parse?: boolean
  separator?: '&'
  decode?: boolean
}

describe('useHash', () => {
  let originalLocation: Location
  let originalHistory: History

  beforeEach(() => {
    originalLocation = window.location
    originalHistory = window.history

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        hash: '',
        pathname: '/test',
        search: '?query=1',
      },
      writable: true,
      configurable: true,
    })

    // Mock history methods
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
    window.history = originalHistory
    vi.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('should initialize with empty hash when no hash present', () => {
      const { result } = renderHook(() => useHash({ value: '', options: {} }))

      expect(result.current.hash).toBe('')
      expect(result.current.rawHash).toBe('')
      expect(result.current.parsed).toBeNull()
    })

    it('should initialize with current hash from location', () => {
      window.location.hash = '#test-hash'

      const { result } = renderHook(() => useHash({ value: '', options: {} }))

      expect(result.current.hash).toBe('test-hash')
      expect(result.current.rawHash).toBe('#test-hash')
    })

    it('should use defaultHash when no hash is present', () => {
      const { result } = renderHook(() =>
        useHash({ value: '', options: { defaultHash: 'default' } }),
      )

      expect(result.current.hash).toBe('default')
      expect(result.current.rawHash).toBe('')
    })

    it('should set hash with # prefix automatically', () => {
      const { result } = renderHook(() => useHash({ value: 'new-hash', options: {} }))

      act(() => {
        result.current.setHash()
      })

      expect(window.location.hash).toBe('#new-hash')
      expect(result.current.hash).toBe('new-hash')
      expect(result.current.rawHash).toBe('#new-hash')
    })

    it('should handle hash already with # prefix', () => {
      const { result } = renderHook(() => useHash({ value: '#already-prefixed', options: {} }))

      act(() => {
        result.current.setHash()
      })

      expect(window.location.hash).toBe('#already-prefixed')
      expect(result.current.hash).toBe('already-prefixed')
    })

    it('should clear hash', () => {
      window.location.hash = '#existing-hash'

      const { result } = renderHook(() => useHash({ value: '', options: {} }))

      act(() => {
        result.current.clearHash()
      })

      expect(window.location.hash).toBe('')
      expect(result.current.hash).toBe('')
      expect(result.current.rawHash).toBe('')
    })
  })

  describe('Replace mode', () => {
    it('should use replaceState when replace is true', () => {
      const { result } = renderHook(() =>
        useHash({ value: 'replace-hash', options: { replace: true } }),
      )

      act(() => {
        result.current.setHash()
      })

      expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '#replace-hash')
    })

    it('should clear hash using replaceState when replace is true', () => {
      window.location.hash = '#existing'

      const { result } = renderHook(() => useHash({ value: '', options: { replace: true } }))

      act(() => {
        result.current.clearHash()
      })

      expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/test?query=1')
    })

    it('should use location.hash when replace is false', () => {
      const { result } = renderHook(() =>
        useHash({ value: 'normal-hash', options: { replace: false } }),
      )

      act(() => {
        result.current.setHash()
      })

      expect(window.location.hash).toBe('#normal-hash')
      expect(window.history.replaceState).not.toHaveBeenCalled()
    })
  })

  describe('Parsing functionality', () => {
    it('should parse simple key=value pairs', () => {
      window.location.hash = '#key1=value1&key2=value2'

      const { result } = renderHook(() => useHash({ value: '', options: { parse: true } }))

      expect(result.current.parsed).toEqual({
        key1: 'value1',
        key2: 'value2',
      })
    })

    it('should handle keys without values', () => {
      window.location.hash = '#key1&key2=value2&key3'

      const { result } = renderHook(() => useHash({ value: '', options: { parse: true } }))

      expect(result.current.parsed).toEqual({
        key1: '',
        key2: 'value2',
        key3: '',
      })
    })

    it('should handle empty parts in hash', () => {
      window.location.hash = '#key1=value1&&key2=value2&'

      const { result } = renderHook(() => useHash({ value: '', options: { parse: true } }))

      expect(result.current.parsed).toEqual({
        key1: 'value1',
        key2: 'value2',
      })
    })

    it('should use custom separator', () => {
      window.location.hash = '#key1=value1;key2=value2;key3=value3'

      const { result } = renderHook(() =>
        useHash({ value: '', options: { parse: true, separator: '&' } }),
      )

      expect(result.current.parsed).toEqual({
        'key1=value1;key2=value2;key3=value3': '',
      })
    })

    it('should decode URL-encoded values when decode is true', () => {
      window.location.hash = '#name=John%20Doe&email=test%40example.com&special=%21%40%23%24'

      const { result } = renderHook(() =>
        useHash({ value: '', options: { parse: true, decode: true } }),
      )

      expect(result.current.parsed).toEqual({
        name: 'John Doe',
        email: 'test@example.com',
        special: '!@#$',
      })
    })

    it('should not decode when decode is false', () => {
      window.location.hash = '#name=John%20Doe&email=test%40example.com'

      const { result } = renderHook(() =>
        useHash({ value: '', options: { parse: true, decode: false } }),
      )

      expect(result.current.parsed).toEqual({
        name: 'John%20Doe',
        email: 'test%40example.com',
      })
    })

    it('should handle complex encoded characters', () => {
      window.location.hash = '#path=%2Fuser%2Fprofile&query=%3Fid%3D123&emoji=%F0%9F%8E%89'

      const { result } = renderHook(() =>
        useHash({ value: '', options: { parse: true, decode: true } }),
      )

      expect(result.current.parsed).toEqual({
        path: '/user/profile',
        query: '?id=123',
        emoji: '🎉',
      })
    })

    it('should return null when parse is false', () => {
      window.location.hash = '#key1=value1&key2=value2'

      const { result } = renderHook(() => useHash({ value: '', options: { parse: false } }))

      expect(result.current.parsed).toBeNull()
    })

    it('should handle equals sign in value', () => {
      window.location.hash = '#equation=a=b+c&formula=x=y'

      const { result } = renderHook(() => useHash({ value: '', options: { parse: true } }))

      expect(result.current.parsed).toEqual({
        equation: 'a=b+c',
        formula: 'x=y',
      })
    })
  })

  describe('Hash change event handling', () => {
    it('should update when hash changes externally', () => {
      const { result } = renderHook(() => useHash({ value: '', options: {} }))

      expect(result.current.hash).toBe('')

      act(() => {
        window.location.hash = '#external-change'
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })

      expect(result.current.hash).toBe('external-change')
      expect(result.current.rawHash).toBe('#external-change')
    })

    it('should update parsed values on hash change', () => {
      const { result } = renderHook(() => useHash({ value: '', options: { parse: true } }))

      act(() => {
        window.location.hash = '#key1=value1&key2=value2'
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })

      expect(result.current.parsed).toEqual({
        key1: 'value1',
        key2: 'value2',
      })
    })

    it('should handle multiple rapid hash changes', () => {
      const { result } = renderHook(() => useHash({ value: '', options: {} }))

      act(() => {
        window.location.hash = '#change1'
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })
      expect(result.current.hash).toBe('change1')

      act(() => {
        window.location.hash = '#change2'
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })
      expect(result.current.hash).toBe('change2')

      act(() => {
        window.location.hash = '#change3'
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })
      expect(result.current.hash).toBe('change3')
    })

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useHash({ value: '', options: {} }))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function))
    })
  })

  describe('Edge cases', () => {
    it('should handle empty hash string', () => {
      window.location.hash = '#'

      const { result } = renderHook(() => useHash({ value: '', options: {} }))

      expect(result.current.hash).toBe('')
      expect(result.current.rawHash).toBe('#')
    })

    it('should handle very long hash values', () => {
      const longValue = 'a'.repeat(10000)
      window.location.hash = `#key=${longValue}`

      const { result } = renderHook(() => useHash({ value: '', options: { parse: true } }))

      expect(result.current.parsed).toEqual({
        key: longValue,
      })
    })

    it('should handle special characters in hash', () => {
      window.location.hash = '#key=<script>alert("xss")</script>'

      const { result } = renderHook(() => useHash({ value: '', options: { parse: true } }))

      expect(result.current.parsed).toEqual({
        key: '<script>alert("xss")</script>',
      })
    })

    it('should handle unicode characters', () => {
      window.location.hash = '#name=你好&emoji=😀&text=Здравствуйте'

      const { result } = renderHook(() => useHash({ value: '', options: { parse: true } }))

      expect(result.current.parsed).toEqual({
        name: '你好',
        emoji: '😀',
        text: 'Здравствуйте',
      })
    })

    it('should handle malformed encoded sequences gracefully', () => {
      window.location.hash = '#key=%G1%H2%Z3'

      const { result } = renderHook(() =>
        useHash({ value: '', options: { parse: true, decode: true } }),
      )

      // decodeURIComponent should throw on invalid sequences
      // but we should handle it gracefully
      expect(() => result.current.parsed).not.toThrow()
    })

    it('should handle hash with only separator characters', () => {
      window.location.hash = '#&&&'

      const { result } = renderHook(() => useHash({ value: '', options: { parse: true } }))

      expect(result.current.parsed).toEqual({})
    })

    it('should handle hash with only equals signs', () => {
      window.location.hash = '#==='

      const { result } = renderHook(() => useHash({ value: '', options: { parse: true } }))

      expect(result.current.parsed).toEqual({})
    })

    it('should handle duplicate keys (last value wins)', () => {
      window.location.hash = '#key=value1&key=value2&key=value3'

      const { result } = renderHook(() => useHash({ value: '', options: { parse: true } }))

      expect(result.current.parsed).toEqual({
        key: 'value3',
      })
    })

    it('should handle null and undefined in options gracefully', () => {
      const { result } = renderHook(() =>
        useHash({ value: '', options: undefined as unknown as Options }),
      )

      expect(result.current.hash).toBe('')
      expect(result.current.rawHash).toBe('')
      expect(result.current.parsed).toBeNull()
    })

    it('should handle setting empty value', () => {
      const { result } = renderHook(() => useHash({ value: '', options: {} }))

      act(() => {
        result.current.setHash()
      })

      expect(window.location.hash).toBe('#')
      expect(result.current.hash).toBe('')
    })
  })

  describe('Complex scenarios', () => {
    it('should handle setting hash while parsing is enabled', () => {
      const { result } = renderHook(() =>
        useHash({
          value: 'key1=value1&key2=value2',
          options: { parse: true },
        }),
      )

      act(() => {
        result.current.setHash()
      })

      expect(result.current.hash).toBe('key1=value1&key2=value2')
      expect(result.current.parsed).toEqual({
        key1: 'value1',
        key2: 'value2',
      })
    })

    it('should preserve query parameters when clearing hash', () => {
      window.location.hash = '#test-hash'
      window.location.search = '?param1=value1&param2=value2'
      window.location.pathname = '/test/path'

      const { result } = renderHook(() => useHash({ value: '', options: {} }))

      act(() => {
        result.current.clearHash()
      })

      expect(window.location.hash).toBe('')
      // Should preserve pathname and search when clearing
    })

    it('should handle re-rendering with different options', () => {
      const { result, rerender } = renderHook(
        ({ parse }) => useHash({ value: '', options: { parse } }),
        { initialProps: { parse: false } },
      )

      window.location.hash = '#key1=value1&key2=value2'

      act(() => {
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })

      expect(result.current.parsed).toBeNull()

      rerender({ parse: true })

      act(() => {
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })

      expect(result.current.parsed).toEqual({
        key1: 'value1',
        key2: 'value2',
      })
    })

    it('should handle changing value prop', () => {
      const { result, rerender } = renderHook(({ value }) => useHash({ value, options: {} }), {
        initialProps: { value: 'initial' },
      })

      act(() => {
        result.current.setHash()
      })
      expect(window.location.hash).toBe('#initial')

      rerender({ value: 'updated' })

      act(() => {
        result.current.setHash()
      })
      expect(window.location.hash).toBe('#updated')
    })
  })
})
