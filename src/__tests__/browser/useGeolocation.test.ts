/* eslint-disable @typescript-eslint/no-unused-vars */
import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGeolocation } from '../../hooks/browser/useGeolocation'

type GeoSuccess = (pos: GeolocationPosition) => void
type GeoError = (err: GeolocationPositionError) => void

const flushMicrotasks = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

const makeGeoMock = () => {
  let watchId = 1
  const clearWatch = vi.fn()
  const getCurrentPosition = vi.fn((onSuccess: GeoSuccess, _onError?: GeoError) => {
    onSuccess({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition)
  })
  const watchPosition = vi.fn((onSuccess: GeoSuccess, _onError?: GeoError) => {
    onSuccess({ coords: { latitude: 3, longitude: 4 } } as GeolocationPosition)
    return watchId++
  })
  return { getCurrentPosition, watchPosition, clearWatch }
}

const makePermissionsMock = (state: PermissionState = 'prompt') => {
  const listeners: Array<() => void> = []
  const status = {
    state,
    addEventListener: vi.fn((_, cb: () => void) => listeners.push(cb)),
    removeEventListener: vi.fn(),
  } as unknown as PermissionStatus
  const query = vi.fn(async () => status)
  const triggerChange = (next: PermissionState) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(status as any).state = next
    listeners.forEach((cb) => cb())
  }
  return { query, status, triggerChange }
}

describe('useGeolocation', () => {
  const realNavigator = global.navigator

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('reports unsupported when geolocation is missing', () => {
    global.navigator = {} as Navigator
    const { result } = renderHook(() => useGeolocation())
    expect(result.current.isSupported).toBe(false)
  })

  it('gets one-shot position successfully', async () => {
    const geo = makeGeoMock()
    // @ts-expect-error override
    global.navigator = { geolocation: geo }

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      result.current.start()
    })

    expect(geo.getCurrentPosition).toHaveBeenCalled()
    expect(result.current.coords?.coords.latitude).toBe(1)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles geolocation error', async () => {
    const errObj = { code: 1, message: 'denied' } as GeolocationPositionError
    const geo = {
      getCurrentPosition: vi.fn((_s: GeoSuccess, e: GeoError) => e(errObj)),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    }
    // @ts-expect-error override
    global.navigator = { geolocation: geo }

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      result.current.start()
    })

    expect(result.current.error).toBe(errObj)
    expect(result.current.loading).toBe(false)
  })

  it('starts watch and clears on stop', async () => {
    const geo = makeGeoMock()
    // @ts-expect-error override
    global.navigator = { geolocation: geo }

    const { result } = renderHook(() => useGeolocation({ watch: true }))

    await act(async () => {
      result.current.start()
    })

    expect(geo.watchPosition).toHaveBeenCalled()
    expect(result.current.coords?.coords.latitude).toBe(3)

    act(() => {
      result.current.stop()
    })
    expect(geo.clearWatch).toHaveBeenCalled()
  })

  it('refresh restarts watch when watch=true', async () => {
    const geo = makeGeoMock()
    // @ts-expect-error override
    global.navigator = { geolocation: geo }

    const { result } = renderHook(() => useGeolocation({ watch: true }))
    await act(async () => {
      result.current.start()
    })

    await act(async () => {
      result.current.refresh()
    })

    expect(geo.clearWatch).toHaveBeenCalled()
    expect(geo.watchPosition).toHaveBeenCalledTimes(2)
  })

  it('auto-start still allows immediate start when auto=true', () => {
    const geo = makeGeoMock()
    // @ts-expect-error override
    global.navigator = { geolocation: geo }

    const { result } = renderHook(() => useGeolocation({ auto: true }))

    // explicitly start to avoid waiting for microtask scheduling differences
    act(() => {
      result.current.start()
    })

    expect(geo.getCurrentPosition).toHaveBeenCalled()
    expect(result.current.coords).not.toBeNull()
  })

  it('updates permissionState via permissions API when available', async () => {
    const geo = makeGeoMock()
    const perms = makePermissionsMock('prompt')
    // @ts-expect-error override
    global.navigator = { geolocation: geo, permissions: { query: perms.query } }

    const { result } = renderHook(() => useGeolocation())

    // wait for permissions query resolve
    await act(async () => {})
    expect(result.current.permissionState).toBe('prompt')

    act(() => {
      perms.triggerChange('granted')
    })
    expect(result.current.permissionState).toBe('granted')
  })

  afterEach(() => {
    // restore navigator; ensure geolocation exists to satisfy cleanup
    if (!realNavigator.geolocation) {
      global.navigator = {
        ...realNavigator,
        geolocation: { clearWatch: vi.fn(), getCurrentPosition: vi.fn(), watchPosition: vi.fn() },
      }
    } else {
      global.navigator = realNavigator
    }
  })
})
