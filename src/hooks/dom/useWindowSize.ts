/*
 useWindowSize
 - observed the active window's width and ehight
 - applicable only to client components
*/

import { useState, useEffect, useCallback, useRef } from 'react'
import { isSSR } from '../../helpers/is-ssr'

type OrientationTypes = 'portrait' | 'landscape'

interface Options {
  enabled?: boolean
  debounce?: number // debounces size updates (ms)
  throttle?: number
  listenOrientation?: boolean // it will listen to orientation changes -> 'portrait' | 'landscape'
  trackDevicePixelRatio?: boolean // includes the windows device pixel ration
  initialWidth: number
  initialHeight?: number
  onChange: () => void
}

interface UseWindowSizeResult {
  width: number
  height: number
  innerWidth: number
  outerWidth: number
  devicePixelRatio?: number
  orientation: OrientationTypes
  lastUpdated?: Date
}

export function useWindowSize({ options }: { options: Options }): UseWindowSizeResult {
  const {
    enabled = true,
    initialWidth,
    initialHeight,
    debounce,
    throttle,
    listenOrientation,
    trackDevicePixelRatio,
    onChange,
  } = options ?? {}

  const [windowSizeShape, setWindowSizeShape] = useState<UseWindowSizeResult>({
    width: initialWidth,
    height: initialHeight ?? initialWidth,
    innerWidth: initialWidth,
    outerWidth: initialWidth,
    devicePixelRatio: trackDevicePixelRatio ? 1 : undefined,
    orientation: 'landscape',
    lastUpdated: new Date(),
  })

  const latestWindowSize = useRef(windowSizeShape)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const throttleTimestamp = useRef<number | null>(null)

  const readWindowSize = useCallback(() => {
    if (isSSR) return latestWindowSize.current

    const innerHeight = window.innerHeight
    const innerWidth = window.innerWidth
    const outerWidth = window.outerWidth
    const orientation = innerWidth >= innerHeight ? 'landscape' : ('portrait' as OrientationTypes)

    return {
      width: innerWidth,
      height: innerHeight,
      innerWidth,
      outerWidth,
      orientation,
      devicePixelRatio: trackDevicePixelRatio ? window.devicePixelRatio || 1 : undefined,
      lastUpdated: new Date(),
    }
  }, [trackDevicePixelRatio])

  const updateSize = useCallback(() => {
    const currentSizeShape = readWindowSize()
    setWindowSizeShape(currentSizeShape)
    latestWindowSize.current = currentSizeShape
    if (typeof onChange === 'function') onChange()
  }, [readWindowSize, onChange])

  const handleResize = useCallback(() => {
    if (debounce && debounce > 0) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(updateSize, debounce)
    } else if (throttle && throttle > 0) {
      const now = Date.now()
      if (!throttleTimestamp.current || now - throttleTimestamp.current >= throttle) {
        throttleTimestamp.current = now
        updateSize()
      }
    } else {
      updateSize()
    }
  }, [debounce, throttle, updateSize])

  useEffect(() => {
    latestWindowSize.current = windowSizeShape
  }, [windowSizeShape])

  useEffect(() => {
    if (isSSR || !enabled) return

    queueMicrotask(() => updateSize())

    window.addEventListener('resize', handleResize)
    if (listenOrientation) {
      window.addEventListener('orientationchange', updateSize)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      if (listenOrientation) {
        window.removeEventListener('orientationchange', updateSize)
      }
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [enabled, listenOrientation, handleResize, updateSize])

  return { ...windowSizeShape }
}
