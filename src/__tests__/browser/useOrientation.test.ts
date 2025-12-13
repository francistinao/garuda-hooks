/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOrentation } from '../../hooks/browser/useOrientation'

describe('useOrientation', () => {
  let originalScreen: Screen
  let originalInnerWidth: number
  let originalInnerHeight: number
  let originalDeviceOrientationEvent: any
  let addEventListenerSpy: any
  let removeEventListenerSpy: any
  let screenAddEventListenerSpy: any
  let screenRemoveEventListenerSpy: any
  let clearTimeoutSpy: any

  beforeEach(() => {
    vi.useFakeTimers()
    originalScreen = window.screen
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight
    originalDeviceOrientationEvent = window.DeviceOrientationEvent

    // Ensure window.screen exists
    if (!window.screen) {
      Object.defineProperty(window, 'screen', {
        value: {
          width: 1024,
          height: 768,
          availWidth: 1024,
          availHeight: 768,
        },
        writable: true,
        configurable: true,
      })
    }

    addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')

    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true })
    Object.defineProperty(window, 'innerHeight', {
      value: 1024,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    vi.useRealTimers()

    Object.defineProperty(window, 'screen', {
      value: originalScreen,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'DeviceOrientationEvent', {
      value: originalDeviceOrientationEvent,
      writable: true,
      configurable: true,
    })

    addEventListenerSpy?.mockRestore()
    removeEventListenerSpy?.mockRestore()
    screenAddEventListenerSpy?.mockRestore()
    screenRemoveEventListenerSpy?.mockRestore()
    clearTimeoutSpy?.mockRestore()
  })

  describe('initial state', () => {
    it('should initialize with default orientation state', () => {
      const { result } = renderHook(() => useOrentation())

      expect(result.current.orientation).toBeDefined()
      expect(result.current.orientation?.type).toBe('portrait')
      expect(result.current.orientation?.angle).toBe(0)
      expect(result.current.orientation?.screen).toEqual({ width: 768, height: 1024 })
      expect(result.current.orientation?.device).toEqual({
        alpha: null,
        beta: null,
        gamma: null,
        absolute: null,
      })
      expect(result.current.orientation?.supported).toEqual({
        screenOrientation: false,
        deviceOrientation: true,
      })
      expect(result.current.orientation?.permission).toBe('prompt')
      expect(result.current.orientation?.lastUpdated).toBeDefined()
    })

    it('should update screen dimensions after mount', async () => {
      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.screen.width).toBe(768)
      expect(result.current.orientation?.screen.height).toBe(1024)
    })
  })

  describe('screen orientation API', () => {
    it('should detect portrait orientation when height > width', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 400,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.type).toBe('portrait')
      expect(result.current.orientation?.angle).toBe(0)
    })

    it('should detect landscape orientation when width > height', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 800,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window, 'innerHeight', {
        value: 400,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.type).toBe('landscape')
      expect(result.current.orientation?.angle).toBe(90)
    })

    it('should handle screen.orientation API when available', async () => {
      const mockOrientation = {
        angle: 90,
        type: 'landscape-primary',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      const mockScreen = {
        ...window.screen,
        orientation: mockOrientation,
      }

      Object.defineProperty(window, 'screen', {
        value: mockScreen,
        writable: true,
        configurable: true,
      })
      screenAddEventListenerSpy = vi.spyOn(mockScreen.orientation, 'addEventListener')
      screenRemoveEventListenerSpy = vi.spyOn(mockScreen.orientation, 'removeEventListener')

      const { result, unmount } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.type).toBe('landscape')
      expect(result.current.orientation?.angle).toBe(90)

      expect(screenAddEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))

      unmount()
      expect(screenRemoveEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should handle all valid orientation angles', async () => {
      const angles = [0, 90, 180, 270]

      for (const angle of angles) {
        const mockOrientation = {
          angle,
          type: angle === 0 || angle === 180 ? 'portrait-primary' : 'landscape-primary',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }

        const mockScreen = {
          ...window.screen,
          orientation: mockOrientation,
        }

        Object.defineProperty(window, 'screen', {
          value: mockScreen,
          writable: true,
          configurable: true,
        })

        const { result } = renderHook(() => useOrentation())

        await act(async () => {
          await vi.runAllTimersAsync()
        })

        expect(result.current.orientation?.angle).toBe(angle)
        expect(result.current.orientation?.type).toBe(
          angle === 0 || angle === 180 ? 'portrait' : 'landscape',
        )
      }
    })

    it('should handle invalid orientation angles', async () => {
      const mockOrientation = {
        angle: 45, // Invalid angle
        type: 'portrait-primary',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      const mockScreen = {
        ...window.screen,
        orientation: mockOrientation,
      }

      Object.defineProperty(window, 'screen', {
        value: mockScreen,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.angle).toBeNull()
      expect(result.current.orientation?.type).toBe('portrait')
    })

    it('should handle portrait-secondary orientation type', async () => {
      const mockOrientation = {
        angle: 180,
        type: 'portrait-secondary',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      const mockScreen = {
        ...window.screen,
        orientation: mockOrientation,
      }

      Object.defineProperty(window, 'screen', {
        value: mockScreen,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.type).toBe('portrait')
      expect(result.current.orientation?.angle).toBe(180)
    })

    it('should handle landscape-secondary orientation type', async () => {
      const mockOrientation = {
        angle: 270,
        type: 'landscape-secondary',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      const mockScreen = {
        ...window.screen,
        orientation: mockOrientation,
      }

      Object.defineProperty(window, 'screen', {
        value: mockScreen,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.type).toBe('landscape')
      expect(result.current.orientation?.angle).toBe(270)
    })
  })

  describe('resize events', () => {
    it('should update orientation on window resize', async () => {
      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      // Change to landscape
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window, 'innerHeight', {
        value: 768,
        writable: true,
        configurable: true,
      })

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current.orientation?.type).toBe('landscape')
      expect(result.current.orientation?.screen).toEqual({ width: 1024, height: 768 })
    })

    it('should debounce resize events', async () => {
      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      const initialLastUpdated = result.current.orientation?.lastUpdated

      // Fire multiple resize events rapidly
      act(() => {
        for (let i = 0; i < 5; i++) {
          window.dispatchEvent(new Event('resize'))
        }
      })

      // Should have called clearTimeout for debouncing
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(4) // First resize doesn't clear, then 4 clears

      // Advance time but not enough for debounce
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Should not have updated yet
      expect(result.current.orientation?.lastUpdated).toBe(initialLastUpdated)

      // Complete the debounce
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Should have updated only once
      expect(result.current.orientation?.lastUpdated).toBeGreaterThan(initialLastUpdated!)
    })

    it('should handle orientation change events', async () => {
      const mockOrientation = {
        angle: 0,
        type: 'portrait-primary',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      const mockScreen = {
        ...window.screen,
        orientation: mockOrientation,
      }

      Object.defineProperty(window, 'screen', {
        value: mockScreen,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      const changeHandler = mockOrientation.addEventListener.mock.calls[0]?.[1]

      // Update orientation and trigger change event
      mockOrientation.angle = 90
      mockOrientation.type = 'landscape-primary'

      await act(async () => {
        changeHandler?.()
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.type).toBe('landscape')
      expect(result.current.orientation?.angle).toBe(90)
    })
  })

  describe('device orientation events', () => {
    it('should track device motion when trackDeviceMotion is true', async () => {
      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: class DeviceOrientationEvent {},
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(addEventListenerSpy).toHaveBeenCalledWith('deviceorientation', expect.any(Function))

      const handler = addEventListenerSpy.mock.calls.find(
        (call: string[]) => call[0] === 'deviceorientation',
      )?.[1]

      const mockEvent = {
        alpha: 45,
        beta: 30,
        gamma: 15,
        absolute: true,
      }

      await act(async () => {
        handler?.(mockEvent as DeviceOrientationEvent)
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.device).toEqual({
        alpha: 45,
        beta: 30,
        gamma: 15,
        absolute: true,
      })
    })

    it('should not track device motion when trackDeviceMotion is false', async () => {
      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: class DeviceOrientationEvent {},
        writable: true,
        configurable: true,
      })

      renderHook(() => useOrentation({ trackDeviceMotion: false, debounce: 200, idleAware: false }))

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      const deviceOrientationCalls = addEventListenerSpy.mock.calls.filter(
        (call: string[]) => call[0] === 'deviceorientation',
      )
      expect(deviceOrientationCalls).toHaveLength(0)
    })

    it('should handle null device orientation values', async () => {
      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: class DeviceOrientationEvent {},
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      const handler = addEventListenerSpy.mock.calls.find(
        (call: string[]) => call[0] === 'deviceorientation',
      )?.[1]

      const mockEvent = {
        alpha: null,
        beta: null,
        gamma: null,
        absolute: null,
      }

      await act(async () => {
        handler?.(mockEvent as any)
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.device).toEqual({
        alpha: null,
        beta: null,
        gamma: null,
        absolute: null,
      })
    })

    it('should handle partial device orientation values', async () => {
      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: class DeviceOrientationEvent {},
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      const handler = addEventListenerSpy.mock.calls.find(
        (call: string[]) => call[0] === 'deviceorientation',
      )?.[1]

      const mockEvent = {
        alpha: 90,
        beta: null,
        gamma: 45,
        absolute: false,
      }

      await act(async () => {
        handler?.(mockEvent as any)
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.device).toEqual({
        alpha: 90,
        beta: null,
        gamma: 45,
        absolute: false,
      })
    })
  })

  describe('permission handling', () => {
    it('should request permission when DeviceOrientationEvent.requestPermission exists', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted')

      class MockDeviceOrientationEvent {
        static requestPermission = mockRequestPermission
      }

      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: MockDeviceOrientationEvent,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(mockRequestPermission).toHaveBeenCalled()
      expect(result.current.orientation?.permission).toBe('granted')

      expect(addEventListenerSpy).toHaveBeenCalledWith('deviceorientation', expect.any(Function))
    })

    it('should handle denied permission', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('denied')

      class MockDeviceOrientationEvent {
        static requestPermission = mockRequestPermission
      }

      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: MockDeviceOrientationEvent,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(mockRequestPermission).toHaveBeenCalled()
      expect(result.current.orientation?.permission).toBe('denied')

      // Should not add event listener when permission is denied
      const deviceOrientationCalls = addEventListenerSpy.mock.calls.filter(
        (call: string[]) => call[0] === 'deviceorientation',
      )
      expect(deviceOrientationCalls).toHaveLength(0)
    })

    it('should handle prompt permission state', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('prompt')

      class MockDeviceOrientationEvent {
        static requestPermission = mockRequestPermission
      }

      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: MockDeviceOrientationEvent,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.permission).toBe('prompt')

      // Should not add event listener when permission is in prompt state
      const deviceOrientationCalls = addEventListenerSpy.mock.calls.filter(
        (call: string[]) => call[0] === 'deviceorientation',
      )
      expect(deviceOrientationCalls).toHaveLength(0)
    })

    it('should handle permission request errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockRequestPermission = vi.fn().mockRejectedValue(new Error('Permission error'))

      class MockDeviceOrientationEvent {
        static requestPermission = mockRequestPermission
      }

      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: MockDeviceOrientationEvent,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'DeviceOrientation permission request failed:',
        expect.any(Error),
      )
      expect(result.current.orientation?.permission).toBe('denied')

      consoleErrorSpy.mockRestore()
    })

    it('should handle null permission response', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue(null)

      class MockDeviceOrientationEvent {
        static requestPermission = mockRequestPermission
      }

      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: MockDeviceOrientationEvent,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.permission).toBe('denied')
    })

    it('should set permission as not-required when no requestPermission method', async () => {
      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: class DeviceOrientationEvent {},
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.permission).toBe('not-required')

      expect(addEventListenerSpy).toHaveBeenCalledWith('deviceorientation', expect.any(Function))
    })
  })

  describe('SSR handling', () => {
    it('should handle SSR environment gracefully', async () => {
      // Reset all mocks and modules
      vi.resetModules()
      vi.clearAllMocks()

      // Mock SSR environment before importing
      vi.doMock('../../helpers/is-ssr', () => ({
        isSSR: true,
      }))

      // Import the module with SSR mocked
      const { useOrentation: useOrentationSSR } = await import('../../hooks/browser/useOrientation')

      const { result } = renderHook(() => useOrentationSSR())

      // Should return null in SSR
      expect(result.current.orientation).toBeNull()

      // Should not add any event listeners
      expect(addEventListenerSpy).not.toHaveBeenCalled()

      // Clean up
      vi.doUnmock('../../helpers/is-ssr')
      vi.resetModules()
    })
  })

  describe('cleanup', () => {
    it('should remove all event listeners on unmount', async () => {
      const mockOrientation = {
        angle: 0,
        type: 'portrait-primary',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      const mockScreen = {
        ...window.screen,
        orientation: mockOrientation,
      }

      Object.defineProperty(window, 'screen', {
        value: mockScreen,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: class DeviceOrientationEvent {},
        writable: true,
        configurable: true,
      })

      const { unmount } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('deviceorientation', expect.any(Function))
      expect(mockOrientation.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      )
    })

    it('should clear debounce timer on unmount', async () => {
      const { unmount } = renderHook(() => useOrentation())

      // Trigger a resize to start debounce timer
      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      unmount()

      // Timer should be cleared
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle missing screen.orientation gracefully', async () => {
      const mockScreen = {
        ...window.screen,
        orientation: undefined,
      }

      Object.defineProperty(window, 'screen', {
        value: mockScreen,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      // Should fallback to window dimensions
      expect(result.current.orientation?.type).toBe('portrait')
      expect(result.current.orientation?.angle).toBe(0)
    })

    it('should handle missing DeviceOrientationEvent gracefully', async () => {
      // Store original and delete the property completely
      const originalDeviceOrientationEvent = (window as any).DeviceOrientationEvent
      delete (window as any).DeviceOrientationEvent

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.permission).toBe('not-required')

      const deviceOrientationCalls = addEventListenerSpy.mock.calls.filter(
        (call: string[]) => call[0] === 'deviceorientation',
      )
      expect(deviceOrientationCalls).toHaveLength(0)

      // Restore original
      if (originalDeviceOrientationEvent) {
        Object.defineProperty(window, 'DeviceOrientationEvent', {
          value: originalDeviceOrientationEvent,
          writable: true,
          configurable: true,
        })
      }
    })

    it('should handle square viewport dimensions', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 500,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window, 'innerHeight', {
        value: 500,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      // When equal, should default to portrait
      expect(result.current.orientation?.type).toBe('portrait')
      expect(result.current.orientation?.angle).toBe(0)
    })

    it('should handle very small viewport dimensions', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 0, writable: true, configurable: true })
      Object.defineProperty(window, 'innerHeight', { value: 0, writable: true, configurable: true })

      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.screen).toEqual({ width: 0, height: 0 })
      expect(result.current.orientation?.type).toBe('portrait') // 0 > 0 is false, defaults to portrait
    })

    it('should handle negative device orientation values', async () => {
      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: class DeviceOrientationEvent {},
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      const handler = addEventListenerSpy.mock.calls.find(
        (call: string[]) => call[0] === 'deviceorientation',
      )?.[1]

      const mockEvent = {
        alpha: -45,
        beta: -90,
        gamma: -180,
        absolute: true,
      }

      await act(async () => {
        handler?.(mockEvent as any)
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.device).toEqual({
        alpha: -45,
        beta: -90,
        gamma: -180,
        absolute: true,
      })
    })

    it('should handle extremely large device orientation values', async () => {
      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: class DeviceOrientationEvent {},
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      const handler = addEventListenerSpy.mock.calls.find(
        (call: string[]) => call[0] === 'deviceorientation',
      )?.[1]

      const mockEvent = {
        alpha: 720, // 2 full rotations
        beta: 540, // 1.5 rotations
        gamma: 360, // 1 full rotation
        absolute: false,
      }

      await act(async () => {
        handler?.(mockEvent as any)
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.device).toEqual({
        alpha: 720,
        beta: 540,
        gamma: 360,
        absolute: false,
      })
    })

    it('should handle rapid successive orientation changes', async () => {
      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: class DeviceOrientationEvent {},
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      const handler = addEventListenerSpy.mock.calls.find(
        (call: string[]) => call[0] === 'deviceorientation',
      )?.[1]

      // Fire multiple events rapidly
      const events = [
        { alpha: 0, beta: 0, gamma: 0, absolute: true },
        { alpha: 45, beta: 30, gamma: 15, absolute: false },
        { alpha: 90, beta: 60, gamma: 30, absolute: true },
        { alpha: 135, beta: 90, gamma: 45, absolute: false },
        { alpha: 180, beta: 120, gamma: 60, absolute: true },
      ]

      await act(async () => {
        events.forEach((event) => {
          handler?.(event as any)
        })
        await vi.runAllTimersAsync()
      })

      // Should have the last value
      expect(result.current.orientation?.device).toEqual({
        alpha: 180,
        beta: 120,
        gamma: 60,
        absolute: true,
      })
    })

    it('should handle undefined options gracefully', () => {
      const { result } = renderHook(() => useOrentation(undefined))

      expect(result.current.orientation).toBeDefined()
      expect(result.current.orientation?.type).toBe('portrait')
    })

    it('should handle all options defined', async () => {
      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: class DeviceOrientationEvent {},
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({
          trackDeviceMotion: true,
          debounce: 500,
          idleAware: true,
        }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation).toBeDefined()
      expect(addEventListenerSpy).toHaveBeenCalledWith('deviceorientation', expect.any(Function))
    })

    it('should preserve existing state when updating partial values', async () => {
      const mockOrientation = {
        angle: 0,
        type: 'portrait-primary',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      const mockScreen = {
        ...window.screen,
        orientation: mockOrientation,
      }

      Object.defineProperty(window, 'screen', {
        value: mockScreen,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window, 'DeviceOrientationEvent', {
        value: class DeviceOrientationEvent {},
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      // Set device orientation
      const deviceHandler = addEventListenerSpy.mock.calls.find(
        (call: string[]) => call[0] === 'deviceorientation',
      )?.[1]

      await act(async () => {
        deviceHandler?.({ alpha: 45, beta: 30, gamma: 15, absolute: true } as any)
        await vi.runAllTimersAsync()
      })

      expect(result.current.orientation?.device.alpha).toBe(45)

      const deviceState = result.current.orientation?.device

      // Now trigger a resize and orientation change
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window, 'innerHeight', {
        value: 768,
        writable: true,
        configurable: true,
      })

      // Also update the mock screen orientation to landscape
      mockOrientation.type = 'landscape-primary'
      mockOrientation.angle = 90

      await act(async () => {
        window.dispatchEvent(new Event('resize'))
        // Also trigger screen orientation change
        const orientationHandler = mockOrientation.addEventListener.mock.calls.find(
          (call: string[]) => call[0] === 'change',
        )?.[1]
        orientationHandler?.()
        vi.advanceTimersByTime(200)
        await vi.runAllTimersAsync()
      })

      // Device state should be preserved
      expect(result.current.orientation?.type).toBe('landscape')
      expect(result.current.orientation?.device).toEqual(deviceState)
    })

    it('should handle missing window object gracefully', () => {
      // Instead of removing window completely (which breaks renderHook),
      // test that the hook handles missing window properties
      const originalInnerWidth = window.innerWidth
      const originalInnerHeight = window.innerHeight
      const originalScreen = window.screen

      try {
        // @ts-expect-error - Simulating missing properties
        delete window.innerWidth
        // @ts-expect-error - Simulating missing properties
        delete window.innerHeight
        // @ts-expect-error - Simulating missing properties
        delete window.screen

        const { result } = renderHook(() => useOrentation())

        // Should not crash and return some default state
        expect(result.current.orientation).toBeDefined()
        expect(result.current.orientation?.screen).toEqual({ width: undefined, height: undefined })
      } finally {
        Object.defineProperty(window, 'innerWidth', {
          value: originalInnerWidth,
          writable: true,
          configurable: true,
        })
        Object.defineProperty(window, 'innerHeight', {
          value: originalInnerHeight,
          writable: true,
          configurable: true,
        })
        Object.defineProperty(window, 'screen', {
          value: originalScreen,
          writable: true,
          configurable: true,
        })
      }
    })

    it('should update lastUpdated timestamp on each change', async () => {
      const { result } = renderHook(() => useOrentation())

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      const initialTimestamp = result.current.orientation?.lastUpdated

      // Wait a bit
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Trigger a resize
      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current.orientation?.lastUpdated).toBeGreaterThan(initialTimestamp!)
    })
  })

  describe('multiple instances', () => {
    it('should handle multiple hook instances independently', async () => {
      const { result: result1 } = renderHook(() => useOrentation())
      const { result: result2 } = renderHook(() =>
        useOrentation({ trackDeviceMotion: true, debounce: 200, idleAware: false }),
      )

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      // Both should have independent state
      expect(result1.current.orientation).toBeDefined()
      expect(result2.current.orientation).toBeDefined()

      // Verify both registered resize listeners
      const resizeCalls = addEventListenerSpy.mock.calls.filter(
        (call: string[]) => call[0] === 'resize',
      )
      expect(resizeCalls.length).toBeGreaterThanOrEqual(2)
    })
  })
})
