import { useState, useCallback, useEffect, useRef } from 'react'
import { isSSR } from '../../helpers/is-ssr'

interface UseIdle {
  // props
  isIdle: boolean
  lastActivity: number
  idleTime: number
  reset?: () => void
  pause?: () => void
  resume?: () => void
}

const MAX_IDLE_TIME = 180000 // 3 minutes
const INITIAL_ACTIVITY = isSSR ? 0 : Date.now()

export function useIdle(): UseIdle {
  const [idleInfo, setIdleInfo] = useState<UseIdle>({
    isIdle: false,
    lastActivity: INITIAL_ACTIVITY,
    idleTime: 0,
  })

  const lastActivityRef = useRef<number>(INITIAL_ACTIVITY)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const listeningRef = useRef(false)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const now = Date.now()
    const elapsed = now - lastActivityRef.current
    setIdleInfo({
      isIdle: elapsed >= MAX_IDLE_TIME,
      idleTime: elapsed,
      lastActivity: lastActivityRef.current,
    })
  }, [])

  const startTimer = useCallback(() => {
    // always clear timer first to make sure
    stopTimer()
    timerRef.current = setInterval(tick, 1000)
  }, [stopTimer, tick])

  const handleActivity = useCallback(() => {
    if (isSSR) return
    const now = Date.now()
    lastActivityRef.current = now
    setIdleInfo({
      isIdle: false,
      idleTime: 0,
      lastActivity: now,
    })
  }, [])

  const attachListeners = useCallback(() => {
    if (isSSR || listeningRef.current) return
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keypress', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('mousedown', handleActivity)
    listeningRef.current = true
  }, [handleActivity])

  const detachListeners = useCallback(() => {
    if (isSSR || !listeningRef.current) return
    window.removeEventListener('mousemove', handleActivity)
    window.removeEventListener('keypress', handleActivity)
    window.removeEventListener('keydown', handleActivity)
    window.removeEventListener('mousedown', handleActivity)
    listeningRef.current = false
  }, [handleActivity])

  const reset = useCallback(() => {
    if (isSSR) return
    handleActivity()
    startTimer()
    attachListeners()
  }, [attachListeners, handleActivity, startTimer])

  const pause = useCallback(() => {
    detachListeners()
    stopTimer()
  }, [detachListeners, stopTimer])

  const resume = useCallback(() => {
    handleActivity()
    attachListeners()
    startTimer()
  }, [attachListeners, handleActivity, startTimer])

  useEffect(() => {
    if (isSSR) return

    startTimer()
    attachListeners()

    return () => {
      detachListeners()
      stopTimer()
    }
  }, [attachListeners, detachListeners, startTimer, stopTimer])

  return {
    isIdle: idleInfo?.isIdle,
    lastActivity: idleInfo?.lastActivity,
    idleTime: idleInfo?.idleTime,
    reset,
    pause,
    resume,
  }
}
