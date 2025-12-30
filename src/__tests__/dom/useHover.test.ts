import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHover } from '../../hooks/dom/useHover'
import { RefObject } from 'react'

// Mock isSSR
vi.mock('../../helpers/is-ssr', () => ({
  isSSR: false,
}))

describe('useHover', () => {
  let container: HTMLElement
  let child: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    child = document.createElement('div')
    container.appendChild(child)
    document.body.appendChild(container)
    vi.useFakeTimers()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('should set isHovered to true on mouseenter and false on mouseleave', () => {
    const ref: RefObject<HTMLElement> = { current: container }
    const onHoverChange = vi.fn()

    const { result } = renderHook(() =>
      useHover({
        refs: ref,
        options: {
          enabled: true,
          delayEnter: 0,
          delayLeave: 0,
          onHoverChange,
          eventTypes: ['mouseenter', 'mouseleave', 'pointerenter', 'pointerleave'],
        },
      }),
    )

    // Simulate mouseenter
    act(() => {
      container.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    })
    expect(result.current.isHovered).toBe(true)
    expect(onHoverChange).toHaveBeenCalled()

    // Simulate mouseleave
    act(() => {
      container.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    })
    expect(result.current.isHovered).toBe(false)
  })

  it('should work with multiple refs', () => {
    const ref1: RefObject<HTMLElement> = { current: container }
    const ref2: RefObject<HTMLElement> = { current: child }
    const onHoverChange = vi.fn()

    const { result } = renderHook(() =>
      useHover({
        refs: [ref1, ref2],
        options: {
          enabled: true,
          delayEnter: 0,
          delayLeave: 0,
          onHoverChange,
          eventTypes: ['mouseenter', 'mouseleave', 'pointerenter', 'pointerleave'],
        },
      }),
    )

    act(() => {
      child.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    })
    expect(result.current.isHovered).toBe(true)

    act(() => {
      container.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    })
    expect(result.current.isHovered).toBe(false)
  })

  it('should respect delayEnter and delayLeave', () => {
    const ref: RefObject<HTMLElement> = { current: container }
    const { result } = renderHook(() =>
      useHover({
        refs: ref,
        options: {
          enabled: true,
          delayEnter: 100,
          delayLeave: 200,
          onHoverChange: () => {},
          eventTypes: ['mouseenter', 'mouseleave', 'pointerenter', 'pointerleave'],
        },
      }),
    )

    act(() => {
      container.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    })
    expect(result.current.isHovered).toBe(false) // delay not passed yet

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current.isHovered).toBe(true)

    act(() => {
      container.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    })
    expect(result.current.isHovered).toBe(true) // delayLeave not passed

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.isHovered).toBe(false)
  })

  it('should cancel leave timeout if enter happens during delayLeave', () => {
    const ref: RefObject<HTMLElement> = { current: container }
    const { result } = renderHook(() =>
      useHover({
        refs: ref,
        options: {
          enabled: true,
          delayEnter: 50,
          delayLeave: 100,
          onHoverChange: () => {},
          eventTypes: ['mouseenter', 'mouseleave', 'pointerenter', 'pointerleave'],
        },
      }),
    )

    act(() => {
      container.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    })
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(result.current.isHovered).toBe(true)

    act(() => {
      container.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    })
    act(() => {
      vi.advanceTimersByTime(50) // halfway
    })

    act(() => {
      container.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    })
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(result.current.isHovered).toBe(true) // still hovered
  })

  it('should handle null refs gracefully', () => {
    const ref: RefObject<HTMLElement | null> = { current: null }
    const { result } = renderHook(() =>
      useHover({
        refs: ref,
        options: {
          enabled: true,
          delayEnter: 0,
          delayLeave: 0,
          onHoverChange: () => {},
          eventTypes: ['mouseenter', 'mouseleave', 'pointerenter', 'pointerleave'],
        },
      }),
    )

    // Should not throw
    act(() => {
      result.current.setIsHovered(true)
    })
    expect(result.current.isHovered).toBe(true)
  })

  it('should not attach events when disabled', () => {
    const ref: RefObject<HTMLElement> = { current: container }
    const { result } = renderHook(() =>
      useHover({
        refs: ref,
        options: {
          enabled: false,
          delayEnter: 0,
          delayLeave: 0,
          onHoverChange: () => {},
          eventTypes: ['mouseenter', 'mouseleave', 'pointerenter', 'pointerleave'],
        },
      }),
    )

    act(() => {
      container.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    })
    expect(result.current.isHovered).toBe(false)
  })

  it('should remove event listeners on unmount', () => {
    const ref: RefObject<HTMLElement> = { current: container }
    const addSpy = vi.spyOn(container, 'addEventListener')
    const removeSpy = vi.spyOn(container, 'removeEventListener')

    const { unmount } = renderHook(() =>
      useHover({
        refs: ref,
        options: {
          enabled: true,
          delayEnter: 0,
          delayLeave: 0,
          onHoverChange: () => {},
          eventTypes: ['mouseenter', 'mouseleave', 'pointerenter', 'pointerleave'],
        },
      }),
    )

    expect(addSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Function))
    unmount()
    expect(removeSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Function))
  })
})
