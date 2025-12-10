import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { STORAGE_ENV, storageEnv } from '../../utils/storage/storage-env'

/**
 *
 * Session storage is a lightweight, in-memory storage for a single browser tab.
 * It is similar to localStorage, but the data is only stored for the duration of the browser tab.
 */

// TTL
// can be passed as a parameter to the hook or set as a default
const DEFAULT_TTL = 1000 * 60 * 60 * 4 // 4 hours in milliseconds

interface UseSessionStorageReturn<T> {
  storedValue: T
  setValue: (value: T | ((prev: T) => T)) => void
  removeValue: () => void
  setValueWithTTL: (value: T, ttl: number) => void
  //getStoredValue: () => T | undefined
  //searchValue: (search: string) => T[] | undefined
  //removeValueWithTTL: (ttl: number) => void
  //getStoredValueWithTTL: (ttl: number) => T | undefined
  //searchValueWithTTL: (search: string, ttl: number) => T[] | undefined
  //setValueWithTTLAndCallback: (value: T, ttl: number, callback: (value: T) => void) => void
  //removeValueWithTTLAndCallback: (ttl: number, callback: (value: T) => void) => void
  //getStoredValueWithTTLAndCallback: (ttl: number, callback: (value: T) => void) => T | undefined
  /**
   * 
   * searchValueWithTTLAndCallback: (
    search: string,
    ttl: number,
    callback: (value: T) => void,
  ) => T[] | undefined
   */
}

/**
 * 
 * TODO:
 * 
 *  DONE: Falsy values: if (!value …) rejects valid 0, '', false. Only disallow value === undefined; allow other falsy values.
    DONE: Stale TTL: setValue’s useCallback deps omit ttl (and isSSR). TTL changes won’t propagate; add them to deps.
    DONE: SSR handling: Don’t throw when window is missing. If isSSR, skip setItem but still update state.
    DONE: Schedule cleanup on writes: After writing, call scheduleCleanup(expiresAt) in both setValue and setValueWithTTL; otherwise proactive cleanup never runs.
    DONE: Storage write errors: Wrap setItem in try/catch; on failure, keep state updated and swallow/log.
    setValueWithTTL: Currently not memoized and has no validation. Add key/undefined-value checks, validate overrideTtl (number), guard SSR, reuse the same write path, and schedule cleanup.
    State sync on remove: removeValue doesn’t set state to initialValue when not SSR. Do so after removal so state stays in sync.
    Interface vs return: You declare many optional functions (getStoredValue, search, callbacks) but only return setValueWithTTL. Either implement/return them or remove from the interface.
 * 
 * @param key 
 * 
 * @param initialValue 
 * @param ttl 
 * @returns 
 */

export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  ttl: number = DEFAULT_TTL,
): UseSessionStorageReturn<T> {
  const isSSR = typeof window === 'undefined' || !window
  // holds the setTimeout handler which will remove the session entry when TTL elapses
  const cleanupTimer = useRef<number | null>(null)

  const isValidInputs = (key: string, value?: T | ((prev: T) => T)): Boolean => {
    return key !== undefined || value !== undefined
  }

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
        } catch (error) {
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

      if (!rawData || typeof rawData === 'undefined') return initialValue

      const parsed = JSON.parse(rawData)
      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        storageEnv(STORAGE_ENV.SESSION_STORAGE)?.removeItem(key)
        return initialValue
      }

      // if the session data is not yet expired, directly schedule it
      if (parsed?.expiresAt) {
        scheduleCleanup(parsed.expiresAt)
      }

      return parsed.value ?? initialValue
    } catch (error) {
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
    } catch (error) {
      throw new Error('Unexpected Error. Please try again later.')
    }
  }, [key, initialValue])

  const setValueWithTTL = useCallback(
    (next: T | ((prev: T) => T), overrideTtl: number) => {
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
          const expiresAt = Date.now() + overrideTtl

          const payload = JSON.stringify({
            value: valueToStore,
            expiresAt,
          })

          storageEnv(STORAGE_ENV.SESSION_STORAGE).setItem(key, payload)

          scheduleCleanup(expiresAt)
        } catch (err) {
          console.error('Error storing value in session with TTL')
        }

        return valueToStore
      })
    },
    [key, isSSR, scheduleCleanup],
  )

  const getStoredValue = useCallback(() => {
    if (isSSR) return

    try {
    } catch (error) {
      return null
    }
  }, [key])

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
    // remaining hooks and variables
    //searchValue <- works with both sessions with or without ttl
    //getStoredValue
    //setValueWithTTL
    //removeValueWithTTL
    //getStoredValueWithTTL
    //searchValueWithTTL
  }
}
