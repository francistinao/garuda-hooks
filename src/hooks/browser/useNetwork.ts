import { useState, useCallback, useEffect } from 'react'
import { isSSR } from '../../helpers/is-ssr'

/**
 * useNetwork:
 *
 * Checks the connection of your app
 */

interface UseNetworkResult<T> {
  isOnline: boolean
  downlink: T | null
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  saveData: boolean
  rtt: T | null
  isSlowConnection?: () => boolean
  connectionQuality?: () => string
}

interface NetworkInformation {
  isOnline: boolean
  effectiveType?: string
  downlink?: number | null
  rtt?: number | null
  saveData?: boolean | null
  type?: string
  addEventListener?: (type: 'change' | 'online' | 'offline', listener: () => void) => void
  removeEventListener?: (type: 'change' | 'online' | 'offline', listener: () => void) => void
}

type NavigatorWithConnection = Navigator & { connection?: NetworkInformation }

export function useNetwork<T>(): UseNetworkResult<T> {
  const [network, setNetwork] = useState<NetworkInformation>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    downlink: null,
    rtt: null,
    effectiveType: '3g',
    saveData: false,
  })

  const updateNetworkInfo = useCallback(() => {
    if (isSSR || typeof navigator === 'undefined') return

    const connection = (navigator as NavigatorWithConnection).connection as
      | NetworkInformation
      | undefined
    setNetwork((prev) => ({
      ...prev,
      downlink: connection?.downlink ?? null,
      effectiveType: connection?.effectiveType ?? prev.effectiveType ?? 'unknown',
      saveData: connection?.saveData ?? false,
      rtt: connection?.rtt ?? null,
      type: connection?.type ?? prev.type,
    }))
  }, [])

  const handleOnline = useCallback(() => {
    updateNetworkInfo()
    setNetwork((prev) => ({
      ...prev,
      isOnline: true,
    }))
  }, [updateNetworkInfo])

  const handleOffline = useCallback(() => {
    setNetwork((prev) => ({
      ...prev,
      isOnline: false,
      downlink: null,
      effectiveType: 'unknown',
      saveData: false,
      rtt: null,
    }))
  }, [])

  const handleConnectionChange = useCallback(() => {
    if (isSSR || typeof navigator === 'undefined') return

    const connection = (navigator as NavigatorWithConnection).connection
    if (!connection) return

    setNetwork((prev) => {
      // capture previous connection values for comparison
      const prevQuality = prev.effectiveType
      const prevDownlink = prev.downlink

      const newDownlink = connection.downlink ?? null
      const newEffectiveType = connection.effectiveType ?? 'unknown'
      const newSaveData = connection.saveData ?? false
      const newRtt = connection.rtt ?? null

      // check if connection quality changed significantly
      const qualityChanged = newEffectiveType !== prevQuality || newDownlink !== prevDownlink

      // call custom event if quality changed
      if (qualityChanged) {
        const event = new CustomEvent('networkQualityChange', {
          detail: {
            downlink: newDownlink,
            effectiveType: newEffectiveType,
            saveData: newSaveData,
            rtt: newRtt,
          },
        })
        window.dispatchEvent(event)
      }

      return {
        ...prev,
        downlink: newDownlink,
        effectiveType: newEffectiveType as 'slow-2g' | '2g' | '3g' | '4g',
        saveData: newSaveData,
        rtt: newRtt,
      }
    })
  }, [])

  useEffect(() => {
    if (isSSR || typeof navigator === 'undefined') return

    const connection = (navigator as NavigatorWithConnection).connection

    // once hook is mounted, update the network directly
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => updateNetworkInfo())
    } else {
      setTimeout(() => updateNetworkInfo(), 0)
    }

    window.addEventListener('online', handleOnline, { passive: true })
    window.addEventListener('offline', handleOffline, { passive: true })

    if (typeof connection?.addEventListener === 'function') {
      connection.addEventListener('change', handleConnectionChange)
    }

    const POLLING_DURATION = 5000 // 5 seconds

    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine !== network.isOnline) {
        if (navigator.onLine) {
          handleOnline()
        } else {
          handleOffline()
        }
      }
    }, POLLING_DURATION)

    return () => {
      clearInterval(interval)

      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if (typeof connection?.removeEventListener === 'function') {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleConnectionChange, handleOffline, handleOnline, updateNetworkInfo])

  return {
    isOnline: network.isOnline,
    downlink: network.downlink as T | null,
    effectiveType: network.effectiveType as 'slow-2g' | '2g' | '3g' | '4g',
    saveData: network.saveData ?? false,
    rtt: network.rtt as T | null,
    isSlowConnection: () =>
      network.downlink !== null &&
      (network.effectiveType === 'slow-2g' ||
        network.effectiveType === '2g' ||
        (network.downlink ?? 0) < 0.5),
    connectionQuality: () => {
      if (!network.isOnline) return 'offline'
      switch (network.effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'poor'
        case '3g':
          return 'good'
        case '4g':
          return 'excellent'
        default:
          return 'unknown'
      }
    },
  }
}
