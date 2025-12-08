import { useState, useEffect, useCallback, useRef } from 'react'

// T can be any type but explicitly added to avoid type inference issues
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void, () => void] {

    const [storedValue, setStoredValue] = useState<T>(() => {
        // always check if the window is available or opened
        if (typeof window === 'undefined' || !window) return initialValue
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
            if (typeof window !== 'undefined') {
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
        if(typeof window === 'undefined') {
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
   const getStoredValue = useCallback(() => {
    try {
        if(!key || typeof key === 'undefined') throw new Error("Key is required");
        if(typeof window !== 'undefined') {
            const item = window.localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : undefined;
        }
        return undefined;
    } catch (error) {
        throw new Error("Unexpected error. Please try again");
    }
   }, [key])

   return [storedValue, setValue, removeValue, getStoredValue]
}