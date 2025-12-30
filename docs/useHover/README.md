# useHover

A versatile hook for detecting hover state on single or multiple DOM elements with configurable delay timing and callback support.

## Features

- 🎯 **Single & Multiple Refs**: Target one element or multiple elements simultaneously
- ⏱️ **Delay Controls**: Configure enter and leave delays independently
- 📞 **State Callbacks**: Optional callback function for hover state changes
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- 🎛️ **Enable/Disable**: Toggle hover detection on demand
- 📱 **Touch Friendly**: Uses mouse events optimized for various input methods
- 🚀 **TypeScript**: Full type safety with generic ref support

## API Reference

```typescript
type RefType = RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[]

interface Options {
  enabled: boolean
  delayEnter: number
  delayLeave: number
  onHoverChange: (isHovered: boolean) => void
  eventTypes: EventTypes
}

interface UseHoverResult {
  isHovered: boolean
  setIsHovered: (isHovered: boolean) => void
}

function useHover({
  refs: RefType,
  options: Options
}): UseHoverResult
```

## Usage Examples

### Basic Hover Detection

```tsx
import { useHover } from 'garuda-hooks'
import { useRef } from 'react'

function BasicHoverExample() {
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const { isHovered } = useHover({
    refs: buttonRef,
    options: {
      enabled: true,
      delayEnter: 0,
      delayLeave: 0,
      onHoverChange: (hovered) => {
        console.log('Hover state changed:', hovered)
      }
    }
  })

  return (
    <button
      ref={buttonRef}
      className={`px-4 py-2 rounded transition-colors ${
        isHovered 
          ? 'bg-blue-600 text-white' 
          : 'bg-blue-500 text-white hover:bg-blue-600'
      }`}
    >
      {isHovered ? 'I\'m being hovered!' : 'Hover over me'}
    </button>
  )
}
```

### Hover with Delays

```tsx
function DelayedHoverExample() {
  const cardRef = useRef<HTMLDivElement>(null)
  
  const { isHovered } = useHover({
    refs: cardRef,
    options: {
      enabled: true,
      delayEnter: 300,  // 300ms delay before showing hover state
      delayLeave: 150,  // 150ms delay before hiding hover state
      onHoverChange: (hovered) => {
        console.log('Delayed hover:', hovered)
      }
    }
  })

  return (
    <div
      ref={cardRef}
      className={`p-6 border rounded-lg transition-all duration-200 ${
        isHovered 
          ? 'border-blue-500 shadow-lg scale-105' 
          : 'border-gray-300 shadow'
      }`}
    >
      <h3>Delayed Hover Card</h3>
      <p>Hover effects appear after 300ms delay</p>
      {isHovered && (
        <div className="mt-2 text-blue-600 font-medium">
          ✨ Hover state active!
        </div>
      )}
    </div>
  )
}
```

### Multiple Elements Hover

```tsx
function MultipleHoverExample() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  
  const { isHovered, setIsHovered } = useHover({
    refs: [titleRef, imageRef, descriptionRef],
    options: {
      enabled: true,
      delayEnter: 100,
      delayLeave: 200,
      onHoverChange: (hovered) => {
        console.log('Any element hovered:', hovered)
      }
    }
  })

  return (
    <div className="max-w-sm border rounded-lg overflow-hidden">
      <img
        ref={imageRef}
        src="/api/placeholder/300/200"
        alt="Product"
        className={`w-full h-48 object-cover transition-transform ${
          isHovered ? 'scale-110' : 'scale-100'
        }`}
      />
      <div className="p-4">
        <h3 
          ref={titleRef}
          className={`text-lg font-bold transition-colors ${
            isHovered ? 'text-blue-600' : 'text-gray-900'
          }`}
        >
          Product Title
        </h3>
        <p 
          ref={descriptionRef}
          className={`mt-2 transition-colors ${
            isHovered ? 'text-gray-700' : 'text-gray-600'
          }`}
        >
          Hover over the title, image, or this description to see coordinated effects.
        </p>
        
        {/* Manual control */}
        <button
          onClick={() => setIsHovered(!isHovered)}
          className="mt-2 px-3 py-1 text-sm bg-gray-200 rounded"
        >
          Toggle Hover State
        </button>
      </div>
    </div>
  )
}
```

### Conditional Hover with Enable/Disable

```tsx
function ConditionalHoverExample() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const { isHovered } = useHover({
    refs: buttonRef,
    options: {
      enabled: isEnabled && !isLoading,
      delayEnter: 0,
      delayLeave: 0,
      onHoverChange: (hovered) => {
        if (hovered) {
          console.log('Button is ready for interaction')
        }
      }
    }
  })

  const handleClick = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
        />
        Enable hover detection
      </label>
      
      <button
        ref={buttonRef}
        onClick={handleClick}
        disabled={isLoading}
        className={`px-6 py-3 rounded font-medium transition-all ${
          isLoading
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : isHovered && isEnabled
            ? 'bg-green-600 text-white shadow-lg'
            : 'bg-green-500 text-white'
        }`}
      >
        {isLoading ? 'Processing...' : 'Submit'}
      </button>
      
      <p className="text-sm text-gray-600">
        Hover state: {isHovered && isEnabled ? 'Active' : 'Inactive'}
      </p>
    </div>
  )
}
```

### Tooltip with Hover

```tsx
function TooltipExample() {
  const triggerRef = useRef<HTMLSpanElement>(null)
  
  const { isHovered } = useHover({
    refs: triggerRef,
    options: {
      enabled: true,
      delayEnter: 500,  // Delay before showing tooltip
      delayLeave: 100,  // Quick hide
      onHoverChange: (hovered) => {
        console.log('Tooltip:', hovered ? 'showing' : 'hiding')
      }
    }
  })

  return (
    <div className="relative inline-block">
      <span
        ref={triggerRef}
        className="text-blue-600 underline cursor-help"
      >
        Hover for info
      </span>
      
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded whitespace-nowrap z-10">
          This is a helpful tooltip!
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
        </div>
      )}
    </div>
  )
}
```

## Next.js Specific Usage

### App Router Component

```tsx
'use client'

import { useHover } from 'garuda-hooks'
import { useRef } from 'react'

export default function InteractiveCard() {
  const cardRef = useRef<HTMLDivElement>(null)
  
  const { isHovered } = useHover({
    refs: cardRef,
    options: {
      enabled: true,
      delayEnter: 200,
      delayLeave: 100,
      onHoverChange: (hovered) => {
        // Could trigger analytics or other side effects
        if (hovered) {
          console.log('Card interaction started')
        }
      }
    }
  })

  return (
    <div
      ref={cardRef}
      className={`p-6 rounded-lg border transition-all duration-300 ${
        isHovered 
          ? 'border-blue-500 shadow-xl bg-blue-50' 
          : 'border-gray-200 shadow-md bg-white'
      }`}
    >
      <h2 className="text-xl font-bold">Interactive Card</h2>
      <p className="mt-2 text-gray-600">
        This card responds to hover with smooth transitions.
      </p>
      {isHovered && (
        <div className="mt-4 space-x-2">
          <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
            Action 1
          </button>
          <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm">
            Action 2
          </button>
        </div>
      )}
    </div>
  )
}
```

### Server Component with Client Island

```tsx
// app/page.tsx (Server Component)
import ClientHoverComponent from './ClientHoverComponent'

export default function Page() {
  return (
    <div>
      <h1>Server-rendered content</h1>
      <ClientHoverComponent />
    </div>
  )
}

// app/ClientHoverComponent.tsx (Client Component)
'use client'

import { useHover } from 'garuda-hooks'
import { useRef, useState } from 'react'

export default function ClientHoverComponent() {
  const [count, setCount] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const { isHovered } = useHover({
    refs: buttonRef,
    options: {
      enabled: true,
      delayEnter: 0,
      delayLeave: 0,
      onHoverChange: (hovered) => {
        if (hovered) {
          // Could increment analytics counter
          setCount(prev => prev + 1)
        }
      }
    }
  })

  return (
    <div className="p-4 border rounded">
      <button
        ref={buttonRef}
        className={`px-4 py-2 rounded transition-colors ${
          isHovered ? 'bg-purple-600' : 'bg-purple-500'
        } text-white`}
      >
        {isHovered ? '✨ Hovering!' : 'Hover me'}
      </button>
      <p className="mt-2 text-sm text-gray-600">
        Hover count: {count}
      </p>
    </div>
  )
}
```

## Advanced Patterns

### Navigation Menu with Hover

```tsx
function NavigationMenu() {
  const menuItemRefs = useRef<Array<HTMLLIElement | null>>([])
  const dropdownRefs = useRef<Array<HTMLDivElement | null>>([])
  const [activeMenu, setActiveMenu] = useState<number | null>(null)

  const menuItems = [
    { label: 'Products', items: ['Web Apps', 'Mobile Apps', 'Desktop'] },
    { label: 'Services', items: ['Consulting', 'Support', 'Training'] },
    { label: 'Company', items: ['About', 'Careers', 'Contact'] }
  ]

  // Create hover handlers for each menu item
  const hoverHandlers = menuItems.map((_, index) => {
    const triggerRef = useRef<HTMLLIElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    
    return useHover({
      refs: [triggerRef, dropdownRef],
      options: {
        enabled: true,
        delayEnter: 150,
        delayLeave: 300,
        onHoverChange: (hovered) => {
          setActiveMenu(hovered ? index : null)
        }
      }
    })
  })

  return (
    <nav className="relative">
      <ul className="flex space-x-8">
        {menuItems.map((item, index) => (
          <li key={item.label} className="relative">
            <button
              ref={(el) => {
                menuItemRefs.current[index] = el
                hoverHandlers[index].refs = el
              }}
              className={`px-4 py-2 transition-colors ${
                activeMenu === index
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {item.label}
            </button>
            
            {activeMenu === index && (
              <div
                ref={(el) => {
                  dropdownRefs.current[index] = el
                }}
                className="absolute top-full left-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10"
              >
                {item.items.map((subItem) => (
                  <a
                    key={subItem}
                    href={`#${subItem.toLowerCase()}`}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {subItem}
                  </a>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

### Image Gallery with Hover Effects

```tsx
function ImageGallery() {
  const images = [
    { id: 1, src: '/api/placeholder/300/300', title: 'Nature' },
    { id: 2, src: '/api/placeholder/300/300', title: 'Architecture' },
    { id: 3, src: '/api/placeholder/300/300', title: 'Portrait' },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((image) => {
        const imageRef = useRef<HTMLDivElement>(null)
        
        const { isHovered } = useHover({
          refs: imageRef,
          options: {
            enabled: true,
            delayEnter: 100,
            delayLeave: 200,
            onHoverChange: (hovered) => {
              console.log(`Image ${image.id} hover:`, hovered)
            }
          }
        })

        return (
          <div
            key={image.id}
            ref={imageRef}
            className="relative overflow-hidden rounded-lg cursor-pointer"
          >
            <img
              src={image.src}
              alt={image.title}
              className={`w-full h-64 object-cover transition-transform duration-300 ${
                isHovered ? 'scale-110' : 'scale-100'
              }`}
            />
            
            <div
              className={`absolute inset-0 bg-black transition-opacity duration-300 ${
                isHovered ? 'opacity-40' : 'opacity-0'
              }`}
            />
            
            {isHovered && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold">{image.title}</h3>
                  <button className="mt-2 px-4 py-2 bg-white text-gray-900 rounded">
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

### Form Field with Hover Help

```tsx
function FormWithHoverHelp() {
  const fields = [
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      help: 'We\'ll never share your email with anyone else.'
    },
    {
      id: 'password',
      label: 'Password',
      type: 'password',
      help: 'Must be at least 8 characters with uppercase, lowercase, and numbers.'
    }
  ]

  return (
    <form className="space-y-6">
      {fields.map((field) => {
        const labelRef = useRef<HTMLLabelElement>(null)
        const inputRef = useRef<HTMLInputElement>(null)
        
        const { isHovered } = useHover({
          refs: [labelRef, inputRef],
          options: {
            enabled: true,
            delayEnter: 200,
            delayLeave: 100,
            onHoverChange: (hovered) => {
              console.log(`Field ${field.id} help:`, hovered ? 'showing' : 'hiding')
            }
          }
        })

        return (
          <div key={field.id} className="space-y-2">
            <label
              ref={labelRef}
              htmlFor={field.id}
              className="block text-sm font-medium text-gray-700"
            >
              {field.label}
            </label>
            <input
              ref={inputRef}
              type={field.type}
              id={field.id}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div
              className={`text-sm text-gray-600 transition-all duration-200 ${
                isHovered 
                  ? 'opacity-100 max-h-20' 
                  : 'opacity-0 max-h-0 overflow-hidden'
              }`}
            >
              {field.help}
            </div>
          </div>
        )
      })}
    </form>
  )
}
```

## Options Configuration

### All Options Example

```tsx
function AllOptionsExample() {
  const elementRef = useRef<HTMLDivElement>(null)
  const [delayEnter, setDelayEnter] = useState(300)
  const [delayLeave, setDelayLeave] = useState(100)
  const [enabled, setEnabled] = useState(true)
  
  const { isHovered, setIsHovered } = useHover({
    refs: elementRef,
    options: {
      enabled,
      delayEnter,
      delayLeave,
      onHoverChange: (hovered) => {
        console.log(`Hover changed: ${hovered}, delays: enter=${delayEnter}ms, leave=${delayLeave}ms`)
      }
    }
  })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Enter Delay: {delayEnter}ms
        </label>
        <input
          type="range"
          min="0"
          max="1000"
          step="50"
          value={delayEnter}
          onChange={(e) => setDelayEnter(Number(e.target.value))}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Leave Delay: {delayLeave}ms
        </label>
        <input
          type="range"
          min="0"
          max="1000"
          step="50"
          value={delayLeave}
          onChange={(e) => setDelayLeave(Number(e.target.value))}
          className="w-full"
        />
      </div>
      
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Enable hover detection
      </label>
      
      <div
        ref={elementRef}
        className={`w-64 h-32 border-2 border-dashed rounded flex items-center justify-center transition-all duration-300 ${
          isHovered && enabled
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        <div className="text-center">
          <p className="font-medium">
            {isHovered && enabled ? '✨ Hovering!' : 'Hover me'}
          </p>
          <button
            onClick={() => setIsHovered(!isHovered)}
            className="mt-2 px-2 py-1 text-xs bg-gray-200 rounded"
          >
            Manual Toggle
          </button>
        </div>
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Performance Optimization

```tsx
function OptimizedHoverComponent() {
  const elementRef = useRef<HTMLDivElement>(null)
  
  // Memoize the hover configuration to prevent unnecessary re-renders
  const hoverOptions = useMemo(() => ({
    enabled: true,
    delayEnter: 200,
    delayLeave: 100,
    onHoverChange: (hovered: boolean) => {
      // Use callback ref or state setter to avoid dependencies
      console.log('Optimized hover change:', hovered)
    }
  }), [])
  
  const { isHovered } = useHover({
    refs: elementRef,
    options: hoverOptions
  })

  return (
    <div
      ref={elementRef}
      className="p-4 border rounded transition-colors"
      style={{
        backgroundColor: isHovered ? '#eff6ff' : '#ffffff'
      }}
    >
      Optimized hover component
    </div>
  )
}
```

### 2. Accessibility Considerations

```tsx
function AccessibleHoverComponent() {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const { isHovered } = useHover({
    refs: buttonRef,
    options: {
      enabled: true,
      delayEnter: 100,
      delayLeave: 200,
      onHoverChange: (hovered) => {
        // Don't auto-expand on hover for keyboard users
        if (hovered && document.activeElement !== buttonRef.current) {
          setIsExpanded(true)
        } else if (!hovered) {
          setIsExpanded(false)
        }
      }
    }
  })

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded(!isExpanded)
          }
        }}
        aria-expanded={isExpanded}
        aria-haspopup="true"
        className={`px-4 py-2 rounded transition-colors ${
          isHovered || isExpanded
            ? 'bg-blue-600 text-white'
            : 'bg-blue-500 text-white'
        }`}
      >
        Menu {isExpanded ? '▼' : '▶'}
      </button>
      
      {isExpanded && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded shadow-lg">
          <a href="#" className="block px-4 py-2 hover:bg-gray-100">Option 1</a>
          <a href="#" className="block px-4 py-2 hover:bg-gray-100">Option 2</a>
          <a href="#" className="block px-4 py-2 hover:bg-gray-100">Option 3</a>
        </div>
      )}
    </div>
  )
}
```

### 3. Error Handling

```tsx
function RobustHoverComponent() {
  const elementRef = useRef<HTMLDivElement>(null)
  const [hasError, setHasError] = useState(false)
  
  const { isHovered } = useHover({
    refs: elementRef,
    options: {
      enabled: !hasError,
      delayEnter: 200,
      delayLeave: 100,
      onHoverChange: (hovered) => {
        try {
          // Safe operation that might fail
          console.log('Hover state:', hovered)
          
          // Reset error state on successful hover
          if (hasError) {
            setHasError(false)
          }
        } catch (error) {
          console.error('Hover callback error:', error)
          setHasError(true)
        }
      }
    }
  })

  if (hasError) {
    return (
      <div className="p-4 border border-red-300 rounded bg-red-50">
        <p className="text-red-600">Hover detection failed</p>
        <button 
          onClick={() => setHasError(false)}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div
      ref={elementRef}
      className={`p-4 border rounded transition-colors ${
        isHovered ? 'border-green-500 bg-green-50' : 'border-gray-300'
      }`}
    >
      Robust hover component with error handling
    </div>
  )
}
```

## Common Use Cases

### Card Hover Effects

```tsx
function ProductCard({ product }: { product: any }) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  const { isHovered } = useHover({
    refs: cardRef,
    options: {
      enabled: true,
      delayEnter: 100,
      delayLeave: 200,
      onHoverChange: (hovered) => {
        // Could trigger analytics
        if (hovered) {
          console.log('Product viewed:', product.id)
        }
      }
    }
  })

  return (
    <div
      ref={cardRef}
      className={`border rounded-lg overflow-hidden transition-all duration-300 ${
        isHovered ? 'shadow-xl scale-105' : 'shadow-md'
      }`}
    >
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold text-lg">{product.name}</h3>
        <p className="text-gray-600">${product.price}</p>
        
        {isHovered && (
          <button className="mt-2 w-full py-2 bg-blue-500 text-white rounded">
            Add to Cart
          </button>
        )}
      </div>
    </div>
  )
}
```

### Interactive Dashboard Widget

```tsx
function DashboardWidget({ title, value, trend }: any) {
  const widgetRef = useRef<HTMLDivElement>(null)
  
  const { isHovered } = useHover({
    refs: widgetRef,
    options: {
      enabled: true,
      delayEnter: 150,
      delayLeave: 100,
      onHoverChange: (hovered) => {
        // Could load additional data on hover
        if (hovered) {
          console.log('Widget expanded:', title)
        }
      }
    }
  })

  return (
    <div
      ref={widgetRef}
      className={`p-6 bg-white rounded-lg border transition-all duration-300 ${
        isHovered 
          ? 'border-blue-500 shadow-lg transform -translate-y-1' 
          : 'border-gray-200 shadow'
      }`}
    >
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        {title}
      </h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        <p className={`ml-2 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
        </p>
      </div>
      
      {isHovered && (
        <div className="mt-4 text-sm text-gray-600">
          <p>View detailed analytics →</p>
        </div>
      )}
    </div>
  )
}
```

## Troubleshooting

### Hover Not Triggering

```tsx
function DebuggingHover() {
  const elementRef = useRef<HTMLDivElement>(null)
  
  const { isHovered } = useHover({
    refs: elementRef,
    options: {
      enabled: true,
      delayEnter: 0,
      delayLeave: 0,
      onHoverChange: (hovered) => {
        console.log('Debug - Hover state changed:', hovered)
        console.log('Debug - Element ref:', elementRef.current)
      }
    }
  })

  // Debug effect to check ref attachment
  useEffect(() => {
    console.log('Debug - Element ref on mount:', elementRef.current)
  }, [])

  return (
    <div>
      <div
        ref={elementRef}
        className="p-4 border border-blue-500 bg-blue-50"
        style={{ minHeight: '100px', minWidth: '200px' }}
      >
        Debug Target Element
        <br />
        Hovered: {isHovered ? 'YES' : 'NO'}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Check console for debug information</p>
        <p>Ensure the element has adequate size for mouse interaction</p>
      </div>
    </div>
  )
}
```

### Multiple Refs Issues

```tsx
function MultiRefDebugging() {
  const ref1 = useRef<HTMLDivElement>(null)
  const ref2 = useRef<HTMLDivElement>(null)
  const ref3 = useRef<HTMLDivElement>(null)
  
  const { isHovered } = useHover({
    refs: [ref1, ref2, ref3],
    options: {
      enabled: true,
      delayEnter: 0,
      delayLeave: 0,
      onHoverChange: (hovered) => {
        console.log('Any element hovered:', hovered)
        
        // Debug which elements are properly attached
        console.log('Ref 1:', ref1.current)
        console.log('Ref 2:', ref2.current)
        console.log('Ref 3:', ref3.current)
      }
    }
  })

  return (
    <div className="space-y-4">
      <div ref={ref1} className="p-4 bg-red-100 border">
        Element 1 (Red)
      </div>
      <div ref={ref2} className="p-4 bg-green-100 border">
        Element 2 (Green)
      </div>
      <div ref={ref3} className="p-4 bg-blue-100 border">
        Element 3 (Blue)
      </div>
      
      <p>Global hover state: {isHovered ? 'Active' : 'Inactive'}</p>
    </div>
  )
}
```