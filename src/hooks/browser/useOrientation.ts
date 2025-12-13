import { useState, useCallback, useRef, useEffect } from 'react'
import { isSSR } from '../../helpers/is-ssr'

/**
 * Checks the orientation of the app if its landcape or portrait
 */

interface Options {
  trackDeviceMotion: boolean // will listen to device sensors
  debounce: number // debounce orientation updates every 200 ms
  idleAware: boolean // pause update if user is inactive  or idle
}

interface Orientation {
  type: 'portrait' | 'landscape' | 'unknown'
  angle: 0 | 90 | 180 | 270 | null
  screen: {
    width: number
    height: number
  }
  device: {
    alpha: number | null
    beta: number | null
    gamma: number | null
    absolute: boolean | null
  }
  supported: {
    screenOrientation: boolean
    deviceOrientation: boolean
  }
  permission: 'granted' | 'denied' | 'prompt' | 'not-required'
  lastUpdated: number
}

export function useOrentation(options?: Options): { orientation: Orientation | null } {
  const [orientation, setOrientation] = useState<Orientation | null>(() => {
    if (isSSR) return null

    const now = Date.now()
    const screenOrientation =
      typeof window !== 'undefined' && window.screen && 'orientation' in window.screen
    const deviceOrientation = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window

    return {
      type: 'portrait',
      angle: 0,
      screen: {
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
      },
      device: {
        alpha: null,
        beta: null,
        gamma: null,
        absolute: null,
      },
      supported: {
        screenOrientation,
        deviceOrientation,
      },
      permission: 'prompt',
      lastUpdated: now,
    }
  })

  const debounceTimer = useRef<number | null>(null)
  const mounted = useRef(false)

  const normalizeScreenOrientation = useCallback((): {
    angle: Orientation['angle']
    type: Orientation['type']
  } => {
    if (isSSR || typeof window === 'undefined') return { angle: null, type: 'unknown' }

    let angle: Orientation['angle'] = 0
    let type: Orientation['type'] = 'unknown'

    try {
      const screen = window.screen

      // access screen if orientation property is available
      if (screen && 'orientation' in screen && screen.orientation) {
        const rawAngle = screen.orientation.angle
        angle =
          rawAngle === 0 || rawAngle === 90 || rawAngle === 180 || rawAngle === 270
            ? rawAngle
            : null
        type = screen.orientation.type.includes('portrait') ? 'portrait' : 'landscape'
      } else {
        // fallback to window dimensions
        angle = window.innerWidth > window.innerHeight ? 90 : 0
        type = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      }
    } catch {
      // fallback to window dimensions if screen API fails
      angle = window.innerWidth > window.innerHeight ? 90 : 0
      type = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    }

    return { type, angle }
  }, [])

  const updateScreenOrientation = useCallback(() => {
    if (isSSR || typeof window === 'undefined') return

    const data = normalizeScreenOrientation()

    setOrientation((prev) => {
      // create fallback for other properties to be cached
      const fallback: Orientation = prev ?? {
        type: 'unknown',
        angle: null,
        screen: { width: 0, height: 0 },
        device: { alpha: null, beta: null, gamma: null, absolute: null },
        supported: { screenOrientation: false, deviceOrientation: false },
        permission: 'not-required',
        lastUpdated: Date.now(),
      }

      return {
        ...fallback,
        type: data.type,
        angle: data.angle,
        screen: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        supported: {
          ...fallback.supported,
          screenOrientation: window.screen && 'orientation' in window.screen,
        },
        lastUpdated: Date.now(),
      }
    })
  }, [normalizeScreenOrientation])

  const handleResizeOrOrientationChange = useCallback(() => {
    if (isSSR || typeof window === 'undefined') return

    const DEBOUNCE_MS = options?.debounce ?? 200
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = window.setTimeout(updateScreenOrientation, DEBOUNCE_MS)
  }, [updateScreenOrientation, options?.debounce])

  const handleDeviceOrientation = useCallback((e: DeviceOrientationEvent) => {
    const { alpha, beta, gamma, absolute } = e
    setOrientation((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        device: {
          alpha,
          beta,
          gamma,
          absolute,
        },
        supported: {
          ...prev.supported,
          deviceOrientation: true,
        },
        lastUpdated: Date.now(),
      }
    })
  }, [])

  async function requestDeviceOrientationPermission(): Promise<
    'granted' | 'denied' | 'prompt' | 'not-required'
  > {
    // check if browser requires explicit permission (mostly iOS 13+)
    const permissionRequester =
      typeof DeviceOrientationEvent !== 'undefined'
        ? (
            DeviceOrientationEvent as typeof DeviceOrientationEvent & {
              requestPermission?: () => Promise<'granted' | 'denied' | 'prompt'>
            }
          ).requestPermission
        : undefined

    if (typeof permissionRequester === 'function') {
      try {
        const permission = await permissionRequester()
        return permission ?? 'denied'
      } catch (err) {
        console.error('DeviceOrientation permission request failed:', err)
        return 'denied'
      }
    }

    // no permission needed (desktop, most Android, older browsers)
    return 'not-required'
  }

  useEffect(() => {
    if (isSSR || typeof window === 'undefined') return

    mounted.current = true

    // detect if screen is available
    const screen = window.screen
    const isSupported = screen && 'orientation' in screen
    const deviceOrientationSupported = 'DeviceOrientationEvent' in window

    // Update initial screen orientation
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => updateScreenOrientation())
    } else {
      setTimeout(() => updateScreenOrientation(), 0)
    }

    // Add resize and orientation change listeners
    window.addEventListener('resize', handleResizeOrOrientationChange)
    if (isSupported && screen.orientation) {
      screen.orientation.addEventListener('change', updateScreenOrientation)
    }

    const checkPermission = async () => {
      if (options?.trackDeviceMotion) {
        if (deviceOrientationSupported) {
          const permission = await requestDeviceOrientationPermission()

          setOrientation((prev) => (prev ? { ...prev, permission } : null))

          if (permission === 'granted' || permission === 'not-required') {
            window.addEventListener('deviceorientation', handleDeviceOrientation)
          }
        } else {
          // Device orientation not supported, set permission accordingly
          setOrientation((prev) => (prev ? { ...prev, permission: 'not-required' } : null))
        }
      }
    }

    checkPermission()

    // clear listeners on unmount
    return () => {
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }

      window.removeEventListener('resize', handleResizeOrOrientationChange)
      if (isSupported && screen.orientation) {
        screen.orientation.removeEventListener('change', updateScreenOrientation)
      }
      window.removeEventListener('deviceorientation', handleDeviceOrientation)
      mounted.current = false
    }
  }, [
    handleDeviceOrientation,
    handleResizeOrOrientationChange,
    options?.trackDeviceMotion,
    updateScreenOrientation,
  ])

  return {
    orientation,
  }
}
