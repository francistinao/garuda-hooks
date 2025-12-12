import { useState, useCallback, useEffect } from 'react'

type MediaQueryOptions = {
  defaultMatch?: boolean
  initializeWithValue?: boolean
  ssrMatchMedia?: (q: string) => { matches: boolean }
}

type UseMediaQueryReturn = { matches: boolean }

export function useMediaQuery(query: string, options: MediaQueryOptions = {}): UseMediaQueryReturn {
  const isSSR = typeof window === 'undefined'
  const { defaultMatch, ssrMatchMedia, initializeWithValue = true } = options ?? {}

  const getMatch = useCallback(() => {
    if (isSSR || typeof window === 'undefined' || !window.matchMedia) {
      if (ssrMatchMedia) return ssrMatchMedia(query).matches
      return defaultMatch ?? false
    }
    return window.matchMedia(query).matches
  }, [query, defaultMatch, ssrMatchMedia, isSSR])

  const attachListener = useCallback(
    (media: MediaQueryList, onChange: EventListenerOrEventListenerObject) => {
      try {
        media.addEventListener('change', onChange)
        return () => media.removeEventListener('change', onChange)
      } catch {
        // return no operation
        return () => {}
      }
    },
    [],
  )

  const [matches, setMatches] = useState(() =>
    initializeWithValue ? getMatch() : (defaultMatch ?? false),
  )

  useEffect(() => {
    if (isSSR || typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia(query)

    const handleChange = (event: Event) =>
      setMatches('matches' in event ? (event as MediaQueryListEvent).matches : media.matches)

    const cleanup = attachListener(media, handleChange)
    return cleanup
  }, [query, attachListener, isSSR, initializeWithValue])

  return { matches }
}
