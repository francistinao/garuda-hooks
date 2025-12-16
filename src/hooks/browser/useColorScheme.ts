import { useState, useCallback, useEffect } from 'react'
import { isSSR } from '../../helpers/is-ssr'

interface ColorPalette {
  primary: string
  secondary: string
}

interface Options {
  defaultMode?: 'light' | 'dark' | 'system'
  themes?: {
    light?: Partial<ColorPalette>
    dark?: Partial<ColorPalette>
  }
  storage?: 'local' | 'session'
  storageKey?: string
  enableSystem?: boolean
}

interface UseColorSchemeResult {
  mode: 'light' | 'dark' | 'system'
  resolvedMode: 'light' | 'dark'
  colors: ColorPalette
  setMode: (newMode: 'light' | 'dark' | 'system') => void
  toggleMode: () => void
  setColor: (scheme: 'light' | 'dark', key: keyof ColorPalette, value: string) => void
  getColor: (key: keyof ColorPalette) => string
  resetScheme: () => void
  isSystemDark: boolean
}

const DEFAULT_PALETTES: { light: ColorPalette; dark: ColorPalette } = {
  light: { primary: '#FFFFFF', secondary: '#F0F0F0' },
  dark: { primary: '#000000', secondary: '#1A1A1A' },
}

export function useColorScheme(options: Options = {}): UseColorSchemeResult {
  const {
    defaultMode = 'system',
    themes = {},
    storage = 'local',
    storageKey = 'color-scheme',
    enableSystem = true,
  } = options

  // SSR-safe state initialization
  const [state, setState] = useState<{
    mode: 'light' | 'dark' | 'system'
    resolvedMode: 'light' | 'dark'
    isSystemDark: boolean
    palettes: { light: ColorPalette; dark: ColorPalette }
    initialized: boolean
  }>(() => {
    const mergedPalettes = {
      light: { ...DEFAULT_PALETTES.light, ...(themes.light ?? {}) },
      dark: { ...DEFAULT_PALETTES.dark, ...(themes.dark ?? {}) },
    }

    return {
      mode: defaultMode,
      resolvedMode: 'light', // Safe default for SSR
      isSystemDark: false,
      palettes: mergedPalettes,
      initialized: false,
    }
  })

  // Resolve system preference safely
  const getSystemPreference = useCallback((): boolean => {
    if (isSSR || !enableSystem) return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [enableSystem])

  // Resolve the actual mode to use
  const resolveMode = useCallback(
    (mode: 'light' | 'dark' | 'system', systemDark: boolean): 'light' | 'dark' => {
      if (mode === 'system') {
        return systemDark ? 'dark' : 'light'
      }
      return mode
    },
    [],
  )

  const getStorage = useCallback(() => {
    if (isSSR) return null
    try {
      return storage === 'local' ? localStorage : sessionStorage
    } catch {
      return null
    }
  }, [storage])

  const loadFromStorage = useCallback((): 'light' | 'dark' | 'system' | null => {
    const storageInstance = getStorage()
    if (!storageInstance) return null

    try {
      const stored = storageInstance.getItem(storageKey)
      if (!stored) return null

      const parsed = JSON.parse(stored)
      if (typeof parsed === 'string' && ['light', 'dark', 'system'].includes(parsed)) {
        return parsed as 'light' | 'dark' | 'system'
      }
      if (
        parsed &&
        typeof parsed.mode === 'string' &&
        ['light', 'dark', 'system'].includes(parsed.mode)
      ) {
        return parsed.mode as 'light' | 'dark' | 'system'
      }
    } catch {}
    return null
  }, [storageKey, getStorage])

  const saveToStorage = useCallback(
    (mode: 'light' | 'dark' | 'system') => {
      const storageInstance = getStorage()
      if (!storageInstance) return

      try {
        storageInstance.setItem(storageKey, JSON.stringify({ mode, timestamp: Date.now() }))
      } catch {}
    },
    [storageKey, getStorage],
  )

  useEffect(() => {
    if (isSSR || state.initialized) return

    const systemDark = getSystemPreference()
    const storedMode = loadFromStorage()
    const initialMode = storedMode ?? defaultMode
    const initialResolved = resolveMode(initialMode, systemDark)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((prev) => ({
      ...prev,
      mode: initialMode,
      resolvedMode: initialResolved,
      isSystemDark: systemDark,
      initialized: true,
    }))
  }, [defaultMode, getSystemPreference, loadFromStorage, resolveMode, state.initialized])

  // Listen for system preference changes
  useEffect(() => {
    if (isSSR || !enableSystem) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setState((prev) => {
        const newResolved = resolveMode(prev.mode, e.matches)
        return {
          ...prev,
          isSystemDark: e.matches,
          resolvedMode: newResolved,
        }
      })
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [enableSystem, resolveMode])

  const setMode = useCallback(
    (newMode: 'light' | 'dark' | 'system') => {
      setState((prev) => {
        const newResolved = resolveMode(newMode, prev.isSystemDark)
        return {
          ...prev,
          mode: newMode,
          resolvedMode: newResolved,
        }
      })
      saveToStorage(newMode)
    },
    [resolveMode, saveToStorage],
  )

  const toggleMode = useCallback(() => {
    setState((prev) => {
      const newMode = prev.resolvedMode === 'light' ? 'dark' : 'light'
      saveToStorage(newMode)
      return {
        ...prev,
        mode: newMode,
        resolvedMode: newMode,
      }
    })
  }, [saveToStorage])

  const setColor = useCallback(
    (scheme: 'light' | 'dark', key: keyof ColorPalette, value: string) => {
      setState((prev) => ({
        ...prev,
        palettes: {
          ...prev.palettes,
          [scheme]: {
            ...prev.palettes[scheme],
            [key]: value,
          },
        },
      }))
    },
    [],
  )

  const getColor = useCallback(
    (key: keyof ColorPalette): string => {
      return state.palettes[state.resolvedMode][key]
    },
    [state.palettes, state.resolvedMode],
  )

  const resetScheme = useCallback(() => {
    const storageInstance = getStorage()
    if (storageInstance) {
      try {
        storageInstance.removeItem(storageKey)
      } catch {
        // ignore storage errors
      }
    }

    const systemDark = getSystemPreference()
    const resolvedDefault = resolveMode(defaultMode, systemDark)

    setState((prev) => ({
      ...prev,
      mode: defaultMode,
      resolvedMode: resolvedDefault,
      palettes: {
        light: { ...DEFAULT_PALETTES.light, ...(themes.light ?? {}) },
        dark: { ...DEFAULT_PALETTES.dark, ...(themes.dark ?? {}) },
      },
    }))
  }, [defaultMode, themes, storageKey, getStorage, getSystemPreference, resolveMode])

  return {
    mode: state.mode,
    resolvedMode: state.resolvedMode,
    colors: state.palettes[state.resolvedMode],
    setMode,
    toggleMode,
    setColor,
    getColor,
    resetScheme,
    isSystemDark: state.isSystemDark,
  }
}
