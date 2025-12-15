# useColorScheme

A powerful and robust hook for managing color schemes (light/dark/system themes) with TypeScript support, SSR safety, and advanced color customization features.

## Features

- 🌓 **Multi-mode Support**: Light, dark, and system preference detection
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- 🎨 **Color Customization**: Full control over color palettes with individual color management
- 💾 **Persistent Storage**: Automatically saves preferences to localStorage/sessionStorage
- 📱 **System Integration**: Listens to system preference changes in real-time
- 🎯 **TypeScript**: Full type safety with comprehensive interfaces
- ⚡ **Performance**: Optimized with proper cleanup and error handling

## API Reference

```typescript
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

function useColorScheme(options?: Options): UseColorSchemeResult
```

## Usage Examples

### Basic Usage

```tsx
import { useColorScheme } from 'garuda-hooks'

function ThemeToggle() {
  const { mode, resolvedMode, setMode, toggleMode } = useColorScheme()

  return (
    <div>
      <p>Current mode: {mode}</p>
      <p>Resolved mode: {resolvedMode}</p>
      <button onClick={() => setMode('light')}>Light</button>
      <button onClick={() => setMode('dark')}>Dark</button>
      <button onClick={() => setMode('system')}>System</button>
      <button onClick={toggleMode}>Toggle</button>
    </div>
  )
}
```

### Custom Color Palettes

```tsx
function CustomThemeApp() {
  const { colors, setColor, resolvedMode } = useColorScheme({
    themes: {
      light: {
        primary: '#3b82f6',    // Custom blue
        secondary: '#f1f5f9'   // Custom gray
      },
      dark: {
        primary: '#1e40af',    // Darker blue
        secondary: '#0f172a'   // Dark gray
      }
    }
  })

  const updatePrimaryColor = (color: string) => {
    setColor(resolvedMode, 'primary', color)
  }

  return (
    <div style={{ 
      backgroundColor: colors.secondary, 
      color: colors.primary 
    }}>
      <h1>Custom Theme App</h1>
      <p>Primary: {colors.primary}</p>
      <p>Secondary: {colors.secondary}</p>
      <button onClick={() => updatePrimaryColor('#ef4444')}>
        Change to Red
      </button>
    </div>
  )
}
```

### With System Preference Detection

```tsx
function SystemAwareTheme() {
  const { 
    mode, 
    resolvedMode, 
    isSystemDark, 
    setMode 
  } = useColorScheme({
    defaultMode: 'system',
    enableSystem: true
  })

  return (
    <div>
      <p>Selected mode: {mode}</p>
      <p>Resolved mode: {resolvedMode}</p>
      <p>System prefers dark: {isSystemDark ? 'Yes' : 'No'}</p>
      
      {mode === 'system' && (
        <p>
          Following system preference: {isSystemDark ? 'Dark' : 'Light'}
        </p>
      )}
      
      <button onClick={() => setMode('system')}>
        Use System Preference
      </button>
    </div>
  )
}
```

### Advanced Configuration

```tsx
function AdvancedThemeManager() {
  const { 
    mode, 
    colors, 
    setMode, 
    getColor, 
    resetScheme 
  } = useColorScheme({
    defaultMode: 'light',
    storage: 'session',           // Use sessionStorage
    storageKey: 'app-theme',      // Custom storage key
    enableSystem: true,
    themes: {
      light: {
        primary: '#2563eb',
        secondary: '#f8fafc'
      },
      dark: {
        primary: '#60a5fa',
        secondary: '#1e293b'
      }
    }
  })

  return (
    <div style={{ 
      backgroundColor: colors.secondary,
      color: getColor('primary'),
      padding: '20px',
      borderRadius: '8px'
    }}>
      <h2>Advanced Theme Manager</h2>
      <p>Current mode: {mode}</p>
      
      <div>
        <button onClick={() => setMode('light')}>Light</button>
        <button onClick={() => setMode('dark')}>Dark</button>
        <button onClick={() => setMode('system')}>Auto</button>
        <button onClick={resetScheme}>Reset</button>
      </div>
    </div>
  )
}
```

### Dynamic Color Updates

```tsx
function ColorCustomizer() {
  const { resolvedMode, colors, setColor } = useColorScheme()

  const presetColors = {
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#10b981',
    purple: '#8b5cf6'
  }

  return (
    <div>
      <h3>Customize Colors</h3>
      <p>Current theme: {resolvedMode}</p>
      
      <div>
        <h4>Primary Color</h4>
        {Object.entries(presetColors).map(([name, color]) => (
          <button
            key={name}
            style={{ backgroundColor: color, color: 'white' }}
            onClick={() => setColor(resolvedMode, 'primary', color)}
          >
            {name}
          </button>
        ))}
      </div>

      <div style={{ 
        marginTop: '20px',
        padding: '10px',
        backgroundColor: colors.secondary,
        color: colors.primary
      }}>
        Preview: Primary color is {colors.primary}
      </div>
    </div>
  )
}
```

## Next.js Specific Usage

### SSR-Safe Pattern (Pages Router)

```tsx
// pages/theme-demo.tsx
import { useColorScheme } from 'garuda-hooks'
import { useEffect, useState } from 'react'

export default function ThemeDemo() {
  const { colors, mode, setMode } = useColorScheme({
    defaultMode: 'system'
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div style={{ padding: '20px' }}>
        <div>Loading theme...</div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: colors.secondary,
      color: colors.primary,
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h1>Theme Demo</h1>
      <p>Current mode: {mode}</p>
      
      <div>
        <button onClick={() => setMode('light')}>Light</button>
        <button onClick={() => setMode('dark')}>Dark</button>
        <button onClick={() => setMode('system')}>Auto</button>
      </div>
    </div>
  )
}
```

### App Router Pattern

```tsx
'use client'

import { useColorScheme } from 'garuda-hooks'
import { useEffect } from 'react'

export default function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  const { colors, resolvedMode } = useColorScheme({
    defaultMode: 'system',
    themes: {
      light: {
        primary: '#1f2937',
        secondary: '#ffffff'
      },
      dark: {
        primary: '#f9fafb',
        secondary: '#111827'
      }
    }
  })

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.style.setProperty('--color-primary', colors.primary)
    document.documentElement.style.setProperty('--color-secondary', colors.secondary)
    document.documentElement.setAttribute('data-theme', resolvedMode)
  }, [colors, resolvedMode])

  return (
    <div style={{
      backgroundColor: colors.secondary,
      color: colors.primary,
      minHeight: '100vh'
    }}>
      {children}
    </div>
  )
}
```

### CSS Variables Integration

```tsx
// components/ThemeProvider.tsx
'use client'

import { useColorScheme } from 'garuda-hooks'
import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colors, resolvedMode } = useColorScheme({
    themes: {
      light: {
        primary: '#1f2937',
        secondary: '#ffffff'
      },
      dark: {
        primary: '#f8fafc',
        secondary: '#1e293b'
      }
    }
  })

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-secondary', colors.secondary)
    root.setAttribute('data-theme', resolvedMode)
  }, [colors, resolvedMode])

  return <>{children}</>
}
```

```css
/* globals.css */
:root {
  --color-primary: #1f2937;
  --color-secondary: #ffffff;
}

[data-theme="dark"] {
  --color-primary: #f8fafc;
  --color-secondary: #1e293b;
}

body {
  background-color: var(--color-secondary);
  color: var(--color-primary);
}

.card {
  background-color: var(--color-secondary);
  border: 1px solid var(--color-primary);
}
```

## Best Practices

### 1. Type Safety with Custom Palettes

```tsx
interface ExtendedColorPalette {
  primary: string
  secondary: string
  accent: string
  text: string
  background: string
}

// Note: Currently the hook supports primary/secondary
// This example shows how you might extend it
function ExtendedThemeApp() {
  const { colors, setColor, resolvedMode } = useColorScheme({
    themes: {
      light: {
        primary: '#3b82f6',
        secondary: '#f1f5f9'
      },
      dark: {
        primary: '#60a5fa',
        secondary: '#1e293b'
      }
    }
  })

  // Extend colors with computed values
  const extendedColors = {
    ...colors,
    accent: resolvedMode === 'dark' ? '#fbbf24' : '#f59e0b',
    text: colors.primary,
    background: colors.secondary
  }

  return (
    <div style={{ backgroundColor: extendedColors.background }}>
      {/* Your component */}
    </div>
  )
}
```

### 2. Theme Persistence Across Sessions

```tsx
function PersistentThemeApp() {
  const { mode, setMode, colors } = useColorScheme({
    defaultMode: 'system',
    storage: 'local',              // Persists across browser sessions
    storageKey: 'user-theme-pref'  // Custom key for your app
  })

  // Theme will automatically load from localStorage on mount
  return (
    <div style={{
      backgroundColor: colors.secondary,
      color: colors.primary,
      transition: 'background-color 0.3s, color 0.3s' // Smooth transitions
    }}>
      <p>Your theme preference is saved!</p>
      <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  )
}
```

### 3. Performance Optimization

```tsx
import { useMemo } from 'react'

function OptimizedThemeComponent() {
  const { colors, resolvedMode } = useColorScheme()

  // Memoize expensive style calculations
  const containerStyle = useMemo(() => ({
    backgroundColor: colors.secondary,
    color: colors.primary,
    boxShadow: resolvedMode === 'dark' 
      ? '0 4px 6px rgba(255, 255, 255, 0.1)'
      : '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease'
  }), [colors, resolvedMode])

  return (
    <div style={containerStyle}>
      <p>Optimized theme component</p>
    </div>
  )
}
```

### 4. Error Handling and Fallbacks

```tsx
function RobustThemeComponent() {
  const { 
    colors, 
    mode, 
    setMode, 
    resetScheme 
  } = useColorScheme({
    defaultMode: 'light',
    themes: {
      light: { primary: '#000000', secondary: '#ffffff' },
      dark: { primary: '#ffffff', secondary: '#000000' }
    }
  })

  const handleThemeChange = (newMode: 'light' | 'dark' | 'system') => {
    try {
      setMode(newMode)
    } catch (error) {
      console.error('Failed to change theme:', error)
      // Reset to safe defaults
      resetScheme()
    }
  }

  return (
    <div>
      <button onClick={() => handleThemeChange('light')}>
        Light Mode
      </button>
      <button onClick={() => handleThemeChange('dark')}>
        Dark Mode
      </button>
    </div>
  )
}
```

## Common Patterns

### Theme Toggle Button

```tsx
function ThemeToggleButton() {
  const { resolvedMode, toggleMode } = useColorScheme()

  return (
    <button
      onClick={toggleMode}
      aria-label={`Switch to ${resolvedMode === 'light' ? 'dark' : 'light'} mode`}
    >
      {resolvedMode === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
```

### Theme Settings Panel

```tsx
function ThemeSettings() {
  const { 
    mode, 
    resolvedMode, 
    isSystemDark, 
    setMode, 
    colors,
    setColor,
    resetScheme
  } = useColorScheme()

  return (
    <div className="theme-settings">
      <h3>Theme Settings</h3>
      
      <div>
        <label>
          <input
            type="radio"
            checked={mode === 'light'}
            onChange={() => setMode('light')}
          />
          Light Mode
        </label>
        
        <label>
          <input
            type="radio"
            checked={mode === 'dark'}
            onChange={() => setMode('dark')}
          />
          Dark Mode
        </label>
        
        <label>
          <input
            type="radio"
            checked={mode === 'system'}
            onChange={() => setMode('system')}
          />
          System ({isSystemDark ? 'Dark' : 'Light'})
        </label>
      </div>

      <div>
        <h4>Customize Colors</h4>
        <label>
          Primary Color:
          <input
            type="color"
            value={colors.primary}
            onChange={(e) => setColor(resolvedMode, 'primary', e.target.value)}
          />
        </label>
        
        <label>
          Secondary Color:
          <input
            type="color"
            value={colors.secondary}
            onChange={(e) => setColor(resolvedMode, 'secondary', e.target.value)}
          />
        </label>
      </div>

      <button onClick={resetScheme}>
        Reset to Defaults
      </button>
    </div>
  )
}
```

### Integration with UI Libraries

```tsx
// Example with styled-components or emotion
import styled from 'styled-components'

const ThemedContainer = styled.div<{ colors: ColorPalette }>`
  background-color: ${props => props.colors.secondary};
  color: ${props => props.colors.primary};
  padding: 20px;
  border-radius: 8px;
  transition: background-color 0.3s ease, color 0.3s ease;
`

function StyledThemeComponent() {
  const { colors } = useColorScheme()

  return (
    <ThemedContainer colors={colors}>
      <h2>Styled Theme Component</h2>
      <p>This component uses styled-components with theme colors</p>
    </ThemedContainer>
  )
}
```

## Troubleshooting

### Hydration Mismatches in Next.js

If you encounter hydration errors:

```tsx
function HydrationSafeTheme() {
  const [mounted, setMounted] = useState(false)
  const { colors, mode } = useColorScheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state during SSR
  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ backgroundColor: colors.secondary }}>
      Theme loaded: {mode}
    </div>
  )
}
```

### System Preference Not Updating

Ensure `enableSystem` is set to `true`:

```tsx
const { isSystemDark } = useColorScheme({
  enableSystem: true,  // Required for system preference detection
  defaultMode: 'system'
})
```

### Storage Errors

Handle storage quota or permissions issues:

```tsx
function StorageAwareTheme() {
  const { mode, setMode } = useColorScheme({
    storage: 'local',
    storageKey: 'my-theme'
  })

  const handleModeChange = (newMode: 'light' | 'dark' | 'system') => {
    try {
      setMode(newMode)
    } catch (error) {
      console.warn('Could not save theme preference:', error)
      // Theme will still work, just won't persist
    }
  }

  return (
    <button onClick={() => handleModeChange('dark')}>
      Set Dark Mode
    </button>
  )
}
```

## Performance Considerations

- The hook automatically handles cleanup of event listeners
- Color updates are optimized with React's state batching
- System preference detection uses native `matchMedia` API
- Storage operations are wrapped in try-catch for reliability
- All callbacks are properly memoized to prevent unnecessary re-renders
- The hook is SSR-safe and won't cause hydration mismatches when used correctly

## Migration Guide

### From Other Theme Libraries

If migrating from other theme solutions:

```tsx
// Before (typical theme context)
const { theme, setTheme } = useThemeContext()

// After (useColorScheme)
const { resolvedMode, setMode, colors } = useColorScheme()

// Mode mapping
// theme === 'light' -> setMode('light')
// theme === 'dark' -> setMode('dark')
// Access colors directly from colors object
```

The `useColorScheme` hook provides a more comprehensive solution with built-in storage, system preference detection, and granular color control.