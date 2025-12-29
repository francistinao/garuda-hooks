# useClickOutside

A powerful hook for detecting clicks outside specified DOM elements, perfect for modals, dropdowns, tooltips, and any UI that needs to close when users click elsewhere.

## Features

- 🎯 **Multiple Refs Support**: Target single or multiple elements simultaneously
- ⚡ **Event Flexibility**: Configure mousedown, touchstart, or custom events
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- 🎛️ **Configurable**: Enable/disable, capture mode, and custom event types
- 📱 **Touch Friendly**: Supports both mouse and touch interactions
- 🚀 **TypeScript**: Full type safety with generic ref support

## API Reference

```typescript
type EventType = 'mousedown' | 'touchstart'

interface Options {
  enabled?: boolean
  eventTypes?: Array<EventType>
  capture?: boolean
}

function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: (event: Event) => void,
  options?: Options
): void
```

## Usage Examples

### Basic Modal Example

```tsx
import { useClickOutside } from 'garuda-hooks'
import { useRef, useState } from 'react'

function Modal() {
  const [isOpen, setIsOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useClickOutside(modalRef, () => {
    setIsOpen(false)
  })

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded">
        Open Modal
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div
        ref={modalRef}
        className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <h2 className="text-xl font-bold mb-4">Modal Title</h2>
        <p className="mb-4">Click outside this modal to close it.</p>
        <button
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Close
        </button>
      </div>
    </div>
  )
}
```

### Dropdown Menu

```tsx
function DropdownMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useClickOutside(dropdownRef, () => {
    setIsOpen(false)
  })

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Menu ▼
      </button>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg min-w-48"
        >
          <a href="#" className="block px-4 py-2 hover:bg-gray-100">Profile</a>
          <a href="#" className="block px-4 py-2 hover:bg-gray-100">Settings</a>
          <a href="#" className="block px-4 py-2 hover:bg-gray-100">Logout</a>
        </div>
      )}
    </div>
  )
}
```

### Multiple References

```tsx
function MultiRefExample() {
  const [showTooltip, setShowTooltip] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Close tooltip when clicking outside both button and tooltip
  useClickOutside([buttonRef, tooltipRef], () => {
    setShowTooltip(false)
  })

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowTooltip(!showTooltip)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Toggle Tooltip
      </button>
      
      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute top-full left-0 mt-2 p-3 bg-gray-800 text-white rounded shadow-lg"
        >
          This tooltip won't close when you click on it or the button!
        </div>
      )}
    </div>
  )
}
```

### Conditional Enabling

```tsx
function ConditionalExample() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useClickOutside(
    modalRef,
    () => {
      if (!isLocked) {
        setIsModalOpen(false)
      }
    },
    {
      enabled: isModalOpen && !isLocked
    }
  )

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>Open Modal</button>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div ref={modalRef} className="bg-white p-6 rounded-lg">
            <h2>Modal</h2>
            <label className="flex items-center gap-2 my-4">
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
              />
              Lock modal (prevent click-outside close)
            </label>
            <button onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Custom Event Types

```tsx
function CustomEventExample() {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Only respond to touch events (useful for mobile-first components)
  useClickOutside(
    panelRef,
    () => setIsOpen(false),
    {
      eventTypes: ['touchstart']
    }
  )

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Touch Panel</button>
      
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t"
        >
          <p>This panel only closes on touch events, not mouse clicks.</p>
        </div>
      )}
    </div>
  )
}
```

## Next.js Specific Usage

### App Router Modal

```tsx
'use client'

import { useClickOutside } from 'garuda-hooks'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'

interface ModalProps {
  children: React.ReactNode
}

export default function Modal({ children }: ModalProps) {
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)

  useClickOutside(modalRef, () => {
    router.back()
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-auto"
      >
        {children}
      </div>
    </div>
  )
}
```

### Navigation Menu with URL State

```tsx
'use client'

import { useClickOutside } from 'garuda-hooks'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useRef, useCallback } from 'react'

export default function NavigationMenu() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)
  
  const isMenuOpen = searchParams.get('menu') === 'open'

  const closeMenu = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('menu')
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  useClickOutside(menuRef, closeMenu, {
    enabled: isMenuOpen
  })

  const openMenu = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('menu', 'open')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative">
      <button onClick={openMenu} className="px-4 py-2 bg-blue-500 text-white rounded">
        Open Menu
      </button>
      
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg"
        >
          <a href="/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</a>
          <a href="/settings" className="block px-4 py-2 hover:bg-gray-100">Settings</a>
          <button onClick={closeMenu} className="block w-full text-left px-4 py-2 hover:bg-gray-100">
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
```

### Server Component Integration

```tsx
// app/modal/page.tsx (Server Component)
import ClientModal from './ClientModal'

export default function ModalPage() {
  return (
    <div>
      <h1>Server-rendered page with client modal</h1>
      <ClientModal />
    </div>
  )
}

// app/modal/ClientModal.tsx (Client Component)
'use client'

import { useClickOutside } from 'garuda-hooks'
import { useState, useRef } from 'react'

export default function ClientModal() {
  const [isOpen, setIsOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useClickOutside(modalRef, () => {
    setIsOpen(false)
  })

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Client Modal</button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div ref={modalRef} className="bg-white p-6 rounded-lg">
            <h2>Client-side Modal</h2>
            <p>This modal is rendered client-side but works with SSR.</p>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

## Advanced Patterns

### Context Menu

```tsx
function ContextMenu() {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useClickOutside(menuRef, () => {
    setContextMenu(null)
  })

  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY
    })
  }

  return (
    <div className="p-8">
      <div
        className="w-64 h-64 bg-gray-200 rounded flex items-center justify-center cursor-pointer"
        onContextMenu={handleRightClick}
      >
        Right-click me for context menu
      </div>
      
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed bg-white border rounded shadow-lg py-1 z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`
          }}
        >
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">Copy</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">Paste</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">Delete</button>
        </div>
      )}
    </div>
  )
}
```

### Nested Modals

```tsx
function NestedModals() {
  const [primaryModal, setPrimaryModal] = useState(false)
  const [secondaryModal, setSecondaryModal] = useState(false)
  const primaryRef = useRef<HTMLDivElement>(null)
  const secondaryRef = useRef<HTMLDivElement>(null)

  // Primary modal closes on outside click only if secondary is closed
  useClickOutside(primaryRef, () => {
    if (!secondaryModal) {
      setPrimaryModal(false)
    }
  })

  // Secondary modal closes on outside click (but not when clicking primary modal)
  useClickOutside(secondaryRef, () => {
    setSecondaryModal(false)
  })

  return (
    <div>
      <button onClick={() => setPrimaryModal(true)}>Open Primary Modal</button>
      
      {primaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div ref={primaryRef} className="bg-white p-6 rounded-lg">
            <h2>Primary Modal</h2>
            <button 
              onClick={() => setSecondaryModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
            >
              Open Secondary Modal
            </button>
            <button onClick={() => setPrimaryModal(false)}>Close</button>
          </div>
        </div>
      )}
      
      {secondaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div ref={secondaryRef} className="bg-white p-6 rounded-lg ml-8 mt-8">
            <h3>Secondary Modal</h3>
            <p>This modal can be closed by clicking outside.</p>
            <button onClick={() => setSecondaryModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Form with Click-Away Validation

```tsx
function FormWithClickAway() {
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  const validateForm = () => {
    const newErrors: string[] = []
    if (!formData.name.trim()) newErrors.push('Name is required')
    if (!formData.email.includes('@')) newErrors.push('Valid email is required')
    return newErrors
  }

  useClickOutside(formRef, () => {
    if (isEditing) {
      const validationErrors = validateForm()
      setErrors(validationErrors)
      if (validationErrors.length === 0) {
        setIsEditing(false)
        console.log('Form saved:', formData)
      }
    }
  })

  return (
    <div className="p-6">
      <form
        ref={formRef}
        className={`max-w-md border rounded p-4 ${isEditing ? 'border-blue-500' : 'border-gray-300'}`}
        onClick={() => setIsEditing(true)}
      >
        <h3>User Profile {isEditing && '(Editing)'}</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-2 border rounded"
            placeholder="Enter your name"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full p-2 border rounded"
            placeholder="Enter your email"
          />
        </div>
        
        {errors.length > 0 && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 rounded">
            {errors.map((error, index) => (
              <p key={index} className="text-red-600 text-sm">{error}</p>
            ))}
          </div>
        )}
        
        <p className="text-sm text-gray-600">
          {isEditing ? 'Click outside to save' : 'Click to edit'}
        </p>
      </form>
    </div>
  )
}
```

## Options Configuration

### Event Capture

```tsx
function CaptureExample() {
  const ref = useRef<HTMLDivElement>(null)
  const [captureMode, setCaptureMode] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useClickOutside(
    ref,
    () => {
      setIsOpen(false)
      console.log(`Closed with capture: ${captureMode}`)
    },
    {
      capture: captureMode
    }
  )

  return (
    <div>
      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={captureMode}
          onChange={(e) => setCaptureMode(e.target.checked)}
        />
        Use event capture mode
      </label>
      
      <button onClick={() => setIsOpen(true)}>Open Panel</button>
      
      {isOpen && (
        <div ref={ref} className="mt-4 p-4 border rounded">
          <p>Click outside to close. Capture mode: {captureMode ? 'ON' : 'OFF'}</p>
        </div>
      )}
    </div>
  )
}
```

## Best Practices

### 1. Accessibility Considerations

```tsx
function AccessibleModal() {
  const [isOpen, setIsOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useClickOutside(modalRef, () => {
    setIsOpen(false)
  })

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="bg-white p-6 rounded-lg"
          >
            <h2 id="modal-title">Accessible Modal</h2>
            <p>This modal supports keyboard navigation and screen readers.</p>
            <button
              ref={closeButtonRef}
              onClick={() => setIsOpen(false)}
              aria-label="Close modal"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 2. Performance Optimization

```tsx
function OptimizedExample() {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Memoize the handler to prevent unnecessary re-renders
  const handleClickOutside = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Only enable when modal is open to avoid unnecessary event listeners
  useClickOutside(ref, handleClickOutside, {
    enabled: isOpen
  })

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && (
        <div ref={ref} className="fixed inset-0 bg-white">
          <p>Optimized modal with conditional event listeners</p>
        </div>
      )}
    </div>
  )
}
```

### 3. Error Boundaries

```tsx
function SafeClickOutside({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback(() => {
    try {
      // Your click outside logic here
      console.log('Clicked outside safely')
    } catch (error) {
      console.error('Click outside error:', error)
      setHasError(true)
    }
  }, [])

  useClickOutside(ref, handleClickOutside)

  if (hasError) {
    return <div>Something went wrong with click detection.</div>
  }

  return <div ref={ref}>{children}</div>
}
```

## Common Use Cases

### Search with Suggestions

```tsx
function SearchWithSuggestions() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useClickOutside(containerRef, () => {
    setIsOpen(false)
  })

  const handleSearch = (value: string) => {
    setQuery(value)
    if (value.trim()) {
      // Simulate API call
      const mockSuggestions = [
        `${value} suggestion 1`,
        `${value} suggestion 2`,
        `${value} suggestion 3`
      ]
      setSuggestions(mockSuggestions)
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
        className="w-full p-3 border rounded-lg"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b-lg shadow-lg z-10">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setQuery(suggestion)
                setIsOpen(false)
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Color Picker Widget

```tsx
function ColorPicker() {
  const [selectedColor, setSelectedColor] = useState('#3B82F6')
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useClickOutside(pickerRef, () => {
    setIsOpen(false)
  })

  const colors = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E',
    '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'
  ]

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 border-2 border-gray-300 rounded"
        style={{ backgroundColor: selectedColor }}
        aria-label="Choose color"
      />
      
      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute top-full left-0 mt-2 p-3 bg-white border rounded shadow-lg"
        >
          <div className="grid grid-cols-4 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                className="w-8 h-8 border border-gray-300 rounded hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => {
                  setSelectedColor(color)
                  setIsOpen(false)
                }}
                aria-label={`Select ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

## Troubleshooting

### Event Not Firing
Ensure your ref is attached to a valid DOM element:

```tsx
function DebuggingExample() {
  const ref = useRef<HTMLDivElement>(null)
  const [clickCount, setClickCount] = useState(0)

  useClickOutside(ref, (event) => {
    console.log('Click outside detected:', event.target)
    setClickCount(prev => prev + 1)
  })

  // Debug: Check if ref is properly attached
  useEffect(() => {
    console.log('Ref current:', ref.current)
  })

  return (
    <div>
      <div ref={ref} className="p-4 border border-blue-500">
        Target element (clicks inside here won't trigger the handler)
      </div>
      <p>Clicks outside: {clickCount}</p>
    </div>
  )
}
```

### Multiple Handlers Conflict
Be careful when using multiple click-outside handlers:

```tsx
function MultipleHandlersExample() {
  const [modal1Open, setModal1Open] = useState(false)
  const [modal2Open, setModal2Open] = useState(false)
  const modal1Ref = useRef<HTMLDivElement>(null)
  const modal2Ref = useRef<HTMLDivElement>(null)

  // Each modal has its own handler
  useClickOutside(modal1Ref, () => {
    setModal1Open(false)
  }, { enabled: modal1Open })

  useClickOutside(modal2Ref, () => {
    setModal2Open(false)
  }, { enabled: modal2Open })

  return (
    <div>
      <button onClick={() => setModal1Open(true)}>Open Modal 1</button>
      <button onClick={() => setModal2Open(true)}>Open Modal 2</button>
      
      {modal1Open && (
        <div className="fixed inset-0 bg-black bg-opacity-50">
          <div ref={modal1Ref} className="bg-white p-6 m-20 rounded">
            Modal 1 Content
          </div>
        </div>
      )}
      
      {modal2Open && (
        <div className="fixed inset-0 bg-black bg-opacity-50">
          <div ref={modal2Ref} className="bg-white p-6 m-20 rounded">
            Modal 2 Content
          </div>
        </div>
      )}
    </div>
  )
}
```