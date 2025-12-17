# useFavIcon

A powerful and flexible React hook for dynamically managing the page favicon with support for both URL strings and React elements (SVG icons), plus optional restoration on component unmount.

## Features

- 🎨 **Multiple Icon Formats**: Support for URL strings and React SVG elements
- 🔄 **Automatic Restoration**: Optional restore to original favicon when component unmounts
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- 🎯 **TypeScript**: Full type safety with comprehensive interface definitions
- ⚡ **Performance**: Optimized with proper dependency tracking and cleanup
- 🔧 **Dynamic Updates**: Programmatically change favicon during runtime
- 🎮 **Interactive Control**: Provides methods to set and restore favicon manually

## API Reference

```typescript
interface UseFavIconParams {
  icon: string | ReactElement
  options?: {
    restoreOnUnmount?: boolean
    size?: number
    backgroundColor?: string
  }
}

interface UseFavIconResult {
  currentHref: string | null
  setFavicon: (icon: string | ReactElement) => void
  restore: () => void
}

function useFavIcon({ icon, options }: UseFavIconParams): UseFavIconResult
```

### Parameters

- **icon**: The favicon to set. Can be:
  - **string**: A URL pointing to an image file (e.g., `.ico`, `.png`, `.svg`)
  - **ReactElement**: A React SVG element that will be converted to a data URI
- **options** (optional): Configuration object
  - **restoreOnUnmount**: When `true`, restores the original favicon when the component unmounts
  - **size**: Intended size for the favicon (currently for documentation; not actively used)
  - **backgroundColor**: Background color for the favicon (currently for documentation; not actively used)

### Return Value

- **currentHref**: The current favicon URL (or `null` if not set)
- **setFavicon**: Function to programmatically update the favicon
- **restore**: Function to manually restore the original favicon

## Usage Examples

### Complete Example Using All Return Values

```tsx
import { useState } from 'react'
import { useFavIcon } from 'garuda-hooks'

function FaviconManager() {
  const [customIcon, setCustomIcon] = useState(null)
  
  const { currentHref, setFavicon, restore } = useFavIcon({
    icon: '/favicon.ico',
    options: { restoreOnUnmount: true }
  })

  const createNotificationIcon = (count) => (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#007bff" />
      <text x="16" y="22" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
        {count}
      </text>
    </svg>
  )

  const handleSetNotification = () => {
    const icon = createNotificationIcon(5)
    setFavicon(icon)
    setCustomIcon('notification')
  }

  const handleSetLoading = () => {
    setFavicon('/loading.gif')
    setCustomIcon('loading')
  }

  const handleRestoreDefault = () => {
    restore()
    setCustomIcon(null)
  }

  const faviconType = currentHref?.startsWith('data:') ? 'SVG' : 'URL'
  const isDefault = currentHref === '/favicon.ico'

  return (
    <div>
      <h1>Favicon Manager</h1>
      
      <div className="status">
        <p><strong>Current Favicon:</strong> {currentHref || 'None'}</p>
        <p><strong>Type:</strong> {faviconType}</p>
        <p><strong>Status:</strong> {isDefault ? 'Default' : customIcon || 'Custom'}</p>
      </div>

      <div className="controls">
        <button onClick={handleSetNotification} disabled={customIcon === 'notification'}>
          Set Notification (SVG)
        </button>
        <button onClick={handleSetLoading} disabled={customIcon === 'loading'}>
          Set Loading (GIF)
        </button>
        <button onClick={handleRestoreDefault} disabled={isDefault}>
          Restore Default
        </button>
      </div>
    </div>
  )
}
```

### Basic Favicon with URL

```tsx
import { useFavIcon } from 'garuda-hooks'

function ProductPage({ product }) {
  const { currentHref, setFavicon, restore } = useFavIcon({
    icon: '/icons/product.ico',
    options: { restoreOnUnmount: false }
  })

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <div className="favicon-status">
        Current favicon: {currentHref || 'Not set'}
      </div>
    </div>
  )
}
```

### React SVG Icon

```tsx
import { useFavIcon } from 'garuda-hooks'

function NotificationPage({ unreadCount }) {
  const notificationIcon = (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="12" fill="#ff4444" />
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12">
        {unreadCount > 9 ? '9+' : unreadCount}
      </text>
    </svg>
  )

  const { currentHref, setFavicon, restore } = useFavIcon({
    icon: unreadCount > 0 ? notificationIcon : '/favicon.ico',
    options: { restoreOnUnmount: true }
  })

  const handleMarkAllAsRead = () => {
    // Reset to default favicon when all notifications are read
    setFavicon('/favicon.ico')
  }

  return (
    <div>
      <h1>Notifications ({unreadCount})</h1>
      <div>
        <p>Favicon type: {currentHref?.startsWith('data:') ? 'SVG Icon' : 'Static Icon'}</p>
        <button onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
          Mark All as Read
        </button>
        <button onClick={restore}>
          Restore Original Favicon
        </button>
      </div>
    </div>
  )
}
```

### Dynamic Favicon Updates

```tsx
import { useState } from 'react'
import { useFavIcon } from 'garuda-hooks'

function StatusDashboard() {
  const [status, setStatus] = useState('idle')
  
  const statusIcons = {
    idle: '/icons/idle.ico',
    loading: '/icons/loading.ico',
    success: '/icons/success.ico',
    error: '/icons/error.ico'
  }

  const { setFavicon, restore, currentHref } = useFavIcon({
    icon: statusIcons[status],
    options: { restoreOnUnmount: true }
  })

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    setFavicon(statusIcons[newStatus])
  }

  const isUsingDefaultFavicon = currentHref === '/favicon.ico'

  return (
    <div>
      <h1>Status: {status}</h1>
      <p>Current favicon: {currentHref}</p>
      <p>Using default favicon: {isUsingDefaultFavicon ? 'Yes' : 'No'}</p>
      <div>
        <button onClick={() => handleStatusChange('loading')}>
          Start Loading
        </button>
        <button onClick={() => handleStatusChange('success')}>
          Mark Success
        </button>
        <button onClick={() => handleStatusChange('error')}>
          Mark Error
        </button>
        <button onClick={restore} disabled={isUsingDefaultFavicon}>
          Restore Original
        </button>
      </div>
    </div>
  )
}
```

### Conditional Favicon Updates

```tsx
import { useFavIcon } from 'garuda-hooks'

function ChatApplication({ hasNewMessages, messageCount }) {
  const messageIcon = (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="6" fill="#007bff" />
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="14">
        💬
      </text>
      {hasNewMessages && (
        <circle cx="24" cy="8" r="6" fill="#ff0000" />
      )}
    </svg>
  )

  useFavIcon({
    icon: hasNewMessages ? messageIcon : '/favicon.ico',
    options: { restoreOnUnmount: true }
  })

  return (
    <div>
      <h1>Chat Application</h1>
      {hasNewMessages && <p>You have {messageCount} new messages!</p>}
    </div>
  )
}
```

### Theme-Based Favicons

```tsx
import { useFavIcon } from 'garuda-hooks'

function App() {
  const [theme, setTheme] = useState('light')
  
  const themeIcon = (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <rect 
        width="32" 
        height="32" 
        fill={theme === 'dark' ? '#333333' : '#ffffff'} 
      />
      <circle 
        cx="16" 
        cy="16" 
        r="8" 
        fill={theme === 'dark' ? '#ffffff' : '#333333'} 
      />
    </svg>
  )

  useFavIcon({
    icon: themeIcon,
    options: { restoreOnUnmount: true }
  })

  return (
    <div className={`app ${theme}`}>
      <h1>Themed Application</h1>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  )
}
```

### Progress Indicator Favicon

```tsx
import { useFavIcon } from 'garuda-hooks'

function FileUpload({ uploadProgress }) {
  const progressIcon = (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="#e0e0e0"
        strokeWidth="3"
      />
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="#4caf50"
        strokeWidth="3"
        strokeDasharray="87.96"
        strokeDashoffset={87.96 * (1 - uploadProgress / 100)}
        transform="rotate(-90 16 16)"
      />
      <text x="16" y="20" textAnchor="middle" fontSize="10" fill="#333">
        {Math.round(uploadProgress)}%
      </text>
    </svg>
  )

  useFavIcon({
    icon: uploadProgress > 0 && uploadProgress < 100 ? progressIcon : '/favicon.ico',
    options: { restoreOnUnmount: true }
  })

  return (
    <div>
      <h1>File Upload</h1>
      <progress value={uploadProgress} max="100" />
    </div>
  )
}
```

### Game State Favicon

```tsx
import { useFavIcon } from 'garuda-hooks'

function GameComponent({ gameState, playerHealth, level }) {
  const gameIcon = (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" fill="#000" />
      
      {gameState === 'playing' && (
        <>
          <rect x="2" y="26" width={28 * (playerHealth / 100)} height="4" fill="#ff0000" />
          <text x="16" y="18" textAnchor="middle" fill="#fff" fontSize="12">
            L{level}
          </text>
        </>
      )}
      
      {gameState === 'paused' && (
        <text x="16" y="18" textAnchor="middle" fill="#ff0" fontSize="16">
          ⏸
        </text>
      )}
      
      {gameState === 'game-over' && (
        <text x="16" y="18" textAnchor="middle" fill="#f00" fontSize="12">
          💀
        </text>
      )}
    </svg>
  )

  useFavIcon({
    icon: gameIcon,
    options: { restoreOnUnmount: true }
  })

  return (
    <div>
      <h1>Game Level {level}</h1>
      <div>Health: {playerHealth}%</div>
      <div>State: {gameState}</div>
    </div>
  )
}
```

## Advanced Usage

### Multiple Components with Different Restoration Settings

```tsx
// Main app favicon
function App() {
  useFavIcon({
    icon: '/logo.ico',
    options: { restoreOnUnmount: false } // Persistent
  })
  
  return <Router />
}

// Temporary notification favicon
function NotificationOverlay({ show, type }) {
  const alertIcon = (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill={type === 'error' ? '#ff4444' : '#44ff44'} />
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="16">
        {type === 'error' ? '⚠' : '✓'}
      </text>
    </svg>
  )

  useFavIcon({
    icon: show ? alertIcon : '/logo.ico',
    options: { restoreOnUnmount: true } // Temporary
  })

  return show ? <div>Notification overlay</div> : null
}
```

### Data URI Favicons

```tsx
import { useFavIcon } from 'garuda-hooks'

function CustomFavicon() {
  // Using a data URI directly
  const dataUriFavicon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  useFavIcon({
    icon: dataUriFavicon,
    options: { restoreOnUnmount: false }
  })

  return <div>Custom favicon with data URI</div>
}
```

### Integration with Service Workers

```tsx
import { useFavIcon } from 'garuda-hooks'
import { useEffect } from 'react'

function PWAApp() {
  const { setFavicon } = useFavIcon({
    icon: '/favicon.ico',
    options: { restoreOnUnmount: false }
  })

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'UPDATE_AVAILABLE') {
          const updateIcon = (
            <svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="16" fill="#ff9800" />
              <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12">
                ↻
              </text>
            </svg>
          )
          setFavicon(updateIcon)
        }
      })
    }
  }, [setFavicon])

  return <div>PWA Application</div>
}
```

## React and Next.js Specific Scenarios

### Next.js App Router

```tsx
// app/layout.tsx
import { useFavIcon } from 'garuda-hooks'

export default function RootLayout({ children }) {
  useFavIcon({
    icon: '/favicon.ico',
    options: { restoreOnUnmount: false }
  })

  return (
    <html>
      <head />
      <body>{children}</body>
    </html>
  )
}

// app/dashboard/page.tsx
export default function DashboardPage() {
  useFavIcon({
    icon: '/dashboard-favicon.ico',
    options: { restoreOnUnmount: true }
  })

  return <div>Dashboard</div>
}
```

### Next.js Pages Router

```tsx
// pages/_app.tsx
import { useFavIcon } from 'garuda-hooks'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  
  const routeIcons = {
    '/': '/favicon.ico',
    '/dashboard': '/dashboard.ico',
    '/profile': '/profile.ico',
  }

  useFavIcon({
    icon: routeIcons[router.pathname] || '/favicon.ico',
    options: { restoreOnUnmount: false }
  })

  return <Component {...pageProps} />
}
```

### Client-Side Navigation

```tsx
import { useFavIcon } from 'garuda-hooks'
import { useEffect } from 'react'

function SPARouter({ currentRoute }) {
  const { setFavicon } = useFavIcon({
    icon: '/favicon.ico',
    options: { restoreOnUnmount: false }
  })

  useEffect(() => {
    const routeIcons = {
      home: '/home.ico',
      about: '/about.ico',
      contact: '/contact.ico',
    }

    setFavicon(routeIcons[currentRoute] || '/favicon.ico')
  }, [currentRoute, setFavicon])

  return <div>SPA Content for {currentRoute}</div>
}
```

## Behavior Notes

### Icon Processing

- **String icons**: Used directly as the `href` attribute
- **React elements**: Converted to SVG data URIs using `renderToStaticMarkup`
- **Invalid icons**: Empty strings, null, undefined, or invalid React elements are ignored
- **SVG optimization**: React SVG elements are automatically encoded for data URI format

### Favicon Link Management

- **Automatic creation**: If no `<link rel="icon">` exists, one is created and added to `<head>`
- **Link reuse**: Existing favicon links are reused to prevent duplicate elements
- **Type setting**: Created links default to `type="image/png"`
- **Persistence**: Link references are cached for performance

### Restoration Logic

- **Original capture**: The original favicon URL is captured on first execution
- **Restoration timing**: Only restores when `restoreOnUnmount: true` and component unmounts
- **Multiple instances**: Last unmounted hook with restoration enabled determines final favicon
- **Manual restoration**: Use the `restore()` function for programmatic restoration

### SSR Compatibility

- **Safe execution**: All DOM operations are safely skipped during server-side rendering
- **No hydration issues**: Prevents server/client mismatches
- **Framework support**: Works seamlessly with Next.js, Gatsby, Remix, etc.

### Performance Characteristics

- **Efficient updates**: Only updates DOM when necessary
- **Memory management**: Proper cleanup prevents memory leaks
- **Async execution**: Uses `queueMicrotask` to avoid blocking renders
- **Caching**: Link elements and converted SVGs are cached appropriately

## Browser Support

- ✅ **Modern Browsers**: Full support in all modern browsers (Chrome 60+, Firefox 55+, Safari 12+)
- ✅ **SSR Frameworks**: Next.js, Gatsby, Remix, Nuxt.js, etc.
- ✅ **React Native**: Not applicable (favicon is web-only)
- ✅ **Electron**: Full support for desktop applications

## Common Patterns

### 1. Application State Indicators
Use favicon to show application state (loading, error, success) without requiring user attention to the tab.

### 2. Notification Badges
Display unread counts, alerts, or status updates directly in the browser tab.

### 3. Theme Synchronization
Keep favicon in sync with application theme (light/dark mode).

### 4. Progress Indication
Show progress of long-running operations (uploads, downloads, processing).

### 5. Game State Visualization
Display game status, player health, level, or other game state information.

### 6. Brand Consistency
Maintain brand identity across different sections of your application.

## TypeScript Support

The hook is fully typed with comprehensive TypeScript support:

```typescript
// Type-safe usage with string icon
const { currentHref, setFavicon, restore } = useFavIcon({
  icon: '/favicon.ico', // string
  options: { restoreOnUnmount: true }
})

// Type-safe usage with React element
const iconElement = <svg>...</svg>
const result = useFavIcon({
  icon: iconElement, // ReactElement
  options: { restoreOnUnmount: false }
})

// Return value typing
const currentHref: string | null = result.currentHref
const setFavicon: (icon: string | ReactElement) => void = result.setFavicon
const restore: () => void = result.restore
```

## Troubleshooting

### Favicon Not Updating

**Issue**: Favicon doesn't change when expected.

**Solutions**:
- Ensure the icon value is valid (non-empty string or valid React element)
- Check browser cache - hard refresh (Ctrl+F5 or Cmd+Shift+R) may be needed
- Verify you're not in an SSR environment where DOM is unavailable
- Check console for any errors during SVG conversion

### SVG Conversion Issues

**Issue**: React SVG elements not converting properly.

**Solutions**:
- Ensure the React element is a valid SVG with proper structure
- Check that all SVG attributes use React naming conventions (e.g., `strokeWidth` not `stroke-width`)
- Verify the SVG doesn't contain unsupported elements or attributes
- Test SVG conversion manually using `renderToStaticMarkup`

### Favicon Not Restoring

**Issue**: Original favicon isn't restored on unmount.

**Solutions**:
- Confirm `restoreOnUnmount: true` is set in options
- Check that the component is actually unmounting (not just conditionally hiding)
- Verify no other hooks or scripts are overriding the favicon after restoration
- Ensure the original favicon link existed when the hook first ran

### Multiple Hook Conflicts

**Issue**: Multiple `useFavIcon` hooks causing unexpected behavior.

**Solutions**:
- Be intentional about which components use `restoreOnUnmount: true`
- Use a single hook at the app level for global favicon management
- Use conditional logic to disable hooks when not needed
- Consider implementing a favicon context for coordinated management

### Browser Caching Issues

**Issue**: Browser aggressively caches favicons.

**Solutions**:
- Add cache-busting query parameters: `/favicon.ico?v=${Date.now()}`
- Use data URIs which bypass cache issues
- Test in incognito/private browsing mode
- Clear browser cache and hard refresh

### SSR Hydration Issues

**Issue**: Server/client favicon mismatch warnings.

**Solutions**:
- Ensure initial favicon values are consistent between server and client
- Use `useEffect` for dynamic favicons that depend on client-only state
- The hook is already SSR-safe, but your favicon logic might not be
- Avoid using browser-only APIs in favicon generation logic

## Dependencies

This hook depends on:
- `react` (useState, useEffect, useCallback, useRef, ReactElement, isValidElement)
- `react-dom/server` (renderToStaticMarkup)
- `../../helpers/is-ssr` (SSR detection utility)

## Related Hooks

- **useDocumentTitle**: Dynamically manage the document title
- **useDocumentVisibility**: Detect when the document becomes visible/hidden  
- **useMetaTags**: Manage other document meta tags (if available)
- **useColorScheme**: Detect and respond to system color scheme changes

## Migration Guide

### From Manual Favicon Management

```tsx
// Before: Manual favicon management
useEffect(() => {
  const link = document.querySelector('link[rel~="icon"]') 
    || document.createElement('link')
  
  if (!link.parentNode) {
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  
  const originalHref = link.href
  link.href = '/new-favicon.ico'
  
  return () => {
    link.href = originalHref
  }
}, [])

// After: Using useFavIcon
useFavIcon({
  icon: '/new-favicon.ico',
  options: { restoreOnUnmount: true }
})
```

### From Basic Favicon Updates

```tsx
// Before: Simple favicon updates
useEffect(() => {
  document.querySelector('link[rel~="icon"]').href = newIconUrl
}, [newIconUrl])

// After: Using useFavIcon with restoration
const { setFavicon } = useFavIcon({
  icon: '/favicon.ico',
  options: { restoreOnUnmount: true }
})

useEffect(() => {
  if (newIconUrl) {
    setFavicon(newIconUrl)
  }
}, [newIconUrl, setFavicon])
```

### From Other Favicon Libraries

```tsx
// If migrating from other favicon management libraries:
// Before: library.setFavicon(url)
// After:
const { setFavicon } = useFavIcon({
  icon: '/favicon.ico',
  options: { restoreOnUnmount: false }
})

// Use setFavicon(url) when needed
```