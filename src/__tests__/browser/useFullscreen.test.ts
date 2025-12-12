/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFullscreen } from '../../hooks/browser/useFullscreen'

// helpers using real jsdom document, just stubbing fullscreen bits
const dispatchFsChange = () => {
  document.dispatchEvent(new Event('fullscreenchange'))
  document.dispatchEvent(new Event('webkitfullscreenchange'))
  document.dispatchEvent(new Event('mozfullscreenchange'))
  document.dispatchEvent(new Event('MSFullscreenChange'))
}

const resetFullscreenProps = () => {
  ;(document as any).fullscreenEnabled = true
  ;(document as any).fullscreenElement = null
  ;(document as any).exitFullscreen = undefined
  ;(document as any).webkitExitFullscreen = undefined
  ;(document as any).mozCancelFullScreen = undefined
  ;(document as any).msExitFullscreen = undefined
}

describe('useFullscreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetFullscreenProps()
  })

  it('reports unsupported when fullscreenEnabled is false', () => {
    ;(document as any).fullscreenEnabled = false
    const { result } = renderHook(() => useFullscreen())
    expect(result.current.isSupported).toBe(false)
  })

  it('uses provided ref element when entering fullscreen', async () => {
    const el = document.createElement('div')
    ;(el as any).requestFullscreen = vi.fn(async () => {
      ;(document as any).fullscreenElement = el
      dispatchFsChange()
    })
    const ref = { current: el }

    const { result } = renderHook(() => useFullscreen(ref))
    await act(async () => {
      await result.current.enter()
    })

    expect((el as any).requestFullscreen).toHaveBeenCalled()
    expect(result.current.isFullscreen).toBe(true)
  })

  it('falls back to documentElement when ref missing', async () => {
    const html = document.documentElement as any
    html.requestFullscreen = vi.fn(async () => {
      ;(document as any).fullscreenElement = html
      dispatchFsChange()
    })

    const { result } = renderHook(() => useFullscreen())
    await act(async () => {
      await result.current.enter()
    })

    expect(html.requestFullscreen).toHaveBeenCalled()
    expect(result.current.isFullscreen).toBe(true)
  })

  it('exit calls primary exitFullscreen when set', async () => {
    const exitFs = vi.fn(async () => {
      ;(document as any).fullscreenElement = null
      dispatchFsChange()
    })
    ;(document as any).exitFullscreen = exitFs
    ;(document as any).fullscreenElement = document.createElement('div')

    const { result } = renderHook(() => useFullscreen())
    await act(async () => {
      await result.current.exit()
    })

    expect(exitFs).toHaveBeenCalled()
    expect(result.current.isFullscreen).toBe(false)
  })

  it('uses vendor exit fallback when primary missing', async () => {
    const webkitExit = vi.fn(async () => {
      ;(document as any).fullscreenElement = null
      dispatchFsChange()
    })
    ;(document as any).fullscreenElement = document.createElement('div')
    ;(document as any).webkitExitFullscreen = webkitExit
    ;(document as any).exitFullscreen = undefined

    const { result } = renderHook(() => useFullscreen())
    await act(async () => {
      await result.current.exit()
    })

    expect(webkitExit).toHaveBeenCalled()
    expect(result.current.isFullscreen).toBe(false)
  })

  it('toggle enters then exits based on fullscreenElement', async () => {
    const html = document.documentElement as any
    html.requestFullscreen = vi.fn(async () => {
      ;(document as any).fullscreenElement = html
      dispatchFsChange()
    })
    const exitFs = vi.fn(async () => {
      ;(document as any).fullscreenElement = null
      dispatchFsChange()
    })
    ;(document as any).exitFullscreen = exitFs

    const { result } = renderHook(() => useFullscreen())

    await act(async () => {
      await result.current.toggle()
    })
    expect(result.current.isFullscreen).toBe(true)

    await act(async () => {
      await result.current.toggle()
    })
    expect(result.current.isFullscreen).toBe(false)
  })

  it('cleans up listeners on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(() => useFullscreen())
    unmount()

    expect(addSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
  })
})
