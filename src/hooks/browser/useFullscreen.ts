/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useRef, useEffect, RefObject } from 'react'

interface UseFullScreenResult<T> {
  ref: RefObject<T | null>
  isFullscreen: boolean
  isSupported: boolean
  enter: () => Promise<void>
  exit: () => Promise<void>
  toggle: () => Promise<void>
}

type FullscreenCapableElement = HTMLElement & {
  requestFullscreen?: () => Promise<void>
  webkitRequestFullscreen?: () => Promise<void>
  mozRequestFullScreen?: () => Promise<void>
  msRequestFullscreen?: () => Promise<void>
}

export function useFullscreen<T extends HTMLElement = HTMLElement>(
  targetRef?: RefObject<T>,
): UseFullScreenResult<T> {
  const isSSR = typeof window === 'undefined' || typeof document === 'undefined'
  const internalRef = useRef<T>(null)
  const ref = targetRef ?? internalRef

  const isSupported =
    !isSSR &&
    Boolean(
      document.fullscreenEnabled ||
      // @ts-expect-error vendor prefixes
      document.webkitFullscreenEnabled ||
      // @ts-expect-error vendor prefixes
      document.mozFullScreenEnabled ||
      // @ts-expect-error vendor prefixes
      document.msFullscreenEnabled,
    )

  const [isFullscreen, setIsFullscreen] = useState(false)

  const getCurrentFsElement = () =>
    (!isSSR &&
      (document.fullscreenElement ||
        // @ts-expect-error vendor prefixes
        document.webkitFullscreenElement ||
        // @ts-expect-error vendor prefixes
        document.mozFullScreenElement ||
        // @ts-expect-error vendor prefixes
        document.msFullscreenElement)) ||
    null

  const enter = useCallback(async () => {
    if (!isSupported) return
    const el = ref.current ?? document.documentElement
    if (!el) return

    const anyEl = el as FullscreenCapableElement
    try {
      if (anyEl.requestFullscreen) await anyEl.requestFullscreen()
      else if (anyEl.webkitRequestFullscreen) await anyEl.webkitRequestFullscreen()
      else if (anyEl.mozRequestFullScreen) await anyEl.mozRequestFullScreen()
      else if (anyEl.msRequestFullscreen) await anyEl.msRequestFullscreen()
    } catch (err) {
      console.error('Error entering fullscreen', err)
    }
  }, [isSupported, ref])

  const exit = useCallback(async () => {
    if (!isSupported) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDoc = document as any
    try {
      if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen()
      else if (anyDoc.webkitExitFullscreen) await anyDoc.webkitExitFullscreen()
      else if (anyDoc.mozCancelFullScreen) await anyDoc.mozCancelFullScreen()
      else if (anyDoc.msExitFullscreen) await anyDoc.msExitFullscreen()
    } catch (err) {
      console.error('Error exiting fullscreen', err)
    }
  }, [isSupported])

  const toggle = useCallback(async () => {
    if (getCurrentFsElement()) await exit()
    else await enter()
  }, [enter, exit])

  useEffect(() => {
    if (isSSR || !isSupported) return

    const handler = () => {
      setIsFullscreen(Boolean(getCurrentFsElement()))
    }

    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    document.addEventListener('mozfullscreenchange', handler)
    document.addEventListener('MSFullscreenChange', handler)

    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
      document.removeEventListener('mozfullscreenchange', handler)
      document.removeEventListener('MSFullscreenChange', handler)
    }
  }, [isSSR, isSupported, getCurrentFsElement])

  return { ref, isFullscreen, isSupported, enter, exit, toggle }
}
