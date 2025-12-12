import { useState, useCallback } from 'react';

interface UseCookieOptions<T> {
    decode?: (value: string | null) => T | null;
    encode?: (value: T | null) => string;
    path?: string;
    domain?: string;
    sameSite?: "strict" | "lax" | "none";
    secure?: boolean;
    maxAge?: number; // seconds
}

interface UseCookiesReturn<T> {
    value: T | null;
    readCookie: () => T | null;
    setCookie: (val: T | null) => void;
    removeCookie: () => void;
}

export function useCookie<T = string>(
    key: string,
    initialValue: T | null,
    options: UseCookieOptions<T> = {}

): UseCookiesReturn<T> {
    const isSSR = typeof window === 'undefined';

    const {
        decode = (value: string | null) => value as T | null,
        encode = (value: T | null) => String(value ?? ''),
        path = '/',
        domain,
        sameSite = 'lax',
        secure = false,
        maxAge,
    } = options;

    const readCookie = () => {
        if (typeof document === "undefined") return initialValue;
        const regex = `(^| )${key}=([^;]+)`
        const match = document.cookie.match(new RegExp(regex))

        return match ? decode(match[2]) : initialValue;
    }

    const [value, setValue] = useState<T | null>(() => readCookie())

    const writeCookieString = useCallback((val: T | null) => {
        // always check if document is available
        if(typeof document === 'undefined') return;

        try {
            
            // define the cookie
            let cookie = `${key}=${encode(val)}; path=${path}; SameSite=${sameSite}`

            // check if extra config are available
            if(domain) cookie += `; domain=${domain}`
            if(secure) cookie += `; secure`;
            if(maxAge != null) cookie += `; max-age=${maxAge}`;

            document.cookie = cookie;
        } catch (error) {
            console.error("Error creating a cookie", error);
        }


    }, [key, encode, path, domain, sameSite, secure, maxAge])

    const setCookie = useCallback((val: T | null) => {
        if(isSSR) return undefined;

        writeCookieString(val)
        setValue(val)

    }, [isSSR, writeCookieString])

    const removeCookie = useCallback(() => {
        if (!key || typeof key === 'undefined') return;

        try{
            document.cookie = `${key}=; path=${path}; expiresAt=Thu, 01 Jan 1970 00:00:00`
            setValue(null)
        } catch(err) {
            console.error("Error removing key", err);
        }
    }, [key, path])

    return {
        value,
        readCookie,
        setCookie,
        removeCookie
    }
}