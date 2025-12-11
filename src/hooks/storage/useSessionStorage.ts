import { useState, useCallback, useRef, useEffect } from 'react'
import { STORAGE_ENV, storageEnv } from '../../utils/storage/storage-env'

/**
 *
 * Session storage is a lightweight, in-memory storage for a single browser tab.
 * It is similar to localStorage, but the data is only stored for the duration of the browser tab.
 */

interface UseSessionStorageReturn<T> {
  storedValue: T
  setValue: (value: T | ((prev: T) => T)) => void
  removeValue: () => void
  setValueWithTTL: (value: T, ttl: number) => void
  getStoredValue: () => NonNullable<T> | T | undefined
}

type StoredPayload<T> = {
  value: T
  expiresAt: number | null
}

/**
 * 
 * @param key 
 * 
 * @param initialValue 
 * @returns T in tuple or object or undefine
 */

export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  defaultTTL?: number
): UseSessionStorageReturn<T> {
  const isSSR = typeof window === 'undefined' || !window
  // holds the setTimeout handler which will remove the session entry when TTL elapses
  const cleanupTimer = useRef<number | null>(null)

  const isValidInputs = useCallback((maybeKey: string, value?: T | ((prev: T) => T)): boolean => {
    return maybeKey !== undefined || value !== undefined
  }, [])

  const isStoredPayload = useCallback((parsed: unknown): parsed is StoredPayload<T> => {
    if (!parsed || typeof parsed !== 'object') return false
    if (!('expiresAt' in parsed)) return false
    return true
  }, [])

  const scheduleCleanup = useCallback(
    (expiresAt: number) => {
      if (isSSR) return
      // if the cleanupTimer has value
      if (cleanupTimer.current) {
        clearTimeout(cleanupTimer.current)
      }

      const delay = Math.max(0, expiresAt - Date.now())
      cleanupTimer.current = window.setTimeout(() => {
        // get the raw data based from the key
        const raw = storageEnv(STORAGE_ENV.SESSION_STORAGE).getItem(key)
        if (!raw) return
        try {
          const parsedValue = JSON.parse(raw)
          // check if the value is already expired
          if (parsedValue?.expiresAt && parsedValue?.expiresAt <= Date.now()) {
            // remove if true
            storageEnv(STORAGE_ENV.SESSION_STORAGE).removeItem(key)
          }
        } catch {
          // no op, continue running the schedule or settimer.
        }
      }, delay)
    },
    [isSSR, key],
  )

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (isSSR) return initialValue

    try {
      const rawData = storageEnv(STORAGE_ENV.SESSION_STORAGE)?.getItem(key)

      if (!rawData) return initialValue

      const parsed = JSON.parse(rawData) as unknown

      if (isStoredPayload(parsed)) {
        const expiresAt = parsed.expiresAt

        if (typeof expiresAt === 'number' && expiresAt < Date.now()) {
          storageEnv(STORAGE_ENV.SESSION_STORAGE)?.removeItem(key)
          return initialValue
        }

        if (typeof expiresAt === 'number') {
          scheduleCleanup(expiresAt)
        }
        return 'value' in parsed ? parsed.value : initialValue
      }

      return parsed as T
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = typeof next === 'function' ? (next as (p: T) => T)(prev) : next

        if (!key) {
          console.warn('useSessionStorage: key is required')
          return valueToStore
        }

        // SSR-safe: update state, skip storage writes when window is missing
        if (!isSSR) {
          try {
            // consistent shape so hydration works the same as TTL writes
            storageEnv(STORAGE_ENV.SESSION_STORAGE).setItem(
              key,
              JSON.stringify({ value: valueToStore, expiresAt: null }),
            )
            // no scheduleCleanup — this is the non-expiring path
          } catch (err) {
            console.error('useSessionStorage: failed to store value', err)
          }
        }

        return valueToStore
      })
    },
    [key, isSSR],
  )

  const removeValue = useCallback(() => {
    if (isSSR) return

    try {
      if (!isValidInputs(key)) {
        throw new Error('Key is undefined. Please provide a key')
      }

      const checkItemIfStillExist = storageEnv(STORAGE_ENV.SESSION_STORAGE).getItem(key)

      if (!checkItemIfStillExist) {
        throw new Error('Key-value pair missing. Might be deleted or non-existing.')
      }
      storageEnv(STORAGE_ENV.SESSION_STORAGE).removeItem(key)

      // once item is remove based on key
      setStoredValue(initialValue)
    } catch {
      throw new Error('Unexpected Error. Please try again later.')
    }
  }, [key, initialValue, isSSR, isValidInputs])

  const setValueWithTTL = useCallback(
    (next: T | ((prev: T) => T), overrideTtl: number) => {
      const ttl = overrideTtl ?? defaultTTL;
      if (isSSR) return

      if (!isValidInputs(key)) {
        throw new Error('Key is undefined. Please provide a key')
      }

      if (next === undefined) throw new Error('Value is required')
      if (typeof overrideTtl !== 'number' || Number.isNaN(overrideTtl)) {
        throw new Error('overrideTtl must be a number')
      }
      setStoredValue((prev) => {
        const valueToStore = next instanceof Function ? next(prev) : next

        try {
          const expiresAt = Date.now() + ttl

          const payload = JSON.stringify({
            value: valueToStore,
            expiresAt,
          })

          storageEnv(STORAGE_ENV.SESSION_STORAGE).setItem(key, payload)

          scheduleCleanup(expiresAt)
        } catch (err) {
          console.error('Error storing value in session with TTL', err)
        }

        return valueToStore
      })
    },
    [key, isSSR, scheduleCleanup, isValidInputs],
  )

  const getStoredValue = useCallback(() => {
    if (isSSR) return undefined
    if (!isValidInputs(key)) return undefined

    try {
      const rawData = storageEnv(STORAGE_ENV.SESSION_STORAGE)?.getItem(key)
      if (!rawData) return undefined

      const parsed = JSON.parse(rawData) as unknown

      if (isStoredPayload(parsed)) {
        const expiresAt = parsed.expiresAt
        if (typeof expiresAt === 'number' && expiresAt <= Date.now()) {
          storageEnv(STORAGE_ENV.SESSION_STORAGE).removeItem(key)
          return undefined
        }
        return 'value' in parsed ? parsed.value : parsed
      }

      return parsed as T
    } catch {
      return undefined
    }
  }, [isSSR, key, isValidInputs, isStoredPayload])

  // delete so it wont cause memory leaks
  useEffect(() => {
    return () => {
      if (cleanupTimer.current) clearTimeout(cleanupTimer.current)
    }
  }, [])

  return {
    storedValue,
    setValue,
    removeValue,
    setValueWithTTL,
    getStoredValue
  }
}
