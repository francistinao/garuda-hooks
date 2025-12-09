import { useState, useEffect, useCallback, useRef } from 'react'
import { STORAGE_ENV, storageEnv } from '../../utils/storage/storage-env'

interface UseLocalStorageReturn<T> {
    storedValue: T, 
    setValue: (value: T | ((prev: T) => T)) => void, 
    removeValue: () => void, 
    getStoredValue: (whichStorage?: STORAGE_ENV) => T | undefined,
    isSSR: boolean,
    searchValue: (search: string, whichStorage?: STORAGE_ENV) => T[] | undefined
}

// T can be any type but explicitly added to avoid type inference issues
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {

    const isSSR = typeof window === 'undefined' || !window
    
    const [storedValue, setStoredValue] = useState<T>(() => {
        // always check if the window is available or opened
        if (isSSR) return initialValue
        try {
          const item = window?.localStorage.getItem(key)
          return item ? (JSON.parse(item) as T) : initialValue
        } catch (error) {
          console.error(error)
          return initialValue
        }
    })

   const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
        // check if key is provided
        if(!key || typeof key === 'undefined') throw new Error("Key is required");
        // check if value is provided
        if(typeof value === 'undefined') throw new Error("Value is required");

        setStoredValue(prev => {
            const valueToStore = value instanceof Function ? value(prev) : value
            if (!isSSR) {
              window.localStorage.setItem(key, JSON.stringify(valueToStore))
            }
            return valueToStore
        })
    } catch (error) {
        throw new Error("Unexpected error. Please try again");
    }
   }, [key])

   const removeValue = useCallback(() => {
    try {
        if(!key || typeof key === 'undefined') throw new Error("Key is required");
        if(isSSR) {
            // update the cached stored value with the initial value
            setStoredValue(initialValue);
            return;
        }
        window.localStorage.removeItem(key);
        setStoredValue(initialValue);
    } catch (error) {
        throw new Error("Unexpected error. Please try again");
    }
   }, [key, initialValue])

   // getting the stored value
   const getStoredValue = useCallback((whichStorage?: STORAGE_ENV) => {
    try {
        if(!key || typeof key === 'undefined') throw new Error("Key is required");
        if(!isSSR) {
            const item = storageEnv(whichStorage || STORAGE_ENV.LOCAL_STORAGE)?.getItem(key);
            return item ? (JSON.parse(item) as T) : undefined;
        }
        return undefined;
    } catch (error) {
        throw new Error("Unexpected error. Please try again");
    }
   }, [key])

   // searching for values in the localStorage, case insensitive since we automatically convert the search to lowercase along with the items
   const searchValue = useCallback((search: string, whichStorage?: STORAGE_ENV) => {
    try {
        if(!search || typeof search === 'undefined') throw new Error("Search is required");
        if(isSSR) return [] as T[];
        const items = storageEnv(whichStorage || STORAGE_ENV.LOCAL_STORAGE)?.getItem(key);
        if(items && typeof items === 'string') {
            const itemsArray = JSON.parse(items) as T[];
            return itemsArray.filter(item => item?.toString().toLowerCase().includes(search.toLowerCase())) as T[];
        }
        return [] as T[];
    } catch (error) {
        throw new Error("Unexpected error. Please try again");
    }
   }, [key])

   return {storedValue, setValue, removeValue, getStoredValue, isSSR, searchValue}
}