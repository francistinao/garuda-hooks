import { useState, useCallback, useRef, useEffect } from 'react'
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
    storedValue: T,
    setValue: (value: T | ((prev: T) => T)) => void,
    removeValue: () => void,
    getStoredValue?: () => T | undefined,
    searchValue?: (search: string) => T[] | undefined
    setValueWithTTL?: (value: T, ttl: number) => void,
    removeValueWithTTL?: (ttl: number) => void,
    getStoredValueWithTTL?: (ttl: number) => T | undefined,
    searchValueWithTTL?: (search: string, ttl: number) => T[] | undefined,
    setValueWithTTLAndCallback?: (value: T, ttl: number, callback: (value: T) => void) => void,
    removeValueWithTTLAndCallback?: (ttl: number, callback: (value: T) => void) => void,
    getStoredValueWithTTLAndCallback?: (ttl: number, callback: (value: T) => void) => T | undefined,
    searchValueWithTTLAndCallback?: (search: string, ttl: number, callback: (value: T) => void) => T[] | undefined,
}

/**
 * 
 * TODO:
 * Falsy values: if (!value …) rejects valid 0, '', false. Only disallow value === undefined; allow other falsy values.
    Stale TTL: setValue’s useCallback deps omit ttl (and isSSR). TTL changes won’t propagate; add them to deps.
    SSR handling: Don’t throw when window is missing. If isSSR, skip setItem but still update state.
    Schedule cleanup on writes: After writing, call scheduleCleanup(expiresAt) in both setValue and setValueWithTTL; otherwise proactive cleanup never runs.
    Storage write errors: Wrap setItem in try/catch; on failure, keep state updated and swallow/log.
    setValueWithTTL: Currently not memoized and has no validation. Add key/undefined-value checks, validate overrideTtl (number), guard SSR, reuse the same write path, and schedule cleanup.
    State sync on remove: removeValue doesn’t set state to initialValue when not SSR. Do so after removal so state stays in sync.
    Interface vs return: You declare many optional functions (getStoredValue, search, callbacks) but only return setValueWithTTL. Either implement/return them or remove from the interface.
    Cleanup timer error: In scheduleCleanup, a JSON parse error throws; that will bubble out of the timeout. Prefer catching and removing the item (or no-op) instead of throwing.
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
    ttl: number = DEFAULT_TTL
): UseSessionStorageReturn<T> {
    const isSSR = typeof window === 'undefined' || !window
    // holds the setTimeout handler which will remove the session entry when TTL elapses
    const cleanupTimer = useRef<number | null>(null);
    
    const scheduleCleanup = useCallback((expiresAt: number) => {
        if (isSSR) return;
        // if the cleanupTimer has value
        if(cleanupTimer.current) {
            clearTimeout(cleanupTimer.current)
        }

        const delay = Math.max(0, expiresAt - Date.now())
        cleanupTimer.current = window.setTimeout(() => {
            // get the raw data based from the key
            const raw = storageEnv(STORAGE_ENV.SESSION_STORAGE).getItem(key)
            if(!raw) return;
            try {
                const parsedValue = JSON.parse(raw)
                // check if the value is already expired
                if(parsedValue?.expiresAt && parsedValue?.expiresAt <= Date.now()) {
                    // remove if true
                    storageEnv(STORAGE_ENV.SESSION_STORAGE).removeItem(key)
                }
            } catch (error) {
                throw new Error(`Error getting data from session storage with key: ${key}`)
            }
        }, delay)
    }, [isSSR, key])

    const [storedValue, setStoredValue] = useState<T>(() => {
        if(isSSR) return initialValue;
        
        try {
            const rawData = storageEnv(STORAGE_ENV.SESSION_STORAGE)?.getItem(key);

            if(!rawData || typeof rawData === 'undefined') return initialValue;

            const parsed = JSON.parse(rawData)
            if(parsed.expiresAt && parsed.expiresAt < Date.now()) {
                storageEnv(STORAGE_ENV.SESSION_STORAGE)?.removeItem(key);
                return initialValue;
            }

            // if the session data is not yet expired, directly schedule it
            if(parsed?.expiresAt) {
                scheduleCleanup(parsed.expiresAt)
            }

            return parsed.value ?? initialValue;
        } catch (error) {
            return initialValue;
        }
    })

    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        try {
            if(!window || typeof window === 'undefined') return;
            
            if(!key || typeof key === 'undefined' || Boolean(key) === false || key === '') throw new Error("Key is missing. Please provide a key");
            
            if(!value || typeof value === 'undefined') throw new Error("Value is missing. Please provide a value");

            setStoredValue(prev => {
                const valueToStore = value instanceof Function ? value(prev) : value
                // serialize valueToStore
                const payload = JSON.stringify({
                    value: valueToStore,
                    expiresAt: Date.now() + ttl
                })

                if(!isSSR) {
                    storageEnv(STORAGE_ENV.SESSION_STORAGE).setItem(key, payload);
                }
                return valueToStore;
            })
        } catch (error) {
            throw new Error("Unexpected error. Please try again");
        }
    }, [key, initialValue])

    const removeValue = useCallback(() => {
        try {
            if(!key || typeof key === 'undefined') throw new Error("Key is missing. Please provide key.")
                
            if(isSSR) {
                setStoredValue(initialValue);
                return;
            }
            const checkItemIfStillExist = storageEnv(STORAGE_ENV.SESSION_STORAGE).getItem(key)
                
            if(!checkItemIfStillExist) {
                throw new Error("Key-value pair missing. Might be deleted or non-existing.")
            }
            storageEnv(STORAGE_ENV.SESSION_STORAGE).removeItem(key);
        } catch (error) {
            throw new Error("Unexpected Error. Please try again later.")
        }
    }, [key, initialValue])

    const setValueWithTTL = (next: T | ((prev: T) => T), overrideTtl: number) => {
        setStoredValue(prev => {
          const valueToStore = next instanceof Function ? next(prev) : next
          if (!isSSR) {
            const payload = JSON.stringify({
              value: valueToStore,
              expiresAt: Date.now() + overrideTtl,
            })
            storageEnv(STORAGE_ENV.SESSION_STORAGE).setItem(key, payload)
          }
          return valueToStore
        })
    }

    // delete so it wont cause memory leaks
    useEffect(() => {
        return () => {
            if(cleanupTimer.current) clearTimeout(cleanupTimer.current)
        }
    }, [])

    return {
        storedValue,
        setValue,
        removeValue,
        setValueWithTTL
        // remaining hooks and variables
        //searchValue
        //setValueWithTTL
        //removeValueWithTTL
        //getStoredValueWithTTL
        //searchValueWithTTL
        //setValueWithTTLAndCallback
        //removeValueWithTTLAndCallback
    }
}