/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNetwork } from '../../hooks/browser/useNetwork'

// Mock isSSR helper
vi.mock('../../helpers/is-ssr', () => ({
  isSSR: false,
}))

interface MockConnection {
  downlink?: number | null
  effectiveType?: string
  saveData?: boolean | null
  rtt?: number | null
  type?: string
  addEventListener?: (type: string, listener: () => void) => void
  removeEventListener?: (type: string, listener: () => void) => void
}

interface MockNavigator extends Omit<Navigator, 'connection'> {
  connection?: MockConnection
  onLine: boolean
}

describe('useNetwork', () => {
  const originalNavigator = globalThis.navigator
  const originalWindow = globalThis.window
  let mockNavigator: MockNavigator
  let connectionListeners: Map<string, () => void>
  let windowListeners: Map<string, EventListener>

  beforeEach(() => {
    vi.useFakeTimers()
    connectionListeners = new Map()
    windowListeners = new Map()
    
    // Setup mock navigator with connection
    mockNavigator = {
      ...originalNavigator,
      onLine: true,
      connection: {
        downlink: 10,
        effectiveType: '4g',
        saveData: false,
        rtt: 50,
        type: 'wifi',
        addEventListener: vi.fn((type: string, listener: () => void) => {
          connectionListeners.set(type, listener)
        }),
        removeEventListener: vi.fn((type: string, _listener: () => void) => {
          connectionListeners.delete(type)
        })
      }
    }

    // Mock window event listeners
    const mockAddEventListener = vi.fn((type: string, listener: EventListener) => {
      windowListeners.set(type, listener)
    })
    const mockRemoveEventListener = vi.fn((type: string, _listener: EventListener) => {
      windowListeners.delete(type)
    })
    const mockDispatchEvent = vi.fn()

    // Mock queueMicrotask to run immediately without timers
    globalThis.queueMicrotask = vi.fn((callback: () => void) => {
      callback()
    })

    Object.defineProperty(globalThis, 'navigator', {
      value: mockNavigator,
      configurable: true,
      writable: true
    })

    Object.defineProperty(globalThis, 'window', {
      value: {
        ...originalWindow,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: mockDispatchEvent
      },
      configurable: true,
      writable: true
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    connectionListeners.clear()
    windowListeners.clear()
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true
    })
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      configurable: true,
      writable: true
    })
  })

  describe('Initial state', () => {
    it('should initialize with navigator.onLine status when available', async () => {
      mockNavigator.onLine = true
      const { result } = renderHook(() => useNetwork())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      expect(result.current.isOnline).toBe(true)
    })

    it('should default to true when navigator is undefined (SSR)', () => {
      // Temporarily set navigator to undefined
      Object.defineProperty(globalThis, 'navigator', {
        value: undefined,
        configurable: true,
        writable: true
      })
      
      const { result } = renderHook(() => useNetwork())
      expect(result.current.isOnline).toBe(true)
      
      // Restore navigator
      Object.defineProperty(globalThis, 'navigator', {
        value: mockNavigator,
        configurable: true,
        writable: true
      })
    })

    it('should initialize with default network values', async () => {
      const { result } = renderHook(() => useNetwork())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      expect(result.current.downlink).toBe(10)
      expect(result.current.effectiveType).toBe('4g')
      expect(result.current.saveData).toBe(false)
      expect(result.current.rtt).toBe(50)
    })
  })

  describe('Connection API availability', () => {
    it('should handle missing connection API gracefully', async () => {
      delete mockNavigator.connection
      
      const { result } = renderHook(() => useNetwork())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      expect(result.current.isOnline).toBe(true)
      expect(result.current.downlink).toBe(null)
      expect(result.current.effectiveType).toBe('3g') // default fallback
    })

    it('should handle connection with missing properties', async () => {
      mockNavigator.connection = {}
      
      const { result } = renderHook(() => useNetwork())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      expect(result.current.downlink).toBe(null)
      expect(result.current.effectiveType).toBe('3g')
      expect(result.current.saveData).toBe(false)
      expect(result.current.rtt).toBe(null)
    })

    it('should handle connection without event listener methods', async () => {
      mockNavigator.connection = {
        downlink: 5,
        effectiveType: '3g',
        saveData: true,
        rtt: 100
      }
      
      const { result } = renderHook(() => useNetwork())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      expect(result.current.downlink).toBe(5)
      expect(result.current.effectiveType).toBe('3g')
      expect(result.current.saveData).toBe(true)
      expect(result.current.rtt).toBe(100)
    })
  })

  describe('Online/Offline events', () => {
    it('should handle online event', async () => {
      mockNavigator.onLine = false
      const { result } = renderHook(() => useNetwork())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      // Simulate going online
      mockNavigator.onLine = true
      await act(async () => {
        const onlineListener = windowListeners.get('online')
        onlineListener?.(new Event('online'))
      })
      
      expect(result.current.isOnline).toBe(true)
    })

    it('should handle offline event', async () => {
      mockNavigator.onLine = true
      const { result } = renderHook(() => useNetwork())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      // Verify initial online state
      expect(result.current.isOnline).toBe(true)
      
      // Simulate going offline
      mockNavigator.onLine = false
      await act(async () => {
        const offlineListener = windowListeners.get('offline')
        offlineListener?.(new Event('offline'))
      })
      
      expect(result.current.isOnline).toBe(false)
      expect(result.current.effectiveType).toBe('unknown')
      expect(result.current.saveData).toBe(false)
    })
  })

  describe('Connection change events', () => {
    it('should handle connection quality changes', async () => {
      const { result } = renderHook(() => useNetwork())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      // Change connection quality
      if (mockNavigator.connection) {
        mockNavigator.connection.downlink = 1
        mockNavigator.connection.effectiveType = '2g'
        mockNavigator.connection.rtt = 200
      }
      
      await act(async () => {
        const changeListener = connectionListeners.get('change')
        changeListener?.()
      })
      
      expect(result.current.downlink).toBe(1)
      expect(result.current.effectiveType).toBe('2g')
      expect(result.current.rtt).toBe(200)
    })

    it('should dispatch custom networkQualityChange event when connection changes', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      renderHook(() => useNetwork())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      // Change connection quality significantly
      if (mockNavigator.connection) {
        mockNavigator.connection.downlink = 0.5
        mockNavigator.connection.effectiveType = 'slow-2g'
      }
      
      await act(async () => {
        const changeListener = connectionListeners.get('change')
        changeListener?.()
      })
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'networkQualityChange',
          detail: expect.objectContaining({
            downlink: 0.5,
            effectiveType: 'slow-2g'
          })
        })
      )
    })
  })

  describe('Polling fallback', () => {
    it('should detect online state changes via polling', async () => {
      mockNavigator.onLine = true
      const { result } = renderHook(() => useNetwork())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      expect(result.current.isOnline).toBe(true)
      
      // Simulate navigator.onLine changing without event
      mockNavigator.onLine = false
      
      await act(async () => {
        // Advance timers by exactly the polling duration once
        await vi.advanceTimersByTimeAsync(5000)
      })
      
      expect(result.current.isOnline).toBe(false)
    })
  })

  describe('Utility functions', () => {
    describe('isSlowConnection', () => {
      it('should return true for slow-2g', async () => {
        mockNavigator.connection!.effectiveType = 'slow-2g'
        mockNavigator.connection!.downlink = 1
        
        const { result } = renderHook(() => useNetwork())
        
        await act(async () => {
          await vi.advanceTimersByTimeAsync(0)
          const changeListener = connectionListeners.get('change')
          changeListener?.()
        })
        
        expect(result.current.isSlowConnection?.()).toBe(true)
      })

      it('should return true for 2g', async () => {
        mockNavigator.connection!.effectiveType = '2g'
        mockNavigator.connection!.downlink = 1
        
        const { result } = renderHook(() => useNetwork())
        
        await act(async () => {
          await vi.advanceTimersByTimeAsync(0)
          const changeListener = connectionListeners.get('change')
          changeListener?.()
        })
        
        expect(result.current.isSlowConnection?.()).toBe(true)
      })

      it('should return false for fast connections', async () => {
        mockNavigator.connection!.effectiveType = '4g'
        mockNavigator.connection!.downlink = 10
        
        const { result } = renderHook(() => useNetwork())
        
        await act(async () => {
          await vi.advanceTimersByTimeAsync(0)
        })
        
        expect(result.current.isSlowConnection?.()).toBe(false)
      })
    })

    describe('connectionQuality', () => {
      it('should return "offline" when not online', async () => {
        const { result } = renderHook(() => useNetwork())
        
        await act(async () => {
          await vi.advanceTimersByTimeAsync(0)
        })
        
        mockNavigator.onLine = false
        await act(async () => {
          const offlineListener = windowListeners.get('offline')
          offlineListener?.(new Event('offline'))
        })
        
        expect(result.current.connectionQuality?.()).toBe('offline')
      })

      it('should return "excellent" for 4g', () => {
        const { result } = renderHook(() => useNetwork())
        
        // Mock connection is already set to 4g in beforeEach, no async needed
        expect(result.current.connectionQuality?.()).toBe('excellent')
      })
    })
  })

  describe('Memory leaks and cleanup', () => {
    it('should clean up event listeners on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const connectionRemoveSpy = vi.fn()
      
      if (mockNavigator.connection) {
        mockNavigator.connection.removeEventListener = connectionRemoveSpy
      }
      
      const { unmount } = renderHook(() => useNetwork())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
      expect(connectionRemoveSpy).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should clear polling interval on unmount', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      const { unmount } = renderHook(() => useNetwork())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      unmount()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    it('should handle missing queueMicrotask', () => {
      const originalQueueMicrotask = globalThis.queueMicrotask
      
      // Replace with setTimeout fallback before deleting
      globalThis.queueMicrotask = undefined as any
      
      const { result } = renderHook(() => useNetwork())
      
      // Should still work with setTimeout fallback
      expect(result.current.isOnline).toBe(true)
      
      // Restore original
      globalThis.queueMicrotask = originalQueueMicrotask
    })
  })

  describe('Type safety', () => {
    it('should handle generic type parameter', async () => {
      const { result } = renderHook(() => useNetwork<number>())
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      
      // Should have valid result after initial load
      expect(result.current).toBeDefined()
      expect(result.current.isOnline).toBe(true)
      
      // Type assertions - values should be numbers or null
      expect(typeof result.current.downlink === 'number' || result.current.downlink === null).toBe(true)
      expect(typeof result.current.rtt === 'number' || result.current.rtt === null).toBe(true)
    })
  })
})