import { useState, useEffect, useCallback } from 'react'

interface Options {
  defaultHash?: string
  replace?: boolean
  parse?: boolean // parse key=value pairs
  separator?: '&' // parsing separator
  decode?: boolean
}

export function useHash({ value, options }: { value: string; options: Options }) {
  const { defaultHash, replace, parse, separator, decode } = options ?? {}
  
  // Check SSR state dynamically to handle test environments properly
  const checkIsSSR = () => typeof window === 'undefined' || !window
  
  const parseHash = useCallback(
    (hash: string): Record<string, string> | null => {
      if (!parse || !hash) return null
        
      const separatorToUse = separator ?? '&'
      const parts = hash.split(separatorToUse)
      const result: Record<string, string> = {}

      if (parts.length === 1 && hash.includes('=')) {
        const differentSeparators = ['&', ';', '|', ',']
        const hasOtherSeparator = differentSeparators
          .filter(sep => sep !== separatorToUse)
          .some(sep => hash.includes(sep))
          
        if (hasOtherSeparator) {
          try {
            const key = decode ? decodeURIComponent(hash) : hash
            result[key] = ''
          } catch {
            result[hash] = ''
          }
          return result
        }
      }

      // iterate each part inside the hash to check raw key and value pairs
      for (const part of parts) {
        if (!part) continue // empty parts
        
        const equalIndex = part.indexOf('=')
        let rawKey: string
        let rawValue: string
        
        if (equalIndex === -1) {
          // treat whole part as key with empty value if no -1
          rawKey = part
          rawValue = ''
        } else {
          rawKey = part.substring(0, equalIndex)
          rawValue = part.substring(equalIndex + 1)
        }

        if (!rawKey) continue

        try {
          const key = decode ? decodeURIComponent(rawKey) : rawKey
          const value = decode ? decodeURIComponent(rawValue) : rawValue

          // after decode, add to the record
          result[key] = value
        } catch {
          const key = rawKey
          const value = rawValue
          result[key] = value
        }
      }

      return result
    },
    [parse, separator, decode],
  )

  const [rawHash, setRawHash] = useState<string | null>(() => {
    if (checkIsSSR()) return null
    const currentRawHash = window.location.hash || ''
    return currentRawHash
  })
  
  const [hash, setHashState] = useState<string | null>(() => {
    if (checkIsSSR()) return null
    const currentRawHash = window.location.hash || ''
    const clean = currentRawHash.replace('#', '') || defaultHash || ''
    return clean
  })
  
  const [parsed, setParsed] = useState<Record<string, string> | null>(() => {
    if (checkIsSSR()) return null
    const currentRawHash = window.location.hash || ''
    const clean = currentRawHash.replace('#', '') || defaultHash || ''
    return parse ? parseHash(clean) : null
  })

  const syncFromLocation = useCallback(() => {
    if (checkIsSSR()) return

    const currentRawHash = window.location.hash || ''
    const clean = currentRawHash.replace('#', '') || defaultHash || ''
    const parsedResult = parse ? parseHash(clean) : null

    setRawHash(currentRawHash)
    setHashState(clean)
    setParsed(parsedResult)
  }, [defaultHash, parse, parseHash])

  const setHash = useCallback((newValue?: string) => {
    const valueToSet = newValue ?? value
    const normalized = valueToSet.startsWith('#') ? valueToSet : '#' + valueToSet

    if (replace) {
      history.replaceState(null, '', normalized)
    } else {
      window.location.hash = normalized
    }

    syncFromLocation()
  }, [syncFromLocation, value, replace])

  const clearHash = useCallback(() => {
    if (replace) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    } else {
      window.location.hash = ''
    }

    syncFromLocation()
  }, [replace, syncFromLocation])

  useEffect(() => {
    if (rawHash === null && hash === null && parsed === null) {
      queueMicrotask(() => syncFromLocation())
    }
  }, [rawHash, hash, parsed, syncFromLocation])

  useEffect(() => {
    if (checkIsSSR()) return

    window.addEventListener('hashchange', syncFromLocation)

    return () => {
      window.removeEventListener('hashchange', syncFromLocation)
    }
  }, [syncFromLocation])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncFromLocation()
  }, [parse, separator, decode, syncFromLocation])

  return {
    hash,
    rawHash,
    parsed,
    setHash,
    clearHash,
  }
}
