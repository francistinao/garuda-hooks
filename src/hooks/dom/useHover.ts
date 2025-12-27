import { useState, useRef, useEffect, useCallback, RefObject } from 'react'
import { isSSR } from '../../helpers/is-ssr'

type EventTypes = ['mouseenter', 'mouseleave', 'pointerenter', 'pointerleave']

type RefType = RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[]

interface Options {
  enabled: boolean
  delayEnter: number
  delayLeave: number
  onHoverChange: (isHovered: boolean) => void
  eventTypes: EventTypes
}

interface UseHoverResult {
  isHovered: boolean
  setIsHovered: (isHovered: boolean) => void
}

export default function useHover({
  refs,
  options,
}: {
  refs: RefType
  options: Options
}): UseHoverResult {
  const {
    enabled = true,
    delayEnter = 0,
    delayLeave = 0,
    onHoverChange,
  } = options ?? {}
  const [isHovered, setIsHovered] = useState(false)
  let enterTimeout = useRef<number | null>(null)
  let leaveTimeout = useRef<number | null>(null)

  const normalizeRefs = useCallback((inputRefs: RefType): HTMLElement[] => {
    if (isSSR) return []

    if (Array.isArray(inputRefs)) {
      return inputRefs
        .map((r) => r.current)
        .filter((el): el is HTMLElement => el instanceof HTMLElement)
    }

    return inputRefs.current ? [inputRefs.current] : []
  }, [])

  const handleMouseEvent = (type: 'enter' | 'leave') => {
    if (type === 'enter') {
      if (delayEnter > 0) {
        if (leaveTimeout.current) {
          clearTimeout(leaveTimeout.current)
          leaveTimeout.current = null
        }
        enterTimeout.current = window.setTimeout(() => {
          setIsHovered(true)
        }, delayEnter)
      } else {
        setIsHovered(true)
      }
    } else {
      if (delayLeave > 0) {
        if (enterTimeout.current) {
          clearTimeout(enterTimeout.current)
          enterTimeout.current = null
        }

        leaveTimeout.current = window.setTimeout(() => {
          setIsHovered(false)
        }, delayEnter)
      } else {
        setIsHovered(false)
      }
    }
  }

  useEffect(() => {
    if (isSSR || !enabled) return

    if (onHoverChange) onHoverChange(true)

    let elements = normalizeRefs(refs)

    const enterHandler = () => handleMouseEvent('enter')
    const leaveHandler = () => handleMouseEvent('leave')
    for (const element of elements) {
      element.addEventListener('mouseenter', enterHandler)
      element.addEventListener('mouseleave', leaveHandler)
    }

    return () => {
      for (const element of elements) {
        element.removeEventListener('mouseenter', enterHandler)
        element.removeEventListener('mouseleave', leaveHandler)
      }
    }
  }, [normalizeRefs, onHoverChange, enabled, refs])

  return {
    isHovered,
    setIsHovered,
  }
}
