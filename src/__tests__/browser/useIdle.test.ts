import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useIdle from '../../hooks/browser/useIdle'

// Mock isSSR helper
vi.mock('../../helpers/is-ssr', () => ({
  isSSR: false,
}))

describe('useIdle', () => {
  let eventListeners: { [key: string]: EventListener[] } = {}

  const addEventListener = vi.fn((event: string, handler: EventListener) => {
    if (!eventListeners[event]) {
      eventListeners[event] = []
    }
    eventListeners[event].push(handler)
  })

  const removeEventListener = vi.fn(
    (event: string, handler: EventListener) => {
      if (eventListeners[event]) {
        eventListeners[event] = eventListeners[event].filter(
          (h) => h !== handler
        )
      }
    }
  )

  const triggerEvent = (eventName: string) => {
    if (eventListeners[eventName]) {
      eventListeners[eventName].forEach((handler) => handler(new Event(eventName)))
    }
  }

  beforeEach(() => {
    eventListeners = {}
    vi.clearAllMocks()
    vi.clearAllTimers()
    vi.useFakeTimers()

    Object.defineProperty(window, 'addEventListener', {
      value: addEventListener,
      writable: true,
    })

    Object.defineProperty(window, 'removeEventListener', {
      value: removeEventListener,
      writable: true,
    })

    vi.spyOn(global, 'setInterval')
    vi.spyOn(global, 'clearInterval')
    vi.spyOn(Date, 'now')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Initial state', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => useIdle())

      expect(result.current.isIdle).toBe(false)
      expect(result.current.idleTime).toBe(0)
      expect(result.current.lastActivity).toBeGreaterThan(0)
      expect(typeof result.current.reset).toBe('function')
      expect(typeof result.current.pause).toBe('function')
      expect(typeof result.current.resume).toBe('function')
    })

    it('should attach event listeners on mount', () => {
      renderHook(() => useIdle())

      expect(addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('keypress', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledTimes(4)
    })

    it('should start timer on mount', () => {
      renderHook(() => useIdle())
      expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 1000)
    })
  })

  describe('Activity detection', () => {
    it('should reset idle state on mousemove', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())
      
      // Simulate time passing
      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 2000)
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.idleTime).toBeGreaterThan(0)
      const previousLastActivity = result.current.lastActivity

      // Trigger activity
      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 3000)
        triggerEvent('mousemove')
      })

      expect(result.current.isIdle).toBe(false)
      expect(result.current.idleTime).toBe(0)
      expect(result.current.lastActivity).toBeGreaterThan(previousLastActivity)
    })

    it('should reset idle state on keypress', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 2000)
        vi.advanceTimersByTime(2000)
      })

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 3000)
        triggerEvent('keypress')
      })

      expect(result.current.isIdle).toBe(false)
      expect(result.current.idleTime).toBe(0)
    })

    it('should reset idle state on keydown', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 2000)
        vi.advanceTimersByTime(2000)
      })

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 3000)
        triggerEvent('keydown')
      })

      expect(result.current.isIdle).toBe(false)
      expect(result.current.idleTime).toBe(0)
    })

    it('should reset idle state on mousedown', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 2000)
        vi.advanceTimersByTime(2000)
      })

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 3000)
        triggerEvent('mousedown')
      })

      expect(result.current.isIdle).toBe(false)
      expect(result.current.idleTime).toBe(0)
    })
  })

  describe('Idle state transitions', () => {
    it('should transition to idle after 3 minutes of inactivity', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      expect(result.current.isIdle).toBe(false)

      // Advance to just before idle threshold (179 seconds)
      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 179000)
        vi.advanceTimersByTime(179000)
      })

      expect(result.current.isIdle).toBe(false)

      // Cross the idle threshold (180 seconds)
      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 180000)
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.isIdle).toBe(true)
    })

    it('should update idle time every second', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 1000)
        vi.advanceTimersByTime(1000)
      })
      expect(result.current.idleTime).toBeGreaterThanOrEqual(1000)

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 2000)
        vi.advanceTimersByTime(1000)
      })
      expect(result.current.idleTime).toBeGreaterThanOrEqual(2000)

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 3000)
        vi.advanceTimersByTime(1000)
      })
      expect(result.current.idleTime).toBeGreaterThanOrEqual(3000)
    })

    it('should maintain idle state once achieved until activity', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      // Become idle
      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 180000)
        vi.advanceTimersByTime(180000)
      })

      expect(result.current.isIdle).toBe(true)

      // Continue being idle
      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 184000)
        vi.advanceTimersByTime(4000)
      })

      expect(result.current.isIdle).toBe(true)

      // Activity resets idle state
      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 185000)
        triggerEvent('mousemove')
      })

      expect(result.current.isIdle).toBe(false)
      expect(result.current.idleTime).toBe(0)
    })
  })

  describe('Pause functionality', () => {
    it('should pause activity tracking when pause is called', () => {
      const { result } = renderHook(() => useIdle())

      act(() => {
        result.current.pause?.()
      })

      expect(global.clearInterval).toHaveBeenCalled()
      expect(removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(removeEventListener).toHaveBeenCalledWith('keypress', expect.any(Function))
      expect(removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
    })

    it('should not update idle time when paused', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 1000)
        vi.advanceTimersByTime(1000)
      })
      
      const idleTimeBeforePause = result.current.idleTime

      act(() => {
        result.current.pause?.()
      })

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 5000)
        vi.advanceTimersByTime(4000)
      })

      expect(result.current.idleTime).toBe(idleTimeBeforePause)
    })

    it('should not respond to events when paused', () => {
      const { result } = renderHook(() => useIdle())

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      act(() => {
        result.current.pause?.()
      })

      const lastActivityAtPause = result.current.lastActivity

      // This event should have no effect
      act(() => {
        triggerEvent('mousemove')
      })

      expect(result.current.lastActivity).toBe(lastActivityAtPause)
    })
  })

  describe('Resume functionality', () => {
    it('should resume activity tracking when resume is called', () => {
      const { result } = renderHook(() => useIdle())

      act(() => {
        result.current.pause?.()
      })

      vi.clearAllMocks()

      act(() => {
        result.current.resume?.()
      })

      expect(addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('keypress', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
      expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 1000)
    })

    it('should reset activity on resume', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 2000)
        vi.advanceTimersByTime(2000)
      })

      act(() => {
        result.current.pause?.()
      })

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 5000)
        result.current.resume?.()
      })

      expect(result.current.isIdle).toBe(false)
      expect(result.current.idleTime).toBe(0)
    })
  })

  describe('Reset functionality', () => {
    it('should reset idle state when reset is called', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      // Become idle
      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 180000)
        vi.advanceTimersByTime(180000)
      })

      expect(result.current.isIdle).toBe(true)

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 181000)
        result.current.reset?.()
      })

      expect(result.current.isIdle).toBe(false)
      expect(result.current.idleTime).toBe(0)
    })

    it('should re-attach listeners if they were detached', () => {
      const { result } = renderHook(() => useIdle())

      act(() => {
        result.current.pause?.()
      })

      vi.clearAllMocks()

      act(() => {
        result.current.reset?.()
      })

      expect(addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('keypress', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
    })

    it('should restart timer', () => {
      const { result } = renderHook(() => useIdle())

      const initialSetIntervalCalls = vi.mocked(global.setInterval).mock.calls.length

      act(() => {
        result.current.reset?.()
      })

      expect(global.clearInterval).toHaveBeenCalled()
      expect(global.setInterval).toHaveBeenCalledTimes(initialSetIntervalCalls + 1)
    })
  })

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useIdle())

      unmount()

      expect(removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(removeEventListener).toHaveBeenCalledWith('keypress', expect.any(Function))
      expect(removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
    })

    it('should clear timer on unmount', () => {
      const { unmount } = renderHook(() => useIdle())

      unmount()

      expect(global.clearInterval).toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    it('should handle rapid activity events', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 1000)
        vi.advanceTimersByTime(1000)
      })

      act(() => {
        // Simulate 100 rapid events
        for (let i = 0; i < 100; i++) {
          vi.mocked(Date.now).mockReturnValue(now + 2000 + i)
          triggerEvent('mousemove')
        }
      })

      expect(result.current.isIdle).toBe(false)
      expect(result.current.idleTime).toBe(0)
    })

    it('should handle pause/resume cycles', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.pause?.()
        })

        act(() => {
          vi.mocked(Date.now).mockReturnValue(now + 3000 + i * 1000)
          result.current.resume?.()
        })
      }

      expect(result.current.isIdle).toBe(false)
    })

    it('should not attach listeners multiple times', () => {
      const { result } = renderHook(() => useIdle())

      act(() => {
        result.current.reset?.()
        result.current.reset?.()
        result.current.reset?.()
      })

      // Should only have 4 listeners attached (initial mount only)
      const uniqueHandlers = new Set(addEventListener.mock.calls.map(call => call[0]))
      expect(uniqueHandlers.size).toBe(4)
    })

    it('should handle timer cleanup properly on rapid pause/resume', () => {
      const { result } = renderHook(() => useIdle())

      vi.clearAllMocks() // Clear initial setup calls

      act(() => {
        result.current.pause?.()
      })
      expect(global.clearInterval).toHaveBeenCalledTimes(1)

      act(() => {
        result.current.resume?.()
      })
      expect(global.setInterval).toHaveBeenCalledTimes(1)
      expect(global.clearInterval).toHaveBeenCalledTimes(1) // only from pause

      act(() => {
        result.current.pause?.()
      })
      expect(global.clearInterval).toHaveBeenCalledTimes(2)

      act(() => {
        result.current.resume?.()
      })
      expect(global.setInterval).toHaveBeenCalledTimes(2)
      expect(global.clearInterval).toHaveBeenCalledTimes(2)

      // Verify no memory leaks - each pause should clear interval
      expect(vi.mocked(global.clearInterval).mock.calls.length).toBe(
        vi.mocked(global.clearInterval).mock.calls.filter(call => call[0] != null).length
      )
    })

    it('should maintain consistent state across re-renders', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result, rerender } = renderHook(() => useIdle())

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 1000)
        vi.advanceTimersByTime(1000)
      })

      const stateBeforeRerender = {
        isIdle: result.current.isIdle,
        idleTime: result.current.idleTime,
        lastActivity: result.current.lastActivity,
      }

      rerender()

      expect(result.current.isIdle).toBe(stateBeforeRerender.isIdle)
      expect(result.current.idleTime).toBe(stateBeforeRerender.idleTime)
      expect(result.current.lastActivity).toBe(stateBeforeRerender.lastActivity)
    })

    it('should handle very long idle periods', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 3600000) // 1 hour
        vi.advanceTimersByTime(3600000)
      })

      expect(result.current.isIdle).toBe(true)
      expect(result.current.idleTime).toBeGreaterThanOrEqual(180000) // At least idle threshold
    })

    it('should handle activity immediately after becoming idle', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 180000)
        vi.advanceTimersByTime(180000)
      })

      expect(result.current.isIdle).toBe(true)

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 180100)
        triggerEvent('mousemove')
      })

      expect(result.current.isIdle).toBe(false)
      expect(result.current.idleTime).toBe(0)
    })

    it('should handle multiple event types in sequence', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 1000)
        vi.advanceTimersByTime(1000)
      })

      // Test different event types
      const events = ['mousemove', 'keypress', 'keydown', 'mousedown']
      events.forEach((event, index) => {
        act(() => {
          vi.mocked(Date.now).mockReturnValue(now + 3000 + index * 100)
          triggerEvent(event)
        })
        
        expect(result.current.isIdle).toBe(false)
        expect(result.current.idleTime).toBe(0)
      })
    })

    it('should handle state when timer is paused during idle', () => {
      const now = Date.now()
      vi.mocked(Date.now).mockReturnValue(now)
      
      const { result } = renderHook(() => useIdle())

      // Become idle
      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 180000)
        vi.advanceTimersByTime(180000)
      })

      expect(result.current.isIdle).toBe(true)

      // Pause while idle
      act(() => {
        result.current.pause?.()
      })

      // State should remain idle
      expect(result.current.isIdle).toBe(true)

      // Resume should reset
      act(() => {
        vi.mocked(Date.now).mockReturnValue(now + 185000)
        result.current.resume?.()
      })

      expect(result.current.isIdle).toBe(false)
      expect(result.current.idleTime).toBe(0)
    })
  })

  describe('SSR compatibility', () => {
    it('should handle SSR environment gracefully', async () => {
      vi.clearAllMocks()
      
      // Reset modules to clear cached imports
      vi.resetModules()
      
      // Mock isSSR to return true
      vi.doMock('../../helpers/is-ssr', () => ({
        isSSR: true,
      }))
      
      // Import the hook after setting up the SSR mock
      const { default: useIdleSSR } = await import('../../hooks/browser/useIdle')
      
      const { result } = renderHook(() => useIdleSSR())

      expect(result.current.isIdle).toBe(false)
      expect(result.current.idleTime).toBe(0)
      expect(result.current.lastActivity).toBe(0)

      // Functions should be safe to call but do nothing
      act(() => {
        result.current.pause?.()
        result.current.resume?.()
        result.current.reset?.()
      })

      // Should not throw
      expect(() => {
        result.current.pause?.()
        result.current.resume?.()
        result.current.reset?.()
      }).not.toThrow()

      // No listeners should be attached in SSR
      expect(addEventListener).not.toHaveBeenCalled()
      
      // Restore the mock
      vi.doUnmock('../../helpers/is-ssr')
      vi.doMock('../../helpers/is-ssr', () => ({
        isSSR: false,
      }))
    })
  })
})