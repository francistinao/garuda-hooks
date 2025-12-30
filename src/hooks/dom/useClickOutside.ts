import { useEffect, RefObject, useCallback } from 'react'
import { isSSR } from '../../helpers/is-ssr'

type EventType = 'mousedown' | 'touchstart'

interface Options {
  enabled?: boolean
  eventTypes?: Array<EventType>
  capture?: boolean
}

export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: (event: Event) => void,
  options: Options = {},
) {
  const { enabled = true, eventTypes = ['mousedown', 'touchstart'], capture } = options

  const normalizedTargets = useCallback(
    (input: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[]): HTMLElement[] => {
      if (isSSR) return []

      const inputArray = Array.isArray(input) ? input : [input]

      const resolvedTargets: HTMLElement[] = []

      for (const ref of inputArray) {
        const element = ref?.current
        if (element instanceof HTMLElement) resolvedTargets.push(element)
      }

      return [...new Set(resolvedTargets)]
    },
    [],
  )

  // const handleEvent = useCallback((event: MouseEvent) => {
  //     targetRefs.current?.forEach(element => {
  //         const target = event.target as Node | null
  //         if(element.contains(target)) {

  //         }
  //     });
  // }, [])

  useEffect(() => {
    if (isSSR || !enabled) return

    // normalize ref
    const refArray = normalizedTargets(refs)

    const eventListener = (event: Event) => {
      const target = event.target as Node | null

      if (!target) return

      // check if the componen tfrom the file is inside the target ref
      /**
       * example:
       *
       * <Parent ref={ref}>
       *   <ComponentToCheck /> <- this is what we're going to check if it belongs inside in the target node
       * </Parent>
       */
      const isInsideTarget = refArray.some((ref) => {
        const element = ref

        return element && element.contains(target)
      })

      if (!isInsideTarget) {
        handler(event)
      }
    }

    eventTypes.forEach((type) => {
      document.addEventListener(type, eventListener, capture)
    })

    return () => {
      eventTypes.forEach((type) => {
        document.removeEventListener(type, eventListener, capture)
      })
    }
  }, [refs, handler, enabled, eventTypes, capture, normalizedTargets])
}