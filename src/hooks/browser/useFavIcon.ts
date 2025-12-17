/**
 *  useFavIcon:
 * 
 *  lets a component read, set, updated, and optionally restore the page's favicon
 * which is in a format of <link rel="icon">
 * 
 * React component-based icons are also considered by converting it first to svg
 * 
 */

import { useState, useEffect, useCallback, ReactElement, useRef, isValidElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { isSSR } from '../../helpers/is-ssr'

interface Options {
  icon: ReactElement | string
  options?: {
    restoreOnUnmount?: boolean
    size?: number
    backgroundColor?: string
  }
}

interface UseFavIconResult {
  currentHref: string | null
  setFavicon: (icon: string | ReactElement) => void
  restore: () => void
}

export function useFavIcon({
  icon,
  options,
}: {
  icon: Options['icon']
  options?: Options['options']
}): UseFavIconResult {
  const linkRef = useRef<HTMLLinkElement | null>(null)
  const previousHrefRef = useRef<string | null>(null)
  const currentHrefRef = useRef<string | null>(null)
  const [currentHref, setCurrentHref] = useState<string | null>(null)

  const getFavIcon = useCallback((): HTMLLinkElement | null => {
    if (linkRef.current) return linkRef.current

    let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')

    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      link.type = 'image/png'
      document.head.appendChild(link)
    }

    linkRef.current = link
    return link
  }, [])

  // convert from react element icon type to svg 
  // sole purpose of converting to favicon since favicon is svg
  const convertIconToFavicon = useCallback((icon: ReactElement): string => {
    const svg = renderToStaticMarkup(icon)
    const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22')

    return `data:image/svg+xml,${encoded}`
  }, [])

  const setFavicon = useCallback(
    (nextIcon: string | ReactElement) => {
      if (isSSR) return

      const link = getFavIcon()
      if (!link) return

      if (!previousHrefRef.current) {
        previousHrefRef.current = link.href || null
      }

      const nextHref =
        typeof nextIcon === 'string'
          ? nextIcon
          : isValidElement(nextIcon)
            ? convertIconToFavicon(nextIcon)
            : null

      if (!nextHref) return

      link.href = nextHref
      currentHrefRef.current = nextHref
      setCurrentHref(nextHref)
    },
    [getFavIcon, convertIconToFavicon],
  )

  const restore = useCallback(() => {
    if (!linkRef.current || !previousHrefRef.current) return
    linkRef.current.href = previousHrefRef.current
    currentHrefRef.current = previousHrefRef.current
    setCurrentHref(previousHrefRef.current)
  }, [])

  useEffect(() => {
    if (isSSR) return

    queueMicrotask(() => {
      setFavicon(icon)
    })
    return () => {
      if (options?.restoreOnUnmount) {
        restore()
      }
    }
  }, [icon, options?.restoreOnUnmount, setFavicon, restore])

  return {
    currentHref,
    setFavicon,
    restore,
  }
}
