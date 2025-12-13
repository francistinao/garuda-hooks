# useSessionStorage

A feature-rich hook for managing sessionStorage with TypeScript support, TTL (Time To Live) functionality, and SSR safety.

## Features

- ⏰ **TTL Support**: Set expiration times for stored data
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- 🎯 **TypeScript**: Full type safety with generic support
- 🧹 **Auto Cleanup**: Automatic cleanup of expired data
- ⚡ **Performance**: Optimized with proper caching and error handling

## API Reference

```typescript
interface UseSessionStorageReturn<T> {
  storedValue: T
  setValue: (value: T | ((prev: T) => T)) => void
  removeValue: () => void
  setValueWithTTL: (value: T, ttl: number) => void
  getStoredValue: () => NonNullable<T> | T | undefined
}

function useSessionStorage<T>(
  key: string, 
  initialValue: T, 
  defaultTTL?: number
): UseSessionStorageReturn<T>
```

## Usage Examples

### Basic Usage

```tsx
import { useSessionStorage } from 'garuda-hooks'

function TemporaryData() {
  const { storedValue: tempData, setValue, removeValue } = useSessionStorage(
    'temp-data', 
    { count: 0, message: '' }
  )

  return (
    <div>
      <p>Count: {tempData.count}</p>
      <button onClick={() => setValue(prev => ({ ...prev, count: prev.count + 1 }))}>
        Increment
      </button>
      <button onClick={removeValue}>Clear</button>
    </div>
  )
}
```

### TTL (Time To Live) Usage

```tsx
function ExpiringData() {
  const { storedValue: token, setValueWithTTL, getStoredValue } = useSessionStorage(
    'auth-token',
    null
  )

  const setToken = (newToken: string) => {
    // Set token to expire in 1 hour (3600000 ms)
    setValueWithTTL(newToken, 3600000)
  }

  const checkToken = () => {
    const currentToken = getStoredValue()
    console.log('Current valid token:', currentToken)
  }

  return (
    <div>
      <button onClick={() => setToken('abc123xyz')}>
        Set Token (1 hour expiry)
      </button>
      <button onClick={checkToken}>Check Token</button>
      <p>Token: {token || 'No token set'}</p>
    </div>
  )
}
```

### Shopping Cart Session

```tsx
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

function SessionShoppingCart() {
  const { storedValue: cart, setValue: setCart } = useSessionStorage<CartItem[]>(
    'session-cart',
    []
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

  const clearCart = () => {
    setCart([])
  }

  return (
    <div>
      <p>Items in cart: {cart.length}</p>
      <button onClick={clearCart}>Clear Session Cart</button>
    </div>
  )
}
```

### Form Draft with Auto-Expire

```tsx
interface FormDraft {
  title: string
  content: string
  lastModified: number
}

function DraftEditor() {
  const { storedValue: draft, setValueWithTTL } = useSessionStorage<FormDraft>(
    'form-draft',
    {
      title: '',
      content: '',
      lastModified: Date.now()
    }
  )

  const saveDraft = (title: string, content: string) => {
    const draftData = {
      title,
      content,
      lastModified: Date.now()
    }
    
    // Auto-expire draft after 2 hours of inactivity
    setValueWithTTL(draftData, 2 * 60 * 60 * 1000)
  }

  return (
    <div>
      <p>Last saved: {new Date(draft.lastModified).toLocaleTimeString()}</p>
      <input
        value={draft.title}
        onChange={(e) => saveDraft(e.target.value, draft.content)}
        placeholder="Title"
      />
      <textarea
        value={draft.content}
        onChange={(e) => saveDraft(draft.title, e.target.value)}
        placeholder="Content"
      />
    </div>
  )
}
```

## Next.js Specific Usage

### SSR-Safe Authentication State

```tsx
'use client'

import { useSessionStorage } from 'garuda-hooks'
import { useEffect, useState } from 'react'

interface UserSession {
  id: string
  username: string
  expiresAt: number
}

export default function AuthenticatedLayout() {
  const { storedValue: userSession, setValueWithTTL, removeValue } = useSessionStorage<UserSession | null>(
    'user-session',
    null
  )
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const session = await authenticateUser(credentials)
      // Set session to expire in 8 hours
      setValueWithTTL(session, 8 * 60 * 60 * 1000)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  if (!mounted) {
    return <div>Loading...</div>
  }

  if (!userSession) {
    return <LoginForm onLogin={login} />
  }

  return (
    <div>
      <header>
        <span>Welcome, {userSession.username}</span>
        <button onClick={removeValue}>Logout</button>
      </header>
      <main>
        {/* Your app content */}
      </main>
    </div>
  )
}
```

### Page State Management

```tsx
interface PageState {
  currentPage: number
  filters: Record<string, any>
  sortBy: string
}

function DataTable() {
  const { storedValue: pageState, setValue: setPageState } = useSessionStorage<PageState>(
    'table-state',
    {
      currentPage: 1,
      filters: {},
      sortBy: 'date'
    }
  )

  const updateFilter = (key: string, value: any) => {
    setPageState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      currentPage: 1 // Reset to first page when filtering
    }))
  }

  return (
    <div>
      <p>Page: {pageState.currentPage}</p>
      <p>Sort: {pageState.sortBy}</p>
      {/* Table implementation */}
    </div>
  )
}
```

## Advanced Patterns

### Cache with TTL

```tsx
function ApiCacheManager() {
  const { getStoredValue, setValueWithTTL } = useSessionStorage('api-cache', {})

  const fetchWithCache = async <T>(url: string, cacheMinutes: number = 5): Promise<T> => {
    const cached = getStoredValue()
    const cacheKey = btoa(url) // Base64 encode URL as key
    
    if (cached && cached[cacheKey]) {
      console.log('Using cached data for:', url)
      return cached[cacheKey]
    }

    const response = await fetch(url)
    const data = await response.json()
    
    // Cache the response with TTL
    setValueWithTTL({
      ...cached,
      [cacheKey]: data
    }, cacheMinutes * 60 * 1000)

    return data
  }

  return { fetchWithCache }
}
```

### Multi-Tab Synchronization

```tsx
function MultiTabSync() {
  const { storedValue: sharedData, setValue } = useSessionStorage('shared-data', {
    lastAction: '',
    timestamp: Date.now()
  })

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shared-data' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed.value) {
            setValue(parsed.value)
          }
        } catch (error) {
          console.error('Failed to sync data:', error)
        }
      }
    }

    // Note: sessionStorage doesn't fire storage events between tabs
    // This pattern works better with localStorage for cross-tab sync
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [setValue])

  return (
    <div>
      <p>Last action: {sharedData.lastAction}</p>
      <button onClick={() => setValue({
        lastAction: 'Button clicked',
        timestamp: Date.now()
      })}>
        Update Action
      </button>
    </div>
  )
}
```

## Best Practices

### 1. Appropriate TTL Values
Choose TTL values based on data sensitivity and usage patterns:

```tsx
// Authentication tokens: 1-8 hours
setValueWithTTL(authToken, 4 * 60 * 60 * 1000)

// Form drafts: 1-2 hours  
setValueWithTTL(formDraft, 2 * 60 * 60 * 1000)

// Search results: 5-15 minutes
setValueWithTTL(searchResults, 10 * 60 * 1000)

// User preferences: No TTL (use regular setValue)
setValue(preferences)
```

### 2. Error Handling
Handle potential storage errors gracefully:

```tsx
function SafeSessionStorage() {
  const { setValueWithTTL } = useSessionStorage('safe-data', null)

  const saveDataSafely = (data: any, ttl: number) => {
    try {
      setValueWithTTL(data, ttl)
    } catch (error) {
      if (error.message.includes('quota')) {
        // Handle storage quota exceeded
        alert('Session storage is full. Please refresh the page.')
      } else {
        console.error('Failed to save data:', error)
      }
    }
  }

  return <div>{/* Your component */}</div>
}
```

### 3. Memory Management
The hook automatically cleans up timers, but be mindful of large objects:

```tsx
function MemoryEfficientComponent() {
  const { storedValue, setValue } = useSessionStorage('large-data', [])

  // Clean up large data sets when component unmounts
  useEffect(() => {
    return () => {
      // Component-specific cleanup if needed
      setValue([]) // Clear large arrays
    }
  }, [setValue])

  return <div>{/* Your component */}</div>
}
```

## Common Use Cases

### Wizard/Multi-Step Forms

```tsx
interface WizardState {
  currentStep: number
  stepData: Record<number, any>
  completed: boolean
}

function MultiStepWizard() {
  const { storedValue: wizardState, setValue } = useSessionStorage<WizardState>(
    'wizard-progress',
    {
      currentStep: 1,
      stepData: {},
      completed: false
    }
  )

  const updateStepData = (step: number, data: any) => {
    setValue(prev => ({
      ...prev,
      stepData: { ...prev.stepData, [step]: data }
    }))
  }

  const goToNextStep = () => {
    setValue(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))
  }

  return (
    <div>
      <p>Step {wizardState.currentStep} of 5</p>
      {/* Step content */}
    </div>
  )
}
```

### Shopping Session with TTL

```tsx
function ShoppingSes​session() {
  const { storedValue: cart, setValueWithTTL } = useSessionStorage('shopping-session', {
    items: [],
    sessionStart: Date.now()
  })

  const addItem = (item: any) => {
    const updatedCart = {
      items: [...cart.items, item],
      sessionStart: cart.sessionStart
    }
    
    // Extend session by 30 minutes on activity
    setValueWithTTL(updatedCart, 30 * 60 * 1000)
  }

  return <div>{/* Shopping cart UI */}</div>
}
```

## Troubleshooting

### TTL Not Working
Ensure TTL values are in milliseconds:
```tsx
// ✅ Correct - 1 hour in milliseconds
setValueWithTTL(data, 60 * 60 * 1000)

// ❌ Incorrect - 1 hour in seconds
setValueWithTTL(data, 3600)
```

### Data Persisting After TTL
The automatic cleanup runs on a timer. For immediate cleanup:
```tsx
const { getStoredValue } = useSessionStorage('my-data', null)

// Force check expiration
const currentData = getStoredValue() // Returns undefined if expired
```

### Memory Leaks
The hook automatically cleans up timers on unmount, but avoid storing circular references:
```tsx
// ❌ Avoid circular references
const problematicData = { self: null }
problematicData.self = problematicData

// ✅ Use plain objects
const safeData = { id: 1, name: 'example' }
```