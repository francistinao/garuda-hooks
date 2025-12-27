/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useClickOutside from '../../hooks/dom/useClickOutside'
import { RefObject } from 'react'

// Mock isSSR
vi.mock('../../helpers/is-ssr', () => ({
  isSSR: false,
}))

describe('useClickOutside', () => {
  let container: HTMLElement
  let inside: HTMLElement
  let outside: HTMLElement

  beforeEach(() => {
    // Setup DOM nodes
    container = document.createElement('div')
    inside = document.createElement('div')
    outside = document.createElement('div')
    container.appendChild(inside)
    document.body.appendChild(container)
    document.body.appendChild(outside)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('should call handler when clicking outside a single ref', () => {
    const ref: RefObject<HTMLElement> = { current: container }
    const handler = vi.fn()

    renderHook(() => useClickOutside(ref, handler))

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      outside.dispatchEvent(event)
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not call handler when clicking inside a single ref', () => {
    const ref: RefObject<HTMLElement> = { current: container }
    const handler = vi.fn()

    renderHook(() => useClickOutside(ref, handler))

    act(() => {
      inside.click()
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should work with multiple refs', () => {
    const ref1: RefObject<HTMLElement> = { current: container }
    const ref2: RefObject<HTMLElement> = { current: inside }
    const handler = vi.fn()

    renderHook(() => useClickOutside([ref1, ref2], handler))

    act(() => {
      const outsideEvent = new MouseEvent('mousedown', { bubbles: true })
      outside.dispatchEvent(outsideEvent)
    })

    expect(handler).toHaveBeenCalledTimes(1)

    act(() => {
      const insideEvent = new MouseEvent('mousedown', { bubbles: true })
      inside.dispatchEvent(insideEvent)
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not call handler when disabled', () => {
    const ref: RefObject<HTMLElement> = { current: container }
    const handler = vi.fn()

    renderHook(() => useClickOutside(ref, handler, { enabled: false }))

    act(() => {
      outside.click()
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should attach multiple event types', () => {
    const ref: RefObject<HTMLElement> = { current: container }
    const handler = vi.fn()

    renderHook(() => useClickOutside(ref, handler, { eventTypes: ['mousedown', 'touchstart'] }))

    act(() => {
      const mousedown = new MouseEvent('mousedown', { bubbles: true })
      document.dispatchEvent(mousedown)
      const touchstart = new TouchEvent('touchstart', { bubbles: true })
      document.dispatchEvent(touchstart)
    })

    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('should clean up event listeners on unmount', () => {
    const ref: RefObject<HTMLElement> = { current: container }
    const handler = vi.fn()

    const { unmount } = renderHook(() => useClickOutside(ref, handler))

    const removeSpy = vi.spyOn(document, 'removeEventListener')

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), undefined)
    expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), undefined)
  })

  it('should handle null refs gracefully', () => {
    const ref: RefObject<HTMLElement | null> = { current: null }
    const handler = vi.fn()

    renderHook(() => useClickOutside(ref, handler))

    act(() => {
      const event = new MouseEvent('mousedown', { bubbles: true })
      outside.dispatchEvent(event)
    })

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
