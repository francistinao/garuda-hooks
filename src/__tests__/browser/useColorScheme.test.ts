/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColorScheme } from '../../hooks/browser/useColorScheme'

// Mock the isSSR helper
vi.mock('../../helpers/is-ssr', () => ({
  isSSR: false,
}))

describe('useColorScheme', () => {
  let originalMatchMedia: typeof window.matchMedia
  let originalLocalStorage: typeof window.localStorage
  let originalSessionStorage: typeof window.sessionStorage

  beforeEach(() => {
    vi.useFakeTimers()
    originalMatchMedia = window.matchMedia
    originalLocalStorage = window.localStorage
    originalSessionStorage = window.sessionStorage

    // Mock matchMedia
    const createMatchMediaMock = (matches: boolean) => {
      let currentMatches = matches
      let listener: ((e: MediaQueryListEvent) => void) | null = null

      const mediaQueryList: MediaQueryList = {
        matches: currentMatches,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn((type: string, callback: any) => {
          if (type === 'change') listener = callback
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }

      return {
        mediaQueryList,
        trigger: (newMatches: boolean) => {
          currentMatches = newMatches
          // @ts-expect-error - Mocking matches property
          mediaQueryList.matches = newMatches
          if (listener) {
            listener({ matches: newMatches, media: mediaQueryList.media } as MediaQueryListEvent)
          }
        },
      }
    }

    const mockMatchMedia = createMatchMediaMock(false)
    window.matchMedia = vi.fn(() => mockMatchMedia.mediaQueryList)
    ;(window.matchMedia as any).trigger = mockMatchMedia.trigger

    // Mock localStorage
    const mockStorage = () => {
      let store: Record<string, string> = {}
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key]
        }),
        clear: vi.fn(() => {
          store = {}
        }),
        length: 0,
        key: vi.fn(),
      }
    }

    Object.defineProperty(window, 'localStorage', {
      value: mockStorage(),
      writable: true,
    })

    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage(),
      writable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    vi.useRealTimers()
    window.matchMedia = originalMatchMedia
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    })
    Object.defineProperty(window, 'sessionStorage', {
      value: originalSessionStorage,
      writable: true,
    })
  })

  describe('initialization', () => {
    it('should initialize with default values', async () => {
      const { result } = renderHook(() => useColorScheme())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.mode).toBe('system')
      expect(result.current.resolvedMode).toBe('light')
      expect(result.current.colors).toEqual({
        primary: '#FFFFFF',
        secondary: '#F0F0F0',
      })
      expect(result.current.isSystemDark).toBe(false)
    })

    it('should initialize with custom default mode', async () => {
      const { result } = renderHook(() => useColorScheme({ defaultMode: 'dark' }))

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.resolvedMode).toBe('dark')
      expect(result.current.colors).toEqual({
        primary: '#000000',
        secondary: '#1A1A1A',
      })
    })

    it('should initialize with custom themes', async () => {
      const customThemes = {
        light: { primary: '#FFAAAA', secondary: '#FFBBBB' },
        dark: { primary: '#111111', secondary: '#222222' },
      }

      const { result } = renderHook(() => useColorScheme({ themes: customThemes }))

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.colors).toEqual(customThemes.light)
    })

    it('should respect system preference when mode is system', async () => {
      // Set system to prefer dark
      ;(window.matchMedia as any).trigger(true)

      const { result } = renderHook(() => useColorScheme({ defaultMode: 'system' }))

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.mode).toBe('system')
      expect(result.current.resolvedMode).toBe('dark')
      expect(result.current.isSystemDark).toBe(true)
    })
  })

  describe('storage persistence', () => {
    it('should load from localStorage by default', async () => {
      window.localStorage.setItem('color-scheme', JSON.stringify({ mode: 'dark' }))

      const { result } = renderHook(() => useColorScheme())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.resolvedMode).toBe('dark')
    })

    it('should use sessionStorage when specified', async () => {
      window.sessionStorage.setItem('theme-key', JSON.stringify({ mode: 'dark' }))

      const { result } = renderHook(() =>
        useColorScheme({ storage: 'session', storageKey: 'theme-key' }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.mode).toBe('dark')
    })

    it('should handle invalid JSON in storage gracefully', async () => {
      window.localStorage.setItem('color-scheme', 'invalid-json')

      const { result } = renderHook(() => useColorScheme())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      // Should fall back to default
      expect(result.current.mode).toBe('system')
      expect(result.current.resolvedMode).toBe('light')
    })

    it('should save mode changes to storage', async () => {
      const { result } = renderHook(() => useColorScheme())

      await act(async () => {
        await vi.runAllTimersAsync()
        result.current.setMode('dark')
      })

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'color-scheme',
        expect.stringContaining('"mode":"dark"'),
      )
    })
  })

  describe('mode changes', () => {
    it('should change mode with setMode', async () => {
      const { result } = renderHook(() => useColorScheme())

      await act(async () => {
        await vi.runAllTimersAsync()
        result.current.setMode('dark')
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.resolvedMode).toBe('dark')
    })

    it('should toggle between light and dark with toggleMode', async () => {
      const { result } = renderHook(() => useColorScheme({ defaultMode: 'light' }))

      await act(async () => {
        await vi.runAllTimersAsync()
        result.current.toggleMode()
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.resolvedMode).toBe('dark')

      await act(async () => {
        result.current.toggleMode()
      })

      expect(result.current.mode).toBe('light')
      expect(result.current.resolvedMode).toBe('light')
    })

    it('should react to system preference changes when in system mode', async () => {
      const { result } = renderHook(() => useColorScheme({ defaultMode: 'system' }))

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.resolvedMode).toBe('light')

      // Change system preference
      await act(async () => {
        ;(window.matchMedia as any).trigger(true)
      })

      expect(result.current.resolvedMode).toBe('dark')
      expect(result.current.isSystemDark).toBe(true)
    })
  })

  describe('color management', () => {
    it('should set individual colors', async () => {
      const { result } = renderHook(() => useColorScheme())

      await act(async () => {
        await vi.runAllTimersAsync()
        result.current.setColor('light', 'primary', '#AAAAAA')
      })

      expect(result.current.colors.primary).toBe('#AAAAAA')
      expect(result.current.colors.secondary).toBe('#F0F0F0') // unchanged
    })

    it('should get colors for current mode', async () => {
      const { result } = renderHook(() => useColorScheme({ defaultMode: 'dark' }))

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.getColor('primary')).toBe('#000000')
      expect(result.current.getColor('secondary')).toBe('#1A1A1A')
    })

    it('should update colors for correct scheme', async () => {
      const { result } = renderHook(() => useColorScheme({ defaultMode: 'light' }))

      await act(async () => {
        await vi.runAllTimersAsync()
        result.current.setColor('dark', 'primary', '#333333')
      })

      // Should not affect current light mode colors
      expect(result.current.colors.primary).toBe('#FFFFFF')

      // Switch to dark mode
      await act(async () => {
        result.current.setMode('dark')
      })

      expect(result.current.colors.primary).toBe('#333333')
    })
  })

  describe('reset functionality', () => {
    it('should reset scheme to defaults', async () => {
      const { result } = renderHook(() => useColorScheme({ defaultMode: 'light' }))

      await act(async () => {
        await vi.runAllTimersAsync()
        result.current.setMode('dark')
        result.current.setColor('light', 'primary', '#AAAAAA')
      })

      expect(result.current.mode).toBe('dark')

      await act(async () => {
        result.current.resetScheme()
      })

      expect(result.current.mode).toBe('light')
      expect(result.current.colors.primary).toBe('#FFFFFF')
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('color-scheme')
    })
  })

  describe('edge cases', () => {
    it('should handle disabled system preference', async () => {
      const { result } = renderHook(() =>
        useColorScheme({ enableSystem: false, defaultMode: 'system' }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      // Should default to light when system is disabled
      expect(result.current.resolvedMode).toBe('light')
      expect(result.current.isSystemDark).toBe(false)

      // System changes should not affect the mode
      await act(async () => {
        ;(window.matchMedia as any).trigger(true)
      })

      expect(result.current.resolvedMode).toBe('light')
    })

    it('should handle storage errors gracefully', async () => {
      // Mock storage to throw errors
      window.localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full')
      })

      const { result } = renderHook(() => useColorScheme())

      await act(async () => {
        await vi.runAllTimersAsync()
        // Should not throw
        result.current.setMode('dark')
      })

      expect(result.current.mode).toBe('dark')
    })

    it('should cleanup media query listeners on unmount', async () => {
      const removeEventListenerSpy = vi.fn()
      ;(window.matchMedia('(prefers-color-scheme: dark)') as any).removeEventListener =
        removeEventListenerSpy

      const { unmount } = renderHook(() => useColorScheme())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalled()
    })
  })

  describe('edge cases continued', () => {
    it('should handle partial theme customization', async () => {
      const { result } = renderHook(() =>
        useColorScheme({
          themes: {
            light: { primary: '#CUSTOM' }, // Only override primary
          },
        }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.colors.primary).toBe('#CUSTOM')
      expect(result.current.colors.secondary).toBe('#F0F0F0') // Default
    })
  })
})
