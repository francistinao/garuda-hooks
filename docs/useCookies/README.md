# useCookie

A comprehensive hook for managing browser cookies with TypeScript support, custom encoding/decoding, and advanced configuration options.

## Features

- 🍪 **Full Cookie Support**: Path, domain, SameSite, secure, maxAge options
- 🎯 **TypeScript**: Generic support for type-safe cookie values
- 🔧 **Custom Encoding**: Support for custom encode/decode functions
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- ⚙️ **Configurable**: Extensive configuration options

## API Reference

```typescript
interface UseCookieOptions<T> {
  decode?: (value: string | null) => T | null
  encode?: (value: T | null) => string
  path?: string
  domain?: string
  sameSite?: 'strict' | 'lax' | 'none'
  secure?: boolean
  maxAge?: number // seconds
}

interface UseCookiesReturn<T> {
  value: T | null
  readCookie: () => T | null
  setCookie: (val: T | null) => void
  removeCookie: () => void
}

function useCookie<T = string>(
  key: string,
  initialValue: T | null,
  options?: UseCookieOptions<T>
): UseCookiesReturn<T>
```

## Usage Examples

### Basic Usage

```tsx
import { useCookie } from 'garuda-hooks'

function UserPreferences() {
  const { value: theme, setCookie: setTheme, removeCookie: clearTheme } = useCookie(
    'theme',
    'light'
  )

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={clearTheme}>Reset Theme</button>
    </div>
  )
}
```

### Complex Object Storage

```tsx
interface UserSettings {
  language: string
  timezone: string
  notifications: boolean
}

function SettingsManager() {
  const { value: settings, setCookie: saveSettings } = useCookie<UserSettings>(
    'user-settings',
    {
      language: 'en',
      timezone: 'UTC',
      notifications: true
    },
    {
      // Custom JSON encoding/decoding for complex objects
      encode: (value) => JSON.stringify(value),
      decode: (value) => value ? JSON.parse(value) : null,
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      sameSite: 'lax'
    }
  )

  const updateLanguage = (language: string) => {
    if (settings) {
      saveSettings({ ...settings, language })
    }
  }

  return (
    <div>
      <p>Language: {settings?.language}</p>
      <button onClick={() => updateLanguage('es')}>Español</button>
      <button onClick={() => updateLanguage('fr')}>Français</button>
    </div>
  )
}
```

### Authentication Cookie

```tsx
interface AuthData {
  token: string
  userId: string
  expiresAt: number
}

function AuthManager() {
  const { value: authData, setCookie: setAuth, removeCookie: logout } = useCookie<AuthData>(
    'auth',
    null,
    {
      encode: (value) => value ? btoa(JSON.stringify(value)) : '', // Base64 encode
      decode: (value) => {
        if (!value) return null
        try {
          return JSON.parse(atob(value))
        } catch {
          return null
        }
      },
      secure: true, // HTTPS only
      sameSite: 'strict', // Strict same-site policy
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    }
  )

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await authenticateUser(credentials)
      setAuth({
        token: response.token,
        userId: response.userId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      })
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div>
      {authData ? (
        <div>
          <p>Logged in as user: {authData.userId}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <LoginForm onLogin={login} />
      )}
    </div>
  )
}
```

### Cookie Consent Management

```tsx
interface ConsentData {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  timestamp: number
}

function CookieConsent() {
  const { value: consent, setCookie: setConsent, readCookie } = useCookie<ConsentData>(
    'cookie-consent',
    null,
    {
      encode: JSON.stringify,
      decode: (value) => value ? JSON.parse(value) : null,
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax'
    }
  )

  const handleConsent = (type: keyof Omit<ConsentData, 'timestamp'>, granted: boolean) => {
    const updatedConsent = {
      ...consent,
      [type]: granted,
      timestamp: Date.now()
    } as ConsentData

    setConsent(updatedConsent)
  }

  const acceptAll = () => {
    setConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now()
    })
  }

  if (consent) {
    return null // Don't show banner if consent already given
  }

  return (
    <div className="cookie-banner">
      <p>We use cookies to improve your experience.</p>
      <div>
        <button onClick={acceptAll}>Accept All</button>
        <button onClick={() => handleConsent('necessary', true)}>
          Necessary Only
        </button>
      </div>
    </div>
  )
}
```

## Next.js Specific Usage

### App Router Cookie Management

```tsx
'use client'

import { useCookie } from 'garuda-hooks'

function ClientCookieManager() {
  const { value: userPrefs, setCookie } = useCookie(
    'user-prefs',
    { theme: 'system', language: 'en' },
    {
      encode: JSON.stringify,
      decode: (value) => value ? JSON.parse(value) : null
    }
  )

  return (
    <div>
      <p>Theme: {userPrefs?.theme}</p>
      <button onClick={() => setCookie({ ...userPrefs, theme: 'dark' })}>
        Set Dark Theme
      </button>
    </div>
  )
}
```

### SSR-Safe Cookie Reading

```tsx
import { useCookie } from 'garuda-hooks'
import { useEffect, useState } from 'react'

export default function SSRSafePage() {
  const { readCookie } = useCookie('user-id', null)
  const [userId, setUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setUserId(readCookie())
  }, [readCookie])

  if (!mounted) {
    return <div>Loading...</div> // Prevent hydration mismatch
  }

  return (
    <div>
      {userId ? (
        <p>User ID: {userId}</p>
      ) : (
        <p>No user logged in</p>
      )}
    </div>
  )
}
```

### Analytics Cookies

```tsx
function AnalyticsTracker() {
  const { value: analyticsId, setCookie: setAnalyticsId } = useCookie(
    'analytics-id',
    null,
    {
      maxAge: 2 * 365 * 24 * 60 * 60, // 2 years
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  )

  useEffect(() => {
    // Generate analytics ID if not present
    if (!analyticsId) {
      const newId = crypto.randomUUID()
      setAnalyticsId(newId)
    }
  }, [analyticsId, setAnalyticsId])

  useEffect(() => {
    // Track page views with analytics ID
    if (analyticsId) {
      trackPageView(analyticsId)
    }
  }, [analyticsId])

  return null // Analytics component doesn't render UI
}
```

## Advanced Patterns

### Multi-Domain Cookie Sharing

```tsx
function CrossDomainCookies() {
  const { setCookie } = useCookie(
    'shared-data',
    null,
    {
      domain: '.example.com', // Works across *.example.com
      path: '/',
      secure: true,
      sameSite: 'none' // Required for cross-site cookies
    }
  )

  const shareData = (data: any) => {
    setCookie(data)
    // This cookie will be available on app.example.com, api.example.com, etc.
  }

  return <div>{/* Your component */}</div>
}
```

### Cookie Synchronization Between Tabs

```tsx
function SyncedCookieState() {
  const { value, setCookie, readCookie } = useCookie('synced-state', { count: 0 })

  useEffect(() => {
    const handleFocus = () => {
      // Re-read cookie when tab regains focus
      const latest = readCookie()
      if (latest) {
        // Update state if cookie changed in another tab
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [readCookie])

  return (
    <div>
      <p>Count: {value?.count}</p>
      <button onClick={() => setCookie({ count: (value?.count || 0) + 1 })}>
        Increment
      </button>
    </div>
  )
}
```

### Encrypted Cookie Storage

```tsx
import CryptoJS from 'crypto-js'

const SECRET_KEY = process.env.NEXT_PUBLIC_COOKIE_SECRET || 'fallback-secret'

function EncryptedCookieManager() {
  const { value: secretData, setCookie } = useCookie(
    'encrypted-data',
    null,
    {
      encode: (value) => {
        if (!value) return ''
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(value), SECRET_KEY).toString()
        return encrypted
      },
      decode: (value) => {
        if (!value) return null
        try {
          const bytes = CryptoJS.AES.decrypt(value, SECRET_KEY)
          const decryptedData = bytes.toString(CryptoJS.enc.Utf8)
          return JSON.parse(decryptedData)
        } catch {
          return null
        }
      },
      secure: true,
      sameSite: 'strict'
    }
  )

  return <div>{/* Your component */}</div>
}
```

## Best Practices

### 1. Cookie Size Limitations
Keep cookie values under 4KB:

```tsx
function OptimizedCookieStorage() {
  const { setCookie } = useCookie('compact-data', null)

  const saveCompactData = (largeObject: any) => {
    // Compress or select only essential data
    const essentialData = {
      id: largeObject.id,
      key: largeObject.importantKey
      // Skip large arrays, detailed info, etc.
    }
    setCookie(essentialData)
  }

  return <div>{/* Your component */}</div>
}
```

### 2. Security Considerations

```tsx
function SecureCookieHandling() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  const { setCookie } = useCookie(
    'sensitive-data',
    null,
    {
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict',   // Prevent CSRF
      maxAge: 60 * 60,      // Short expiration for sensitive data
      // Consider httpOnly cookies for highly sensitive data (set server-side)
    }
  )

  return <div>{/* Your component */}</div>
}
```

### 3. Performance Optimization

```tsx
function PerformantCookieUsage() {
  // Read cookie value once and cache it
  const { value, setCookie } = useCookie('cached-data', null)
  const [localState, setLocalState] = useState(value)

  // Sync local state with cookie when needed
  const syncWithCookie = useCallback(() => {
    setCookie(localState)
  }, [localState, setCookie])

  // Batch updates and sync periodically
  useEffect(() => {
    const timer = setTimeout(syncWithCookie, 1000)
    return () => clearTimeout(timer)
  }, [localState, syncWithCookie])

  return <div>{/* Your component */}</div>
}
```

## Common Use Cases

### Shopping Cart Persistence

```tsx
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

function PersistentCart() {
  const { value: cart, setCookie } = useCookie<CartItem[]>(
    'shopping-cart',
    [],
    {
      encode: JSON.stringify,
      decode: (value) => value ? JSON.parse(value) : [],
      maxAge: 7 * 24 * 60 * 60 // 7 days
    }
  )

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    const updatedCart = [...(cart || []), { ...item, quantity: 1 }]
    setCookie(updatedCart)
  }

  return <div>{/* Cart UI */}</div>
}
```

### Language/Locale Preference

```tsx
function LocaleManager() {
  const { value: locale, setCookie } = useCookie(
    'locale',
    'en',
    {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      sameSite: 'lax'
    }
  )

  useEffect(() => {
    // Apply locale to the app
    if (locale) {
      document.documentElement.lang = locale
      // Load locale-specific resources
    }
  }, [locale])

  return (
    <div>
      <select value={locale || 'en'} onChange={(e) => setCookie(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </div>
  )
}
```

## Troubleshooting

### Cookie Not Setting
Check domain and path configuration:

```tsx
// ✅ Correct path configuration
const { setCookie } = useCookie('my-cookie', null, {
  path: '/' // Available site-wide
})

// ❌ Incorrect - too restrictive
const { setCookie } = useCookie('my-cookie', null, {
  path: '/admin' // Only available on /admin pages
})
```

### SameSite Issues
Adjust SameSite policy based on use case:

```tsx
// For cross-site requests (requires HTTPS)
const { setCookie } = useCookie('cross-site-cookie', null, {
  sameSite: 'none',
  secure: true
})

// For same-site only (default, most secure)
const { setCookie } = useCookie('same-site-cookie', null, {
  sameSite: 'strict'
})
```

### SSR Hydration Mismatches
Always handle SSR safely:

```tsx
function SSRSafeComponent() {
  const { value } = useCookie('my-cookie', null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading...</div>
  }

  return <div>Cookie value: {value}</div>
}
```