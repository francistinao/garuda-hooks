# useDocumentTitle

A simple and efficient hook for dynamically managing the document title with optional restoration on component unmount.

## Features

- 🔧 **Dynamic Title Management**: Update document title dynamically based on component state
- 🔄 **Restoration Support**: Optional restore to original title when component unmounts
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- 🎯 **TypeScript**: Full type safety with interface definitions
- ⚡ **Performance**: Optimized with proper dependency tracking and cleanup
- 🚫 **No Side Effects**: Only updates title when necessary

## API Reference

```typescript
interface Options {
  restoreOnUnmount: boolean
}

interface UseDocumentTitleParams {
  title?: string
  options: Options
}

function useDocumentTitle({ title, options }: UseDocumentTitleParams): void
```

### Parameters

- **title** (optional): The title to set for the document. If `undefined`, `null`, or empty string, no changes will be made.
- **options**: Configuration object
  - **restoreOnUnmount**: When `true`, restores the original document title when the component unmounts or when the hook is no longer active.

## Usage Examples

### Basic Title Update

```tsx
import { useDocumentTitle } from 'garuda-hooks'

function ProductPage({ product }) {
  useDocumentTitle({
    title: `${product.name} - My Store`,
    options: { restoreOnUnmount: false }
  })

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  )
}
```

### With Restoration on Unmount

```tsx
import { useDocumentTitle } from 'garuda-hooks'

function Modal({ isOpen, title }) {
  useDocumentTitle({
    title: isOpen ? `${title} - Modal Open` : undefined,
    options: { restoreOnUnmount: true }
  })

  return isOpen ? (
    <div className="modal">
      <h2>{title}</h2>
      <p>Modal content here...</p>
    </div>
  ) : null
}
```

### Dynamic Title with State

```tsx
import { useState } from 'react'
import { useDocumentTitle } from 'garuda-hooks'

function TaskManager() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')

  const completedTasks = tasks.filter(task => task.completed).length
  const totalTasks = tasks.length

  useDocumentTitle({
    title: `Tasks (${completedTasks}/${totalTasks}) - ${filter.toUpperCase()}`,
    options: { restoreOnUnmount: true }
  })

  return (
    <div>
      <h1>Task Manager</h1>
      {/* Task management UI */}
    </div>
  )
}
```

### Conditional Title Updates

```tsx
import { useDocumentTitle } from 'garuda-hooks'

function NotificationPage({ unreadCount, showNotifications }) {
  useDocumentTitle({
    title: showNotifications && unreadCount > 0 
      ? `(${unreadCount}) New Messages - App` 
      : undefined,
    options: { restoreOnUnmount: true }
  })

  return (
    <div>
      <h1>Notifications</h1>
      {unreadCount > 0 && <p>You have {unreadCount} unread messages</p>}
    </div>
  )
}
```

### Route-Based Title Management

```tsx
import { useDocumentTitle } from 'garuda-hooks'

function Dashboard({ user, currentSection }) {
  const sectionTitles = {
    overview: 'Dashboard Overview',
    analytics: 'Analytics Dashboard',
    settings: 'User Settings',
    profile: 'User Profile'
  }

  useDocumentTitle({
    title: `${sectionTitles[currentSection]} - ${user.name}`,
    options: { restoreOnUnmount: false }
  })

  return (
    <div>
      <h1>{sectionTitles[currentSection]}</h1>
      {/* Dashboard content */}
    </div>
  )
}
```

### Error Page with Title

```tsx
import { useDocumentTitle } from 'garuda-hooks'

function ErrorPage({ error, errorCode = 500 }) {
  useDocumentTitle({
    title: `Error ${errorCode} - Something went wrong`,
    options: { restoreOnUnmount: true }
  })

  return (
    <div>
      <h1>Error {errorCode}</h1>
      <p>{error?.message || 'An unexpected error occurred'}</p>
    </div>
  )
}
```

## Advanced Usage

### Multiple Components with Different Restoration Settings

```tsx
// Header component - doesn't restore
function AppHeader({ pageName }) {
  useDocumentTitle({
    title: `${pageName} | MyApp`,
    options: { restoreOnUnmount: false }
  })
  
  return <header>{pageName}</header>
}

// Modal component - restores on close
function AlertModal({ isOpen, alertType }) {
  useDocumentTitle({
    title: isOpen ? `⚠️ ${alertType} Alert - Action Required` : undefined,
    options: { restoreOnUnmount: true }
  })

  return isOpen ? <div>Alert content</div> : null
}
```

### With Loading States

```tsx
import { useDocumentTitle } from 'garuda-hooks'

function DataPage({ data, loading, error }) {
  useDocumentTitle({
    title: loading 
      ? 'Loading...' 
      : error 
      ? 'Error loading data' 
      : data 
      ? `${data.title} - Data View` 
      : undefined,
    options: { restoreOnUnmount: true }
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return <div>No data</div>

  return <div>{data.content}</div>
}
```

## Behavior Notes

### Title Updates

- Only updates `document.title` when the provided title is truthy and different from the current title
- Empty strings (`""`) and whitespace-only strings are considered truthy but may be normalized by the browser
- `null` and `undefined` values will not trigger title updates

### Restoration Logic

- The original title is captured when the hook first runs (not when the component mounts)
- If `restoreOnUnmount: true`, the hook restores the originally captured title on cleanup
- Multiple hook instances can coexist; the last unmounted hook with restore enabled will set the final title

### SSR Compatibility

- All DOM operations are safely skipped during server-side rendering
- No hydration mismatches or server-side errors
- Works seamlessly with Next.js, Gatsby, and other SSR frameworks

## Dependencies

This hook depends on:
- `react` (useEffect, useRef)
- `../../helpers/is-ssr` (SSR detection utility)

## Browser Support

- ✅ **Modern Browsers**: Full support in all modern browsers
- ✅ **SSR Frameworks**: Next.js, Gatsby, Remix, etc.
- ✅ **React Native**: N/A (document.title is web-only)

## Performance Considerations

- **Minimal Re-renders**: Only updates when title or restoreOnUnmount changes
- **Efficient Cleanup**: Proper cleanup prevents memory leaks
- **Smart Updates**: Avoids redundant DOM updates when title hasn't changed

## Common Patterns

### 1. Page-Level Title Management
Use in page components to set page-specific titles that persist until navigation.

### 2. Modal/Overlay Titles
Use with `restoreOnUnmount: true` for temporary UI elements that should restore the original title when dismissed.

### 3. Status Indication
Update titles to show notifications, counts, or status changes (e.g., "(3) New Messages").

### 4. Progressive Enhancement
Start with a basic title and enhance it as data loads or user interaction occurs.

## TypeScript Support

The hook is fully typed with TypeScript:

```typescript
// Type-safe usage
useDocumentTitle({
  title: someString, // string | undefined
  options: { 
    restoreOnUnmount: true // boolean
  }
})

// The options parameter is required
useDocumentTitle({
  title: 'My Title',
  options: { restoreOnUnmount: false } // ✅ Required
})

// This would cause a TypeScript error:
useDocumentTitle({ title: 'My Title' }) // ❌ Missing options
```

## Troubleshooting

### Title Not Updating

**Issue**: Document title doesn't change when expected.

**Solutions**:
- Ensure the title value is truthy and different from current title
- Check that you're not in an SSR environment where DOM is unavailable
- Verify the title string is not just whitespace (browsers may normalize this)

### Title Not Restoring

**Issue**: Original title isn't restored on unmount.

**Solutions**:
- Confirm `restoreOnUnmount: true` is set in options
- Check that the component is actually unmounting (not just hiding)
- Verify no other hooks are setting the title after restoration

### Multiple Hook Conflicts

**Issue**: Multiple `useDocumentTitle` hooks causing unexpected behavior.

**Solutions**:
- Be intentional about which components use `restoreOnUnmount: true`
- Consider using a single hook at the app level for global title management
- Use conditional titles (`undefined`) to disable hooks when not needed

### SSR Hydration Issues

**Issue**: Server/client title mismatch warnings.

**Solutions**:
- Ensure initial title values are consistent between server and client
- Use `useEffect` for dynamic titles that depend on client-only state
- The hook is already SSR-safe, but your title logic might not be

## Related Hooks

- **useDocumentVisibility**: Detect when the document becomes visible/hidden
- **useFavicon**: Dynamically update the page favicon
- **useMetaTags**: Manage other document meta tags

## Migration Guide

### From Manual Title Management

```tsx
// Before: Manual title management
useEffect(() => {
  const originalTitle = document.title
  document.title = `${pageName} - MyApp`
  
  return () => {
    document.title = originalTitle
  }
}, [pageName])

// After: Using useDocumentTitle
useDocumentTitle({
  title: `${pageName} - MyApp`,
  options: { restoreOnUnmount: true }
})
```

### From Other Title Hooks

```tsx
// If migrating from a different title hook:
// Before: useTitle(title)
// After:
useDocumentTitle({
  title,
  options: { restoreOnUnmount: false }
})
```