import { useState, useCallback, useRef, useEffect, RefObject, useMemo } from 'react'
import { isSSR } from '../../helpers/is-ssr'

interface UseGeolocationResult<T> {
  ref: RefObject<T | null>
  permissionState: PermissionStateExtended
  coords: GeolocationPosition | null
  loading: boolean
  error: GeolocationPositionError | null
  start: () => void
  stop: () => void
  refresh: () => void
  isSupported: boolean
}

type PermissionStateExtended = PermissionState | 'unavailable'

type GeolocationOptions = PositionOptions & { watch?: boolean; auto?: boolean }

export function useGeolocation<T extends HTMLElement = HTMLElement>(
  options: GeolocationOptions = {},
): UseGeolocationResult<T> {
  const ref = useRef<T | null>(null)
  const watchId = useRef<number | null>(null)
  const [coords, setCoords] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<GeolocationPositionError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [permissionState, setPermissionState] = useState<PermissionStateExtended>('unavailable')
  const isSupported = !isSSR && 'geolocation' in navigator

  const { watch = false, ...rest } = options

  const memoizedOptions = useMemo<PositionOptions | undefined>(
    () => (Object.keys(rest).length ? rest : undefined),
    [rest],
  )

  const onSuccess = (pos: GeolocationPosition | null) => {
    setCoords(pos)
    setError(null)
    setIsLoading(false)
  }

  const onError = (err: GeolocationPositionError) => {
    setError(err)
    setIsLoading(false)
  }

  const stop = useCallback(() => {
    if (!isSupported) return
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setIsLoading(false)
  }, [isSupported])

  const start = useCallback(() => {
    if (!isSupported) return
    setIsLoading(true)

    if (watch) {
      watchId.current = navigator.geolocation.watchPosition(onSuccess, onError, memoizedOptions)
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, memoizedOptions)
    }
  }, [isSupported, watch, memoizedOptions])

  const refresh = useCallback(() => {
    if (!isSupported) return

    // check if watch has value
    if (watch) {
      stop()
      start()
      return
    } else {
      setIsLoading(true)
      navigator.geolocation.getCurrentPosition(onSuccess, onError, memoizedOptions)
    }
  }, [isSupported, watch, start, memoizedOptions, stop])

  useEffect(() => {
    // check if permissions api is supported or available
    if (!isSupported || typeof navigator === 'undefined' || !('permissions' in navigator)) {
      queueMicrotask(() => setPermissionState('unavailable'))
      return
    }

    let permissionStatusRef: PermissionStatus | null = null
    let handleRef: () => void = () => {}
    let cancelled = false

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((status) => {
        if (cancelled) {
          // directly return since its already cancelled
          return
        }
        permissionStatusRef = status
        setPermissionState(status.state)

        handleRef = () => setPermissionState(status.state)
        status.addEventListener('change', handleRef)
      })
      .catch(() => {
        if (!cancelled) setPermissionState('unavailable')
      })

    return () => {
      cancelled = true

      if (permissionStatusRef && handleRef) {
        permissionStatusRef.removeEventListener('change', handleRef)
      }
    }
  }, [stop, isSupported])

  useEffect(() => {
    if (options.auto) queueMicrotask(() => start())
  }, [options.auto, start])

  useEffect(() => () => stop(), [stop])

  return {
    ref,
    permissionState,
    start,
    coords,
    loading: isLoading,
    error,
    stop,
    refresh,
    isSupported,
  }
}
