# useLocalStorage

A robust hook for managing localStorage with TypeScript support, SSR safety, and advanced features like search functionality.

## Features

- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- 🔍 **Search**: Built-in search functionality across stored values
- 🎯 **TypeScript**: Full type safety with generic support
- 🔄 **Cross-storage**: Optional access to sessionStorage
- ⚡ **Performance**: Optimized with proper caching and error handling

## API Reference

```typescript
interface UseLocalStorageReturn<T> {
  storedValue: T
  setValue: (value: T | ((prev: T) => T)) => void
  removeValue: () => void
  getStoredValue: (whichStorage?: STORAGE_ENV) => T | undefined
  isSSR: boolean
  searchValue: (search: string, whichStorage?: STORAGE_ENV) => T[] | undefined
}

function useLocalStorage<T>(key: string, initialValue: T): UseLocalStorageReturn<T>
```

## Usage Examples

> The hook returns an object. Destructure with `{}` and alias `storedValue`
> to a domain name (e.g., `user`, `cart`, `prefs`).

### Basic Usage

```tsx
import { useLocalStorage } from 'garuda-hooks'

function UserProfile() {
  const {
    storedValue: user,
    setValue: setUser,
    removeValue: removeUser,
  } = useLocalStorage('user', { name: '', email: '' })

  return (
    <div>
      <p>Name: {user.name}</p>
      <button onClick={() => setUser({ name: 'John', email: 'john@example.com' })}>
        Set User
      </button>
      <button onClick={removeUser}>Clear User</button>
    </div>
  )
}
```

### With Complex Objects

```tsx
interface Settings {
  theme: 'light' | 'dark'
  notifications: boolean
  language: string
}

function SettingsPanel() {
  const { storedValue: settings, setValue: setSettings } = useLocalStorage<Settings>(
    'app-settings',
    {
      theme: 'light',
      notifications: true,
      language: 'en'
    }
  )

  const updateTheme = (theme: Settings['theme']) => {
    setSettings(prev => ({ ...prev, theme }))
  }

  return (
    <div>
      <p>Current theme: {settings.theme}</p>
      <button onClick={() => updateTheme('dark')}>Dark Mode</button>
      <button onClick={() => updateTheme('light')}>Light Mode</button>
    </div>
  )
}
```

### Search Functionality

```tsx
function SearchableList() {
  const { storedValue: items, setValue: setItems, searchValue } = useLocalStorage<string[]>(
    'search-items',
    ['apple', 'banana', 'orange', 'grape']
  )

  const [searchTerm, setSearchTerm] = useState('')
  const filteredItems = searchValue(searchTerm) || []

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search items..."
      />
      <ul>
        {filteredItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Cross-Storage Access

```tsx
import { STORAGE_ENV } from 'garuda-hooks'

function DataManager() {
  const { getStoredValue, setValue } = useLocalStorage('data', null)

  const handleCrossStorage = () => {
    // Get value from sessionStorage instead
    const sessionData = getStoredValue(STORAGE_ENV.SESSION_STORAGE)
    console.log('Session data:', sessionData)
  }

  return (
    <div>
      <button onClick={handleCrossStorage}>
        Check Session Storage
      </button>
    </div>
  )
}
```

## Next.js Specific Usage

### SSR-Safe Pattern

```tsx
// pages/profile.tsx
import { useLocalStorage } from 'garuda-hooks'
import { useEffect, useState } from 'react'

export default function Profile() {
  const { storedValue: user, isSSR } = useLocalStorage('user', null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted || isSSR) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {user ? (
        <p>Welcome back, {user.name}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  )
}
```

### App Router (app/) Pattern

```tsx
'use client'

import { useLocalStorage } from 'garuda-hooks'

export default function ClientComponent() {
  const {
    storedValue: preferences,
    setValue: setPreferences,
  } = useLocalStorage('preferences', {
    colorScheme: 'auto',
    fontSize: 'medium',
  })

  return (
    <div>
      <p>Color scheme: {preferences.colorScheme}</p>
      <button onClick={() => setPreferences(prev => ({ 
        ...prev, 
        colorScheme: 'dark' 
      }))}>
        Dark Mode
      </button>
    </div>
  )
}
```

## Best Practices

### 1. Type Safety
Always provide explicit types for complex objects:

```tsx
interface UserPreferences {
  theme: 'light' | 'dark'
  sidebar: boolean
}

const { storedValue: prefs } = useLocalStorage<UserPreferences>('prefs', {
  theme: 'light',
  sidebar: true,
})
```

### 2. Error Handling
The hook handles JSON parsing errors gracefully, but you can add additional validation:

```tsx
function SafeDataStorage() {
  const { storedValue: data, setValue: setData } = useLocalStorage('important-data', [])

  const addData = (newItem: unknown) => {
    if (!newItem || typeof newItem !== 'object') {
      console.warn('Invalid data format')
      return
    }
    setData(prev => [...prev, newItem])
  }

  return <div>{/* Your component */}</div>
}
```

### 3. Performance Optimization
For frequently updated data, consider debouncing:

```tsx
import { useMemo, useCallback } from 'react'
import { debounce } from 'lodash' // or your preferred debounce utility

function HighFrequencyData() {
  const { storedValue: data, setValue: setData } = useLocalStorage('high-freq-data', '')

  const debouncedSetData = useMemo(
    () => debounce(setData, 500),
    [setData]
  )

  return (
    <input
      onChange={(e) => debouncedSetData(e.target.value)}
      placeholder="Type something..."
    />
  )
}
```

## Common Patterns

### Shopping Cart

```tsx
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

function ShoppingCart() {
  const { storedValue: cart, setValue: setCart } = useLocalStorage<CartItem[]>(
    'shopping-cart',
    [],
  )

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div>
      <p>Total: ${total.toFixed(2)}</p>
      {/* Cart UI */}
    </div>
  )
}
```

### Form State Persistence

```tsx
function PersistentForm() {
  const { storedValue: formData, setValue: setFormData } = useLocalStorage('form-draft', {
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await submitForm(formData)
      // Clear draft on successful submission
      setFormData({ name: '', email: '', message: '' })
    } catch (error) {
      console.error('Submission failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Name"
      />
      {/* Other form fields */}
    </form>
  )
}
```

## Troubleshooting

### Hydration Mismatches
If you encounter hydration errors in Next.js:

1. Use the `isSSR` flag to conditionally render content
2. Implement a `mounted` state to ensure client-side rendering
3. Consider using `useEffect` to set initial values after hydration

### Storage Quota Exceeded
Handle localStorage quota limits:

```tsx
function QuotaAwareStorage() {
  const { storedValue: data, setValue: setData } = useLocalStorage('large-data', [])

  const addDataSafely = (newItem: any) => {
    try {
      setData(prev => [...prev, newItem])
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Handle quota exceeded
        alert('Storage quota exceeded. Please clear some data.')
      }
    }
  }

  return <div>{/* Your component */}</div>
}
```

## Performance Considerations

- The hook uses `JSON.stringify/parse` for serialization, which may impact performance with large objects
- Search functionality scans through array items, consider implementing pagination for large datasets
- The hook automatically handles cleanup and prevents memory leaks
- Consider using `useMemo` for expensive computations based on stored values