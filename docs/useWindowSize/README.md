# useWindowSize

A powerful hook for tracking window dimensions with built-in debouncing, throttling, orientation detection, and device pixel ratio support.

## Features

- 📏 **Complete Dimensions**: Track width, height, innerWidth, outerWidth
- 📱 **Orientation Detection**: Automatic portrait/landscape detection
- ⚡ **Performance Controls**: Built-in debounce and throttle options
- 🔍 **Device Pixel Ratio**: Optional high-DPI display support
- 📞 **Change Callbacks**: React to dimension changes
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- 🎛️ **Enable/Disable**: Toggle tracking on demand
- 🚀 **TypeScript**: Full type safety with comprehensive interfaces

## API Reference

```typescript
type OrientationTypes = 'portrait' | 'landscape'

interface Options {
  enabled?: boolean
  debounce?: number // debounces size updates (ms)
  throttle?: number
  listenOrientation?: boolean // it will listen to orientation changes -> 'portrait' | 'landscape'
  trackDevicePixelRatio?: boolean // includes the windows device pixel ration
  initialWidth: number
  initialHeight?: number
  onChange: () => void
}

interface UseWindowSizeResult {
  width: number
  height: number
  innerWidth: number
  outerWidth: number
  devicePixelRatio?: number
  orientation: OrientationTypes
  lastUpdated?: Date
}

function useWindowSize({ options }: { options: Options }): UseWindowSizeResult
```

## Usage Examples

### Basic Window Size Tracking

```tsx
import { useWindowSize } from 'garuda-hooks'

function BasicWindowSize() {
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1024,
      initialHeight: 768,
      onChange: () => {
        console.log('Window size changed')
      }
    }
  })

  return (
    <div className="p-4 border rounded">
      <h3>Window Dimensions</h3>
      <div className="space-y-1 text-sm">
        <p><strong>Width:</strong> {windowSize.width}px</p>
        <p><strong>Height:</strong> {windowSize.height}px</p>
        <p><strong>Inner Width:</strong> {windowSize.innerWidth}px</p>
        <p><strong>Outer Width:</strong> {windowSize.outerWidth}px</p>
        <p><strong>Orientation:</strong> {windowSize.orientation}</p>
        {windowSize.lastUpdated && (
          <p><strong>Last Updated:</strong> {windowSize.lastUpdated.toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  )
}
```

### Responsive Design with Breakpoints

```tsx
function ResponsiveComponent() {
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1024,
      onChange: () => {
        console.log('Viewport changed')
      }
    }
  })

  const getBreakpoint = (width: number) => {
    if (width < 640) return 'sm'
    if (width < 768) return 'md' 
    if (width < 1024) return 'lg'
    if (width < 1280) return 'xl'
    return '2xl'
  }

  const breakpoint = getBreakpoint(windowSize.width)
  const isMobile = windowSize.width < 768

  return (
    <div className="p-4">
      <div className={`grid gap-4 ${
        isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'
      }`}>
        <div className="bg-blue-100 p-4 rounded">
          <h3>Current Breakpoint</h3>
          <p className="text-lg font-bold">{breakpoint.toUpperCase()}</p>
          <p className="text-sm text-gray-600">{windowSize.width}px</p>
        </div>
        
        <div className="bg-green-100 p-4 rounded">
          <h3>Device Type</h3>
          <p className="text-lg font-bold">
            {isMobile ? 'Mobile' : 'Desktop'}
          </p>
          <p className="text-sm text-gray-600">
            {windowSize.orientation}
          </p>
        </div>
        
        <div className={`bg-purple-100 p-4 rounded ${isMobile ? 'col-span-1' : 'col-span-2 lg:col-span-1'}`}>
          <h3>Viewport Info</h3>
          <p className="text-sm">
            {windowSize.width} × {windowSize.height}
          </p>
          {windowSize.devicePixelRatio && (
            <p className="text-sm text-gray-600">
              DPR: {windowSize.devicePixelRatio}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
```

### Debounced Resize Handling

```tsx
function DebouncedWindowSize() {
  const [resizeCount, setResizeCount] = useState(0)
  
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1024,
      debounce: 250, // Wait 250ms after resize stops
      onChange: () => {
        setResizeCount(prev => prev + 1)
        console.log('Debounced resize triggered')
      }
    }
  })

  return (
    <div className="p-6 border rounded">
      <h3 className="text-lg font-bold mb-4">Debounced Resize Tracking</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm font-medium">Dimensions</p>
          <p className="text-xl">{windowSize.width} × {windowSize.height}</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm font-medium">Resize Events</p>
          <p className="text-xl">{resizeCount}</p>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>Resize events are debounced by 250ms to improve performance.</p>
        <p>Try resizing your window rapidly - count only updates after you stop.</p>
      </div>
    </div>
  )
}
```

### Throttled Performance Tracking

```tsx
function ThrottledWindowSize() {
  const [updateCount, setUpdateCount] = useState(0)
  const [isResizing, setIsResizing] = useState(false)
  
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1024,
      throttle: 100, // Update at most every 100ms
      onChange: () => {
        setUpdateCount(prev => prev + 1)
        setIsResizing(true)
        
        // Reset resizing state after a delay
        setTimeout(() => setIsResizing(false), 150)
      }
    }
  })

  return (
    <div className="p-6 border rounded">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Throttled Updates</h3>
        {isResizing && (
          <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-sm">
            Resizing...
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-sm font-medium text-blue-700">Current Size</p>
          <p className="text-lg text-blue-900">
            {windowSize.width}px × {windowSize.height}px
          </p>
        </div>
        
        <div className="bg-green-50 p-3 rounded">
          <p className="text-sm font-medium text-green-700">Update Count</p>
          <p className="text-lg text-green-900">{updateCount} updates</p>
        </div>
        
        <p className="text-sm text-gray-600">
          Updates are throttled to maximum once per 100ms during resize.
        </p>
      </div>
    </div>
  )
}
```

### Orientation Detection

```tsx
function OrientationAwareComponent() {
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1024,
      listenOrientation: true, // Enable orientation event listening
      onChange: () => {
        console.log('Orientation or size changed')
      }
    }
  })

  const isLandscape = windowSize.orientation === 'landscape'
  const aspectRatio = (windowSize.width / windowSize.height).toFixed(2)

  return (
    <div className="p-6 border rounded">
      <h3 className="text-lg font-bold mb-4">Orientation Detection</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className={`p-4 rounded ${isLandscape ? 'bg-blue-100' : 'bg-orange-100'}`}>
          <h4 className="font-medium">Current Orientation</h4>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl">
              {isLandscape ? '💻' : '📱'}
            </span>
            <span className="text-lg font-bold capitalize">
              {windowSize.orientation}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h4 className="font-medium">Aspect Ratio</h4>
          <p className="text-lg font-bold mt-2">{aspectRatio}:1</p>
          <p className="text-sm text-gray-600">
            {windowSize.width} ÷ {windowSize.height}
          </p>
        </div>
      </div>
      
      {/* Orientation-specific layouts */}
      <div className={`border rounded p-4 ${
        isLandscape 
          ? 'grid grid-cols-3 gap-4' 
          : 'space-y-3'
      }`}>
        <div className="bg-red-100 p-3 rounded text-center">Block 1</div>
        <div className="bg-green-100 p-3 rounded text-center">Block 2</div>
        <div className="bg-blue-100 p-3 rounded text-center">Block 3</div>
      </div>
      
      <p className="text-sm text-gray-600 mt-4">
        Layout automatically adapts to orientation changes.
      </p>
    </div>
  )
}
```

### High-DPI Display Support

```tsx
function HighDPIComponent() {
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1024,
      trackDevicePixelRatio: true, // Enable device pixel ratio tracking
      onChange: () => {
        console.log('Window size or pixel ratio changed')
      }
    }
  })

  const isHighDPI = (windowSize.devicePixelRatio || 1) > 1
  const pixelDensityClass = (windowSize.devicePixelRatio || 1) >= 2 ? 'high' : 'normal'

  return (
    <div className="p-6 border rounded">
      <h3 className="text-lg font-bold mb-4">High-DPI Display Detection</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm font-medium">CSS Pixels</p>
          <p className="text-lg">{windowSize.width} × {windowSize.height}</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm font-medium">Device Pixel Ratio</p>
          <p className="text-lg">{windowSize.devicePixelRatio || 'N/A'}</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm font-medium">Physical Pixels</p>
          <p className="text-lg">
            {Math.round(windowSize.width * (windowSize.devicePixelRatio || 1))} × {Math.round(windowSize.height * (windowSize.devicePixelRatio || 1))}
          </p>
        </div>
      </div>
      
      <div className={`p-4 rounded ${isHighDPI ? 'bg-green-100' : 'bg-yellow-100'}`}>
        <h4 className="font-medium">Display Quality</h4>
        <p className="text-lg font-bold">
          {isHighDPI ? '🌟 High-DPI (Retina)' : '📱 Standard DPI'}
        </p>
        <p className="text-sm text-gray-600">
          Pixel density class: {pixelDensityClass}
        </p>
      </div>
      
      {/* Conditional image loading based on pixel ratio */}
      <div className="mt-4">
        <img
          src={`/api/placeholder/400/200${isHighDPI ? '@2x' : ''}`}
          alt="Responsive to pixel density"
          className="w-full max-w-md rounded"
        />
        <p className="text-sm text-gray-600 mt-1">
          Image loads {isHighDPI ? '2x resolution' : 'standard resolution'} based on pixel ratio
        </p>
      </div>
    </div>
  )
}
```

### Conditional Enable/Disable

```tsx
function ConditionalWindowTracking() {
  const [trackingEnabled, setTrackingEnabled] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  
  const windowSize = useWindowSize({
    options: {
      enabled: trackingEnabled && !isPaused,
      initialWidth: 1024,
      debounce: 200,
      onChange: () => {
        console.log('Window size tracked')
      }
    }
  })

  return (
    <div className="p-6 border rounded">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Conditional Tracking</h3>
        <div className="space-x-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1 rounded text-sm ${
              isPaused 
                ? 'bg-green-500 text-white' 
                : 'bg-yellow-500 text-white'
            }`}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => setTrackingEnabled(!trackingEnabled)}
            className={`px-3 py-1 rounded text-sm ${
              trackingEnabled 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-500 text-white'
            }`}
          >
            {trackingEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <span className={`w-3 h-3 rounded-full ${
            trackingEnabled && !isPaused ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          <span className="text-sm">
            Tracking: {trackingEnabled && !isPaused ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-lg font-medium">
            {windowSize.width} × {windowSize.height}
          </p>
          <p className="text-sm text-gray-600">
            {windowSize.orientation} orientation
          </p>
          {windowSize.lastUpdated && (
            <p className="text-xs text-gray-500">
              Last update: {windowSize.lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-4">
        Use controls to pause tracking (saves performance) or disable completely.
      </p>
    </div>
  )
}
```

## Next.js Specific Usage

### App Router with Dynamic Imports

```tsx
'use client'

import { useWindowSize } from 'garuda-hooks'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import components based on screen size
const MobileNavigation = dynamic(() => import('./MobileNavigation'))
const DesktopNavigation = dynamic(() => import('./DesktopNavigation'))

export default function ResponsiveNavigation() {
  const [mounted, setMounted] = useState(false)
  
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1024,
      debounce: 100,
      onChange: () => {
        console.log('Navigation viewport changed')
      }
    }
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-16 bg-gray-100 animate-pulse" />
  }

  const isMobile = windowSize.width < 768

  return (
    <header className="border-b">
      {isMobile ? (
        <MobileNavigation width={windowSize.width} />
      ) : (
        <DesktopNavigation width={windowSize.width} />
      )}
    </header>
  )
}
```

### SSR-Safe Responsive Components

```tsx
'use client'

import { useWindowSize } from 'garuda-hooks'
import { useState, useEffect } from 'react'

export default function SSRSafeResponsive() {
  const [isClient, setIsClient] = useState(false)
  
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1200, // Safe default for SSR
      initialHeight: 800,
      debounce: 150,
      onChange: () => {
        // Only runs on client
        console.log('Client-side resize')
      }
    }
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Render server-safe content until hydrated
  if (!isClient) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  // Client-side responsive layout
  const getColumns = () => {
    if (windowSize.width < 640) return 1
    if (windowSize.width < 1024) return 2
    return 3
  }

  const columns = getColumns()

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded">
        <h3>Viewport: {windowSize.width}px × {windowSize.height}px</h3>
        <p>Columns: {columns}</p>
        <p>Orientation: {windowSize.orientation}</p>
      </div>
      
      <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded flex items-center justify-center text-white font-bold">
            Card {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Performance-Optimized Layout

```tsx
'use client'

import { useWindowSize } from 'garuda-hooks'
import { useMemo } from 'react'

export default function PerformantResponsiveGrid({ items }: { items: any[] }) {
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1200,
      throttle: 100, // Limit updates during resize
      onChange: () => {
        // Minimal callback for performance
      }
    }
  })

  // Memoize layout calculations
  const gridConfig = useMemo(() => {
    const width = windowSize.width
    
    let columns: number
    let gap: string
    let cardHeight: string

    if (width < 480) {
      columns = 1
      gap = 'gap-3'
      cardHeight = 'h-48'
    } else if (width < 768) {
      columns = 2
      gap = 'gap-4'
      cardHeight = 'h-52'
    } else if (width < 1200) {
      columns = 3
      gap = 'gap-5'
      cardHeight = 'h-56'
    } else {
      columns = 4
      gap = 'gap-6'
      cardHeight = 'h-60'
    }

    return { columns, gap, cardHeight, isMobile: width < 768 }
  }, [windowSize.width])

  return (
    <div className="p-4">
      <div className="mb-4 text-sm text-gray-600">
        {windowSize.width}px viewport • {gridConfig.columns} columns • {windowSize.orientation}
      </div>
      
      <div
        className={`grid ${gridConfig.gap}`}
        style={{ gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)` }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={`bg-white border rounded-lg p-4 ${gridConfig.cardHeight} flex flex-col justify-between`}
          >
            <div>
              <h3 className={`font-bold ${gridConfig.isMobile ? 'text-sm' : 'text-lg'}`}>
                {item.title}
              </h3>
              <p className={`text-gray-600 mt-2 ${gridConfig.isMobile ? 'text-xs' : 'text-sm'}`}>
                {item.description}
              </p>
            </div>
            <button className={`mt-4 bg-blue-500 text-white rounded ${
              gridConfig.isMobile ? 'py-2 text-sm' : 'py-3'
            }`}>
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Advanced Patterns

### Responsive Hook Composition

```tsx
function useResponsiveBreakpoints() {
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1200,
      debounce: 100,
      onChange: () => {
        // Breakpoint changed
      }
    }
  })

  const breakpoints = useMemo(() => ({
    xs: windowSize.width >= 0,
    sm: windowSize.width >= 640,
    md: windowSize.width >= 768,
    lg: windowSize.width >= 1024,
    xl: windowSize.width >= 1280,
    '2xl': windowSize.width >= 1536,
  }), [windowSize.width])

  const currentBreakpoint = useMemo(() => {
    if (windowSize.width >= 1536) return '2xl'
    if (windowSize.width >= 1280) return 'xl'
    if (windowSize.width >= 1024) return 'lg'
    if (windowSize.width >= 768) return 'md'
    if (windowSize.width >= 640) return 'sm'
    return 'xs'
  }, [windowSize.width])

  return {
    ...windowSize,
    breakpoints,
    currentBreakpoint,
    isMobile: !breakpoints.md,
    isTablet: breakpoints.md && !breakpoints.lg,
    isDesktop: breakpoints.lg,
  }
}

function ResponsiveComponentWithHook() {
  const { width, height, currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsiveBreakpoints()

  return (
    <div className="p-6 border rounded">
      <h3>Responsive Breakpoints Hook</h3>
      <div className="mt-4 space-y-2 text-sm">
        <p><strong>Viewport:</strong> {width}px × {height}px</p>
        <p><strong>Current Breakpoint:</strong> {currentBreakpoint}</p>
        <p><strong>Device Type:</strong> {
          isMobile ? 'Mobile' : 
          isTablet ? 'Tablet' : 
          isDesktop ? 'Desktop' : 'Unknown'
        }</p>
      </div>
      
      <div className="mt-4 grid gap-2" style={{
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr'
      }}>
        <div className="bg-blue-100 p-3 rounded">Content 1</div>
        <div className="bg-green-100 p-3 rounded">Content 2</div>
        {isDesktop && <div className="bg-purple-100 p-3 rounded">Content 3</div>}
      </div>
    </div>
  )
}
```

### Window Size Analytics

```tsx
function WindowSizeAnalytics() {
  const [analytics, setAnalytics] = useState({
    resizeCount: 0,
    averageWidth: 0,
    averageHeight: 0,
    minWidth: Infinity,
    maxWidth: 0,
    orientationChanges: 0,
    measurements: [] as Array<{ width: number; height: number; timestamp: Date }>
  })

  const windowSize = useWindowSize({
    options: {
      initialWidth: 1200,
      debounce: 200,
      trackDevicePixelRatio: true,
      onChange: () => {
        setAnalytics(prev => {
          const newMeasurement = {
            width: windowSize.width,
            height: windowSize.height,
            timestamp: new Date()
          }
          
          const measurements = [...prev.measurements, newMeasurement].slice(-50) // Keep last 50
          const totalWidth = measurements.reduce((sum, m) => sum + m.width, 0)
          const totalHeight = measurements.reduce((sum, m) => sum + m.height, 0)
          
          const orientationChanged = prev.measurements.length > 0 &&
            ((prev.measurements[prev.measurements.length - 1].width > prev.measurements[prev.measurements.length - 1].height) !==
             (windowSize.width > windowSize.height))

          return {
            resizeCount: prev.resizeCount + 1,
            averageWidth: Math.round(totalWidth / measurements.length),
            averageHeight: Math.round(totalHeight / measurements.length),
            minWidth: Math.min(prev.minWidth, windowSize.width),
            maxWidth: Math.max(prev.maxWidth, windowSize.width),
            orientationChanges: prev.orientationChanges + (orientationChanged ? 1 : 0),
            measurements
          }
        })
      }
    }
  })

  return (
    <div className="p-6 border rounded">
      <h3 className="text-lg font-bold mb-4">Window Size Analytics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-sm text-blue-600 font-medium">Current Size</p>
          <p className="text-lg font-bold text-blue-900">
            {windowSize.width} × {windowSize.height}
          </p>
        </div>
        
        <div className="bg-green-50 p-3 rounded">
          <p className="text-sm text-green-600 font-medium">Resize Count</p>
          <p className="text-lg font-bold text-green-900">{analytics.resizeCount}</p>
        </div>
        
        <div className="bg-purple-50 p-3 rounded">
          <p className="text-sm text-purple-600 font-medium">Width Range</p>
          <p className="text-lg font-bold text-purple-900">
            {analytics.minWidth === Infinity ? '0' : analytics.minWidth} - {analytics.maxWidth}
          </p>
        </div>
        
        <div className="bg-orange-50 p-3 rounded">
          <p className="text-sm text-orange-600 font-medium">Orientation Changes</p>
          <p className="text-lg font-bold text-orange-900">{analytics.orientationChanges}</p>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded">
        <h4 className="font-medium mb-2">Average Dimensions</h4>
        <p className="text-sm text-gray-600">
          {analytics.averageWidth || 0}px × {analytics.averageHeight || 0}px
          {windowSize.devicePixelRatio && ` (${windowSize.devicePixelRatio}x DPR)`}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Based on last {analytics.measurements.length} measurements
        </p>
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Performance Optimization

```tsx
function OptimizedWindowTracking() {
  // Use appropriate debounce/throttle based on use case
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1200,
      // For layout: use debounce to wait for resize to finish
      debounce: 250,
      // For animations: use throttle for smooth updates
      // throttle: 16, // ~60fps
      
      // Only track what you need
      trackDevicePixelRatio: false, // Only if needed for high-DPI images
      listenOrientation: true, // Only if needed for orientation changes
      
      onChange: () => {
        // Keep callback minimal for performance
        console.log('Size changed')
      }
    }
  })

  // Memoize expensive calculations
  const layoutConfig = useMemo(() => {
    return calculateComplexLayout(windowSize.width, windowSize.height)
  }, [windowSize.width, windowSize.height])

  return (
    <div className="p-4">
      <p>Optimized layout configuration calculated</p>
      {/* Use memoized layoutConfig */}
    </div>
  )
}

function calculateComplexLayout(width: number, height: number) {
  // Expensive layout calculations here
  return { columns: Math.floor(width / 300), rows: Math.floor(height / 200) }
}
```

### 2. SSR Safety

```tsx
function SSRSafeComponent() {
  const [isHydrated, setIsHydrated] = useState(false)
  
  const windowSize = useWindowSize({
    options: {
      // Provide sensible defaults for SSR
      initialWidth: 1200,
      initialHeight: 800,
      debounce: 200,
      onChange: () => {
        // Only runs on client
      }
    }
  })

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    // Render server-safe default layout
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="h-48 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    )
  }

  // Client-side responsive layout
  return (
    <div className="grid gap-4" style={{
      gridTemplateColumns: `repeat(${Math.floor(windowSize.width / 400)}, 1fr)`
    }}>
      <div className="h-48 bg-blue-200 rounded" />
      <div className="h-48 bg-green-200 rounded" />
      <div className="h-48 bg-purple-200 rounded" />
    </div>
  )
}
```

### 3. Memory Management

```tsx
function MemoryEfficientComponent() {
  const [enabled, setEnabled] = useState(true)
  
  const windowSize = useWindowSize({
    options: {
      enabled, // Disable when not needed
      initialWidth: 1200,
      debounce: 300,
      onChange: useCallback(() => {
        // Use useCallback to prevent unnecessary re-renders
        console.log('Size changed')
      }, [])
    }
  })

  // Cleanup when component is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setEnabled(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <div className="p-4">
      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Enable window tracking
      </label>
      
      {enabled && (
        <p>Window: {windowSize.width} × {windowSize.height}</p>
      )}
    </div>
  )
}
```

## Common Use Cases

### Responsive Image Loading

```tsx
function ResponsiveImageGallery() {
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1200,
      debounce: 150,
      trackDevicePixelRatio: true,
      onChange: () => {
        console.log('Image sizes may need updating')
      }
    }
  })

  const getImageSize = () => {
    const width = windowSize.width
    const dpr = windowSize.devicePixelRatio || 1
    
    let baseWidth: number
    if (width < 640) baseWidth = width
    else if (width < 1024) baseWidth = width / 2
    else baseWidth = width / 3
    
    return Math.round(baseWidth * dpr)
  }

  const imageWidth = getImageSize()

  return (
    <div className="grid gap-4" style={{
      gridTemplateColumns: windowSize.width < 640 ? '1fr' : 
                          windowSize.width < 1024 ? 'repeat(2, 1fr)' : 
                          'repeat(3, 1fr)'
    }}>
      {[1, 2, 3, 4, 5, 6].map((id) => (
        <img
          key={id}
          src={`/api/placeholder/${imageWidth}/${Math.round(imageWidth * 0.75)}`}
          alt={`Image ${id}`}
          className="w-full h-auto rounded"
          loading="lazy"
        />
      ))}
    </div>
  )
}
```

### Adaptive Navigation

```tsx
function AdaptiveNavigation() {
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1200,
      debounce: 100,
      onChange: () => {
        console.log('Navigation layout update')
      }
    }
  })

  const navItems = [
    'Home', 'Products', 'Services', 'About', 'Contact', 'Blog', 'Support'
  ]

  const shouldCollapse = windowSize.width < 768
  const maxVisibleItems = Math.floor((windowSize.width - 200) / 120) // Rough calculation

  return (
    <nav className="flex items-center justify-between p-4 bg-white border-b">
      <div className="font-bold text-xl">Logo</div>
      
      {shouldCollapse ? (
        <button className="p-2 border rounded">
          ☰ Menu
        </button>
      ) : (
        <div className="flex items-center space-x-6">
          {navItems.slice(0, maxVisibleItems).map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-blue-600">
              {item}
            </a>
          ))}
          
          {navItems.length > maxVisibleItems && (
            <div className="relative group">
              <button className="hover:text-blue-600">More ▼</button>
              <div className="absolute top-full right-0 mt-1 bg-white border rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {navItems.slice(maxVisibleItems).map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="block px-4 py-2 hover:bg-gray-100 whitespace-nowrap"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
```

## Troubleshooting

### Performance Issues

```tsx
function DebuggingPerformance() {
  const [renderCount, setRenderCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date>()
  
  const windowSize = useWindowSize({
    options: {
      initialWidth: 1200,
      // Test different performance settings
      debounce: 250,
      // throttle: 100,
      onChange: () => {
        setLastUpdate(new Date())
        console.log('Performance test - size changed')
      }
    }
  })

  // Count renders
  useEffect(() => {
    setRenderCount(prev => prev + 1)
  })

  return (
    <div className="p-4 border rounded">
      <h3>Performance Debugging</h3>
      <div className="mt-4 space-y-2 text-sm">
        <p><strong>Render Count:</strong> {renderCount}</p>
        <p><strong>Window Size:</strong> {windowSize.width} × {windowSize.height}</p>
        <p><strong>Last Update:</strong> {lastUpdate?.toLocaleTimeString() || 'None'}</p>
        <p><strong>Orientation:</strong> {windowSize.orientation}</p>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Tips:</strong> Use debounce for layout changes, throttle for animations.
          High render counts may indicate missing debounce/throttle.
        </p>
      </div>
    </div>
  )
}
```