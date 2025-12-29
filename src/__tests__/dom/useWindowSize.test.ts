/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import useWindowSize from '../../hooks/dom/useWindowSize'

// Mock the isSSR helper
vi.mock('../../helpers/is-ssr', () => ({
  isSSR: false,
}))

describe('useWindowSize', () => {
  let originalInnerWidth: number
  let originalInnerHeight: number
  let originalOuterWidth: number
  let originalDevicePixelRatio: number

  beforeEach(() => {
    // Store original values
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight
    originalOuterWidth = window.outerWidth
    originalDevicePixelRatio = window.devicePixelRatio

    // Set default mock values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })
    Object.defineProperty(window, 'outerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 1,
    })

    vi.useFakeTimers()
  })

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    })
    Object.defineProperty(window, 'outerWidth', {
      writable: true,
      configurable: true,
      value: originalOuterWidth,
    })
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: originalDevicePixelRatio,
    })

    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Basic Functionality', () => {
    it('should initialize with provided initial dimensions', () => {
      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 800,
            initialHeight: 600,
            onChange: vi.fn(),
          },
        }),
      )

      expect(result.current.width).toBe(800)
      expect(result.current.height).toBe(600)
    })

    it('should use initialWidth for height when initialHeight is not provided', () => {
      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 900,
            onChange: vi.fn(),
          },
        }),
      )

      expect(result.current.height).toBe(900)
    })

    it('should update to actual window size on mount', async () => {
      vi.useRealTimers()

      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            onChange: vi.fn(),
          },
        }),
      )

      await waitFor(() => {
        expect(result.current.width).toBe(1024)
      })

      expect(result.current.height).toBe(768)
      expect(result.current.innerWidth).toBe(1024)
      expect(result.current.outerWidth).toBe(1024)

      vi.useFakeTimers()
    })

    it('should include lastUpdated timestamp', async () => {
      vi.useRealTimers()

      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            onChange: vi.fn(),
          },
        }),
      )

      await waitFor(() => {
        expect(result.current.lastUpdated).toBeInstanceOf(Date)
      })

      vi.useFakeTimers()
    })
  })

  describe('Orientation Detection', () => {
    it('should detect landscape orientation when width >= height', async () => {
      vi.useRealTimers()

      window.innerWidth = 1024
      window.innerHeight = 768

      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            onChange: vi.fn(),
          },
        }),
      )

      await waitFor(() => {
        expect(result.current.orientation).toBe('landscape')
      })

      vi.useFakeTimers()
    })

    it('should detect portrait orientation when width < height', async () => {
      vi.useRealTimers()

      window.innerWidth = 768
      window.innerHeight = 1024

      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            onChange: vi.fn(),
          },
        }),
      )

      await waitFor(() => {
        expect(result.current.orientation).toBe('portrait')
      })

      vi.useFakeTimers()
    })

    it('should listen to orientationchange event when listenOrientation is true', async () => {
      const onChange = vi.fn()
      renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            listenOrientation: true,
            onChange,
          },
        }),
      )

      await vi.runAllTimersAsync()
      onChange.mockClear()

      window.innerWidth = 768
      window.innerHeight = 1024
      window.dispatchEvent(new Event('orientationchange'))

      await vi.runAllTimersAsync()

      expect(onChange).toHaveBeenCalled()
    })

    it('should not listen to orientationchange when listenOrientation is false', async () => {
      const onChange = vi.fn()
      renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            listenOrientation: false,
            onChange,
          },
        }),
      )

      await vi.runAllTimersAsync()
      onChange.mockClear()

      act(() => {
        window.dispatchEvent(new Event('orientationchange'))
      })

      await vi.runAllTimersAsync()
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('Device Pixel Ratio Tracking', () => {
    it('should track devicePixelRatio when trackDevicePixelRatio is true', async () => {
      vi.useRealTimers()

      window.devicePixelRatio = 2

      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            trackDevicePixelRatio: true,
            onChange: vi.fn(),
          },
        }),
      )

      await waitFor(() => {
        expect(result.current.devicePixelRatio).toBe(2)
      })

      vi.useFakeTimers()
    })

    it('should not track devicePixelRatio when trackDevicePixelRatio is false', async () => {
      vi.useRealTimers()

      window.devicePixelRatio = 2

      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            trackDevicePixelRatio: false,
            onChange: vi.fn(),
          },
        }),
      )

      await waitFor(() => {
        expect(result.current.width).toBe(1024)
      })

      expect(result.current.devicePixelRatio).toBeUndefined()

      vi.useFakeTimers()
    })

    it('should default to 1 when devicePixelRatio is not available', async () => {
      vi.useRealTimers()

      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: undefined,
      })

      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            trackDevicePixelRatio: true,
            onChange: vi.fn(),
          },
        }),
      )

      await waitFor(() => {
        expect(result.current.devicePixelRatio).toBe(1)
      })

      vi.useFakeTimers()
    })
  })

  describe('Resize Event Handling', () => {
    it('should update dimensions on window resize', async () => {
      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            onChange: vi.fn(),
          },
        }),
      )

      await vi.runAllTimersAsync()

      window.innerWidth = 1280
      window.innerHeight = 720
      window.dispatchEvent(new Event('resize'))

      await vi.runAllTimersAsync()

      expect(result.current.width).toBe(1280)
      expect(result.current.height).toBe(720)
    })

    it('should call onChange callback on resize', async () => {
      const onChange = vi.fn()
      renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            onChange,
          },
        }),
      )

      await vi.runAllTimersAsync()
      onChange.mockClear()

      window.innerWidth = 1280
      window.dispatchEvent(new Event('resize'))

      await vi.runAllTimersAsync()

      expect(onChange).toHaveBeenCalled()
    })

    it('should handle multiple rapid resize events', async () => {
      const onChange = vi.fn()
      renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            onChange,
          },
        }),
      )

      await vi.runAllTimersAsync()
      onChange.mockClear()

      act(() => {
        for (let i = 0; i < 10; i++) {
          window.innerWidth = 1000 + i * 10
          window.dispatchEvent(new Event('resize'))
        }
      })

      await vi.runAllTimersAsync()
      expect(onChange).toHaveBeenCalledTimes(10)
    })
  })

  describe('Debouncing', () => {
    it('should debounce resize events', async () => {
      const onChange = vi.fn()
      renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            debounce: 300,
            onChange,
          },
        }),
      )

      await vi.runAllTimersAsync()
      onChange.mockClear()

      window.innerWidth = 1100
      window.dispatchEvent(new Event('resize'))

      expect(onChange).not.toHaveBeenCalled()

      vi.advanceTimersByTime(150)
      expect(onChange).not.toHaveBeenCalled()

      vi.advanceTimersByTime(150)
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('should reset debounce timer on subsequent resize events', async () => {
      const onChange = vi.fn()
      renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            debounce: 300,
            onChange,
          },
        }),
      )

      await vi.runAllTimersAsync()
      onChange.mockClear()

      window.innerWidth = 1100
      window.dispatchEvent(new Event('resize'))

      vi.advanceTimersByTime(200)

      window.innerWidth = 1200
      window.dispatchEvent(new Event('resize'))

      vi.advanceTimersByTime(200)
      expect(onChange).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('should clear debounce timer on unmount', async () => {
      const { unmount } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            debounce: 300,
            onChange: vi.fn(),
          },
        }),
      )

      await vi.runAllTimersAsync()

      window.dispatchEvent(new Event('resize'))
      unmount()

      const timersRemaining = vi.getTimerCount()
      expect(timersRemaining).toBe(0)
    })
  })

  describe('Throttling', () => {
    it('should throttle resize events', async () => {
      const onChange = vi.fn()
      renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            throttle: 300,
            onChange,
          },
        }),
      )

      await vi.runAllTimersAsync()
      onChange.mockClear()

      act(() => {
        window.innerWidth = 1100
        window.dispatchEvent(new Event('resize'))
      })
      await vi.runAllTimersAsync()
      expect(onChange).toHaveBeenCalledTimes(1)

      act(() => {
        vi.advanceTimersByTime(301)
        window.innerWidth = 1200
        window.dispatchEvent(new Event('resize'))
      })
      await vi.runAllTimersAsync()
      expect(onChange).toHaveBeenCalledTimes(2)
    })

    it('should allow immediate first call with throttle', async () => {
      const onChange = vi.fn()
      renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            throttle: 300,
            onChange,
          },
        }),
      )

      await vi.runAllTimersAsync()
      onChange.mockClear()

      act(() => {
        window.innerWidth = 1100
        window.dispatchEvent(new Event('resize'))
      })
      await vi.runAllTimersAsync()

      expect(onChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('Enabled/Disabled State', () => {
    it('should not add event listeners when enabled is false', async () => {
      const onChange = vi.fn()
      renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            enabled: false,
            onChange,
          },
        }),
      )

      await vi.runAllTimersAsync()
      onChange.mockClear()

      window.innerWidth = 1280
      window.dispatchEvent(new Event('resize'))

      await vi.runAllTimersAsync()

      expect(onChange).not.toHaveBeenCalled()
    })

    it('should maintain initial values when disabled', async () => {
      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            initialHeight: 400,
            enabled: false,
            onChange: vi.fn(),
          },
        }),
      )

      await vi.runAllTimersAsync()

      expect(result.current.width).toBe(500)
      expect(result.current.height).toBe(400)
    })

    it('should properly clean up event listeners on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            listenOrientation: true,
            onChange: vi.fn(),
          },
        }),
      )

      await vi.runAllTimersAsync()

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing onChange callback gracefully', async () => {
      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            onChange: undefined as any,
          },
        }),
      )

      await vi.runAllTimersAsync()

      window.innerWidth = 1280
      window.dispatchEvent(new Event('resize'))

      await vi.runAllTimersAsync()

      expect(result.current.width).toBe(1280)
    })

    it('should handle zero dimensions', async () => {
      vi.useRealTimers()

      window.innerWidth = 0
      window.innerHeight = 0

      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            onChange: vi.fn(),
          },
        }),
      )

      await waitFor(() => {
        expect(result.current.width).toBe(0)
      })

      expect(result.current.height).toBe(0)

      vi.useFakeTimers()
    })

    it('should handle very large dimensions', async () => {
      vi.useRealTimers()

      window.innerWidth = 99999
      window.innerHeight = 88888

      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            onChange: vi.fn(),
          },
        }),
      )

      await waitFor(() => {
        expect(result.current.width).toBe(99999)
      })

      expect(result.current.height).toBe(88888)

      vi.useFakeTimers()
    })

    it('should handle equal width and height (square)', async () => {
      window.innerWidth = 1000
      window.innerHeight = 1000

      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            onChange: vi.fn(),
          },
        }),
      )

      await vi.runAllTimersAsync()

      expect(result.current.orientation).toBe('landscape')
    })

    it('should handle negative debounce value', async () => {
      const onChange = vi.fn()
      renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            debounce: -100,
            onChange,
          },
        }),
      )

      await vi.runAllTimersAsync()
      onChange.mockClear()

      window.dispatchEvent(new Event('resize'))
      await vi.runAllTimersAsync()

      expect(onChange).toHaveBeenCalled()
    })

    it('should update lastUpdated on each resize', async () => {
      const { result } = renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            onChange: vi.fn(),
          },
        }),
      )

      await vi.runAllTimersAsync()
      const firstUpdate = result.current.lastUpdated

      vi.advanceTimersByTime(1000)

      window.innerWidth = 1280
      window.dispatchEvent(new Event('resize'))
      await vi.runAllTimersAsync()

      expect(result.current.lastUpdated).not.toEqual(firstUpdate)
    })

    it('should handle both debounce and throttle provided (debounce takes precedence)', async () => {
      const onChange = vi.fn()
      renderHook(() =>
        useWindowSize({
          options: {
            initialWidth: 500,
            debounce: 300,
            throttle: 100,
            onChange,
          },
        }),
      )

      await vi.runAllTimersAsync()
      onChange.mockClear()

      window.dispatchEvent(new Event('resize'))
      expect(onChange).not.toHaveBeenCalled()

      vi.advanceTimersByTime(300)
      expect(onChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('Options Edge Cases', () => {
    it('should handle undefined options object', () => {
      // With undefined options, initialWidth is undefined
      // The hook initializes with undefined values
      const { result } = renderHook(() =>
        useWindowSize({
          options: undefined as any,
        }),
      )

      // Hook should not crash and should return a result
      expect(result.current).toBeDefined()
      // Values will be undefined when options are undefined
      expect(result.current.width).toBeUndefined()
      expect(result.current.height).toBeUndefined()
    })

    it('should handle empty options object', () => {
      // Empty options means no initialWidth/Height
      const { result } = renderHook(() =>
        useWindowSize({
          options: {} as any,
        }),
      )

      expect(result.current).toBeDefined()
      // Values will be undefined when initialWidth is not provided
      expect(result.current.width).toBeUndefined()
    })
  })
})
