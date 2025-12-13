# useMediaQuery

A powerful hook for responsive design with CSS media query support, SSR safety, and custom matching logic.

## Features

- 📱 **Responsive Design**: React to viewport changes and device characteristics
- 🔒 **SSR Safe**: Configurable SSR behavior with custom matchers
- ⚡ **Performance**: Efficient event handling with automatic cleanup
- 🎯 **TypeScript**: Full type safety with proper return types
- 🔧 **Flexible**: Support for any CSS media query syntax

## API Reference

```typescript
type MediaQueryOptions = {
  defaultMatch?: boolean
  initializeWithValue?: boolean
  ssrMatchMedia?: (q: string) => { matches: boolean }
}

type UseMediaQueryReturn = { matches: boolean }

function useMediaQuery(
  query: string, 
  options?: MediaQueryOptions
): UseMediaQueryReturn
```

## Usage Examples

### Basic Responsive Design

```tsx
import { useMediaQuery } from 'garuda-hooks'

function ResponsiveLayout() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')

  return (
    <div className="p-6">
      <h1>Responsive Design Demo</h1>
      
      <div className="mb-4 p-3 bg-blue-100 rounded">
        <p><strong>Current Device Type:</strong></p>
        {isMobile && <span className="text-blue-600">📱 Mobile</span>}
        {isTablet && <span className="text-blue-600">📟 Tablet</span>}
        {isDesktop && <span className="text-blue-600">🖥️ Desktop</span>}
      </div>

      {isMobile ? (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">Mobile Content Block 1</div>
          <div className="bg-gray-100 p-4 rounded">Mobile Content Block 2</div>
        </div>
      ) : isTablet ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 p-4 rounded">Tablet Column 1</div>
          <div className="bg-gray-100 p-4 rounded">Tablet Column 2</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gray-100 p-6 rounded">Desktop Column 1</div>
          <div className="bg-gray-100 p-6 rounded">Desktop Column 2</div>
          <div className="bg-gray-100 p-6 rounded">Desktop Column 3</div>
        </div>
      )}
    </div>
  )
}
```

### Navigation Menu

```tsx
function ResponsiveNavigation() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = ['Home', 'About', 'Services', 'Portfolio', 'Contact']

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">MyBrand</h1>
        
        {isMobile ? (
          <>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Toggle menu"
            >
              <span className="block w-6 h-0.5 bg-white mb-1"></span>
              <span className="block w-6 h-0.5 bg-white mb-1"></span>
              <span className="block w-6 h-0.5 bg-white"></span>
            </button>
            
            {mobileMenuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-blue-600 border-t border-blue-500">
                {menuItems.map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="block px-4 py-3 hover:bg-blue-500 border-b border-blue-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex space-x-6">
            {menuItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="hover:text-blue-200 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
```

### Dark Mode and Reduced Motion

```tsx
function AccessibilityAwareComponent() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const isHighContrast = useMediaQuery('(prefers-contrast: high)')

  return (
    <div 
      className={`p-6 rounded-lg transition-all ${
        prefersDark 
          ? 'bg-gray-800 text-white' 
          : 'bg-white text-gray-800'
      } ${
        isHighContrast 
          ? 'border-2 border-black' 
          : 'border border-gray-300'
      }`}
      style={{
        transitionDuration: prefersReducedMotion ? '0ms' : '300ms'
      }}
    >
      <h2 className="text-2xl font-bold mb-4">
        Accessibility-Aware Component
      </h2>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className={prefersDark ? '🌙' : '☀️'} />
          <span>Color scheme: {prefersDark ? 'Dark' : 'Light'}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span>{prefersReducedMotion ? '🚫' : '✨'}</span>
          <span>Motion: {prefersReducedMotion ? 'Reduced' : 'Normal'}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span>{isHighContrast ? '🔆' : '🔅'}</span>
          <span>Contrast: {isHighContrast ? 'High' : 'Normal'}</span>
        </div>
      </div>

      <button 
        className={`mt-4 px-4 py-2 rounded transition-all ${
          prefersDark 
            ? 'bg-blue-600 hover:bg-blue-500' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white ${
          prefersReducedMotion ? '' : 'hover:scale-105'
        }`}
        style={{
          transitionDuration: prefersReducedMotion ? '0ms' : '200ms'
        }}
      >
        Adaptive Button
      </button>
    </div>
  )
}
```

### Image Gallery with Responsive Columns

```tsx
interface Image {
  id: string
  src: string
  alt: string
}

function ResponsiveGallery({ images }: { images: Image[] }) {
  const isLargeScreen = useMediaQuery('(min-width: 1200px)')
  const isMediumScreen = useMediaQuery('(min-width: 768px)')
  const isSmallScreen = useMediaQuery('(min-width: 480px)')

  const getColumns = () => {
    if (isLargeScreen) return 4
    if (isMediumScreen) return 3
    if (isSmallScreen) return 2
    return 1
  }

  const columns = getColumns()
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2', 
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Responsive Image Gallery</h2>
      
      <div className="mb-4 text-sm text-gray-600">
        <p>Showing {columns} column{columns !== 1 ? 's' : ''} on this screen size</p>
      </div>

      <div className={`grid ${gridCols[columns as keyof typeof gridCols]} gap-4`}>
        {images.map((image, index) => (
          <div 
            key={image.id}
            className="group relative overflow-hidden rounded-lg bg-gray-200 aspect-square"
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end">
              <p className="text-white p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                Image {index + 1}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Data Table with Responsive Behavior

```tsx
interface TableData {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  lastLogin: string
}

function ResponsiveDataTable({ data }: { data: TableData[] }) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const showFullTable = useMediaQuery('(min-width: 1024px)')

  if (isMobile) {
    // Card layout for mobile
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold">User Directory</h2>
        {data.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{user.name}</h3>
              <span className={`px-2 py-1 rounded text-xs ${
                user.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.status}
              </span>
            </div>
            <p className="text-gray-600 text-sm">{user.email}</p>
            <p className="text-gray-600 text-sm">{user.role}</p>
            <p className="text-gray-500 text-xs mt-2">
              Last login: {user.lastLogin}
            </p>
          </div>
        ))}
      </div>
    )
  }

  // Table layout for larger screens
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Directory</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              {showFullTable && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              {showFullTable && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    {!showFullTable && (
                      <div className="text-gray-500 text-sm">{user.role}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                  {user.email}
                </td>
                {showFullTable && (
                  <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                    {user.role}
                  </td>
                )}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                  {!showFullTable && (
                    <div className="text-gray-500 text-xs mt-1">{user.lastLogin}</div>
                  )}
                </td>
                {showFullTable && (
                  <td className="px-4 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {user.lastLogin}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

## Next.js Specific Usage

### SSR-Safe Media Queries

```tsx
'use client'

import { useMediaQuery } from 'garuda-hooks'
import { useEffect, useState } from 'react'

export default function SSRSafeResponsive() {
  const isMobile = useMediaQuery('(max-width: 768px)', {
    defaultMatch: false, // Assume desktop for SSR
    initializeWithValue: false // Don't use the match on first render
  })
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render server-safe content
    return (
      <div className="p-6">
        <h1>Loading responsive content...</h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-100 p-4 rounded">Column 1</div>
          <div className="bg-gray-100 p-4 rounded">Column 2</div>
          <div className="bg-gray-100 p-4 rounded">Column 3</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1>Responsive Content</h1>
      {isMobile ? (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">Mobile Stack 1</div>
          <div className="bg-gray-100 p-4 rounded">Mobile Stack 2</div>
          <div className="bg-gray-100 p-4 rounded">Mobile Stack 3</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-100 p-4 rounded">Desktop Column 1</div>
          <div className="bg-gray-100 p-4 rounded">Desktop Column 2</div>
          <div className="bg-gray-100 p-4 rounded">Desktop Column 3</div>
        </div>
      )}
    </div>
  )
}
```

### Custom SSR Matcher

```tsx
function CustomSSRMatcher() {
  // Custom SSR logic based on user agent or other server-side data
  const isMobile = useMediaQuery('(max-width: 768px)', {
    ssrMatchMedia: (query) => {
      // This would typically use request headers in a real SSR scenario
      if (query.includes('max-width: 768px')) {
        return { matches: false } // Assume desktop for SSR
      }
      return { matches: false }
    }
  })

  return (
    <div>
      {isMobile ? 'Mobile Layout' : 'Desktop Layout'}
    </div>
  )
}
```

### App Router with Media Query Context

```tsx
// contexts/MediaQueryContext.tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useMediaQuery } from 'garuda-hooks'

interface MediaQueryContextType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  prefersDark: boolean
}

const MediaQueryContext = createContext<MediaQueryContextType | undefined>(undefined)

export function MediaQueryProvider({ children }: { children: ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  return (
    <MediaQueryContext.Provider value={{
      isMobile,
      isTablet, 
      isDesktop,
      prefersDark
    }}>
      {children}
    </MediaQueryContext.Provider>
  )
}

export function useMediaQueryContext() {
  const context = useContext(MediaQueryContext)
  if (context === undefined) {
    throw new Error('useMediaQueryContext must be used within a MediaQueryProvider')
  }
  return context
}

// app/layout.tsx
import { MediaQueryProvider } from './contexts/MediaQueryContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <MediaQueryProvider>
          {children}
        </MediaQueryProvider>
      </body>
    </html>
  )
}

// Any component can now use the context
function SomeComponent() {
  const { isMobile, prefersDark } = useMediaQueryContext()
  
  return (
    <div className={`${prefersDark ? 'dark' : ''} ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}>
      Content adapts to screen size and theme
    </div>
  )
}
```

## Advanced Patterns

### Breakpoint Hook

```tsx
// Create a custom hook for common breakpoints
function useBreakpoints() {
  const xs = useMediaQuery('(max-width: 479px)')
  const sm = useMediaQuery('(min-width: 480px) and (max-width: 767px)')
  const md = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const lg = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)')
  const xl = useMediaQuery('(min-width: 1280px)')

  const current = xs ? 'xs' : sm ? 'sm' : md ? 'md' : lg ? 'lg' : 'xl'

  return {
    xs, sm, md, lg, xl,
    current,
    isXs: xs,
    isSmAndUp: sm || md || lg || xl,
    isMdAndUp: md || lg || xl,
    isLgAndUp: lg || xl,
    isXlOnly: xl
  }
}

function BreakpointAwareComponent() {
  const { current, isMdAndUp, isXs } = useBreakpoints()

  return (
    <div className="p-4">
      <h2>Current Breakpoint: {current}</h2>
      
      {isXs && (
        <div className="text-xs">
          Extra small content - minimal information
        </div>
      )}
      
      {isMdAndUp && (
        <div className="grid grid-cols-2 gap-4">
          <div>Column content available on medium+ screens</div>
          <div>Additional column for larger screens</div>
        </div>
      )}
    </div>
  )
}
```

### Container Query Simulation

```tsx
function ContainerQueryExample() {
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use ResizeObserver to watch container size
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Simulate container queries with width-based logic
  const isNarrowContainer = containerWidth < 400
  const isMediumContainer = containerWidth >= 400 && containerWidth < 800
  const isWideContainer = containerWidth >= 800

  return (
    <div 
      ref={containerRef}
      className="border-2 border-dashed border-gray-300 p-4 resize-x overflow-auto"
      style={{ width: '60%', minWidth: '200px' }}
    >
      <h3 className="mb-4">Resizable Container ({containerWidth}px)</h3>
      
      {isNarrowContainer && (
        <div className="space-y-2">
          <div className="bg-blue-100 p-2 text-sm">Narrow: Stacked layout</div>
          <div className="bg-blue-100 p-2 text-sm">Item 2</div>
          <div className="bg-blue-100 p-2 text-sm">Item 3</div>
        </div>
      )}
      
      {isMediumContainer && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-100 p-3">Medium: 2 columns</div>
          <div className="bg-green-100 p-3">Item 2</div>
          <div className="bg-green-100 p-3 col-span-2">Item 3 (full width)</div>
        </div>
      )}
      
      {isWideContainer && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-purple-100 p-4">Wide: 3 columns</div>
          <div className="bg-purple-100 p-4">Item 2</div>
          <div className="bg-purple-100 p-4">Item 3</div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        Drag the right edge to resize this container
      </p>
    </div>
  )
}
```

## Best Practices

### 1. Performance Optimization

```tsx
// Memoize media query results to prevent unnecessary re-renders
function OptimizedComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  // Memoize expensive calculations
  const layout = useMemo(() => {
    return isMobile ? 'mobile' : 'desktop'
  }, [isMobile])

  // Memoize component elements
  const mobileContent = useMemo(() => (
    <div>Expensive mobile component</div>
  ), [])

  const desktopContent = useMemo(() => (
    <div>Expensive desktop component</div>
  ), [])

  return (
    <div>
      {isMobile ? mobileContent : desktopContent}
    </div>
  )
}
```

### 2. Accessibility Considerations

```tsx
function AccessibleResponsiveComponent() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)')

  return (
    <div 
      className={`
        transition-all
        ${prefersDark ? 'bg-gray-900 text-white' : 'bg-white text-black'}
        ${prefersHighContrast ? 'border-2 border-current' : 'border border-gray-300'}
      `}
      style={{
        transitionDuration: prefersReducedMotion ? '0ms' : '300ms'
      }}
    >
      <button 
        className="p-2 rounded focus:outline-none focus:ring-2"
        style={{
          transform: prefersReducedMotion ? 'none' : 'scale(1)',
          transition: prefersReducedMotion ? 'none' : 'transform 0.2s'
        }}
      >
        Accessible Button
      </button>
    </div>
  )
}
```

### 3. Error Handling

```tsx
function RobustMediaQuery() {
  const [supportsMatchMedia, setSupportsMatchMedia] = useState(true)
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.matchMedia) {
      setSupportsMatchMedia(false)
      console.warn('matchMedia not supported')
    }
  }, [])

  const isMobile = useMediaQuery('(max-width: 768px)', {
    defaultMatch: !supportsMatchMedia ? false : undefined
  })

  if (!supportsMatchMedia) {
    return (
      <div>
        <p>Media queries not supported. Showing fallback layout.</p>
        {/* Fallback content */}
      </div>
    )
  }

  return (
    <div>
      {isMobile ? 'Mobile Layout' : 'Desktop Layout'}
    </div>
  )
}
```

## Common Use Cases

### Responsive Sidebar

```tsx
function ResponsiveSidebar() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-close mobile sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  return (
    <div className="flex">
      {/* Desktop sidebar - always visible */}
      {!isMobile && (
        <aside className="w-64 bg-gray-100 h-screen p-4">
          <h2 className="font-bold mb-4">Navigation</h2>
          <nav>
            <a href="#" className="block py-2">Dashboard</a>
            <a href="#" className="block py-2">Users</a>
            <a href="#" className="block py-2">Settings</a>
          </nav>
        </aside>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white h-full p-4 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">Navigation</h2>
              <button onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
            <nav>
              <a href="#" className="block py-2">Dashboard</a>
              <a href="#" className="block py-2">Users</a>
              <a href="#" className="block py-2">Settings</a>
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-4">
        {isMobile && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="mb-4 p-2 bg-blue-500 text-white rounded"
          >
            ☰ Open Menu
          </button>
        )}
        <h1>Main Content</h1>
      </main>
    </div>
  )
}
```

## Troubleshooting

### Hydration Mismatches
Always handle SSR properly:

```tsx
function HydrationSafeComponent() {
  const [mounted, setMounted] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)', {
    initializeWithValue: false // Don't use initial value
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading...</div>
  }

  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>
}
```

### Performance Issues
Avoid creating new media queries on every render:

```tsx
// ❌ Don't create dynamic queries
function BadExample({ width }: { width: number }) {
  const matches = useMediaQuery(`(max-width: ${width}px)`) // New query each render
  return <div>{matches ? 'Small' : 'Large'}</div>
}

// ✅ Use static queries and compare values
function GoodExample({ width }: { width: number }) {
  const isSmall = useMediaQuery('(max-width: 768px)')
  const isMedium = useMediaQuery('(max-width: 1024px)')
  
  const matches = width <= 768 ? isSmall : width <= 1024 ? isMedium : false
  return <div>{matches ? 'Small' : 'Large'}</div>
}
```