import { useEffect, useRef } from 'react'
import { isSSR } from '../../helpers/is-ssr'

interface Options {
  // when component stops existing, putting document back to what it is before (document.title)
  restoreOnUnmount: boolean
}

export function useDocumentTitle({ title, options }: { title?: string; options: Options }) {
  const { restoreOnUnmount = false } = options ?? {}
  const previousTitleRef = useRef<string | null>(null)

  useEffect(() => {
    if (isSSR) return

    if (previousTitleRef.current === null) {
      previousTitleRef.current = document.title
    }

    if (title && title !== document.title) {
      document.title = title
    }

    return () => {
      if (restoreOnUnmount && previousTitleRef.current !== null) {
        document.title = previousTitleRef.current
      }
    }
  }, [title, restoreOnUnmount])
}
