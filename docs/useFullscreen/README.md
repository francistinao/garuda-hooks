# useFullscreen

A comprehensive hook for managing fullscreen mode with cross-browser support and TypeScript safety.

## Features

- 🖥️ **Cross-Browser**: Works across all major browsers with vendor prefixes
- 🎯 **Element Targeting**: Can target specific elements or entire document
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- 🎮 **Complete Control**: Enter, exit, and toggle fullscreen modes
- 📱 **Support Detection**: Automatically detects fullscreen API availability

## API Reference

```typescript
interface UseFullScreenResult<T> {
  ref: RefObject<T | null>
  isFullscreen: boolean
  isSupported: boolean
  enter: () => Promise<void>
  exit: () => Promise<void>
  toggle: () => Promise<void>
}

function useFullscreen<T extends HTMLElement = HTMLElement>(
  targetRef?: RefObject<T>
): UseFullScreenResult<T>
```

## Usage Examples

### Basic Document Fullscreen

```tsx
import { useFullscreen } from 'garuda-hooks'

function BasicFullscreenExample() {
  const { isFullscreen, isSupported, enter, exit, toggle } = useFullscreen()

  if (!isSupported) {
    return <div>Fullscreen is not supported in your browser</div>
  }

  return (
    <div className="p-6">
      <h2>Fullscreen Demo</h2>
      <p>Status: {isFullscreen ? 'In Fullscreen' : 'Normal Mode'}</p>
      
      <div className="space-x-2 mt-4">
        <button 
          onClick={enter}
          disabled={isFullscreen}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Enter Fullscreen
        </button>
        
        <button 
          onClick={exit}
          disabled={!isFullscreen}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          Exit Fullscreen
        </button>
        
        <button 
          onClick={toggle}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          Toggle Fullscreen
        </button>
      </div>
    </div>
  )
}
```

### Target Specific Element

```tsx
function ElementFullscreenExample() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { isFullscreen, enter, exit, toggle } = useFullscreen(videoRef)

  return (
    <div className="p-6">
      <div className="relative">
        <video
          ref={videoRef}
          controls
          className="w-full max-w-2xl"
          src="/sample-video.mp4"
        />
        
        <button
          onClick={toggle}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded hover:bg-opacity-75"
        >
          {isFullscreen ? '🗗' : '⛶'} {isFullscreen ? 'Exit' : 'Fullscreen'}
        </button>
      </div>
      
      <p className="mt-2 text-sm text-gray-600">
        Click the fullscreen button to make the video fullscreen
      </p>
    </div>
  )
}
```

### Image Gallery Fullscreen

```tsx
interface Image {
  id: string
  src: string
  alt: string
}

function FullscreenGallery({ images }: { images: Image[] }) {
  const galleryRef = useRef<HTMLDivElement>(null)
  const { isFullscreen, isSupported, toggle } = useFullscreen(galleryRef)
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="relative">
      <div
        ref={galleryRef}
        className={`relative ${
          isFullscreen 
            ? 'bg-black flex items-center justify-center h-screen' 
            : 'bg-gray-100 p-4 rounded'
        }`}
      >
        <img
          src={images[currentIndex].src}
          alt={images[currentIndex].alt}
          className={`max-w-full ${isFullscreen ? 'max-h-full' : 'max-h-96'} object-contain`}
        />
        
        {/* Navigation controls */}
        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded"
        >
          ←
        </button>
        
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded"
        >
          →
        </button>
        
        {/* Fullscreen toggle */}
        {isSupported && (
          <button
            onClick={toggle}
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        )}
        
        {/* Image counter */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  )
}
```

### Presentation Mode

```tsx
function PresentationViewer() {
  const presentationRef = useRef<HTMLDivElement>(null)
  const { isFullscreen, isSupported, enter, exit } = useFullscreen(presentationRef)
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const slides = [
    { title: "Introduction", content: "Welcome to our presentation" },
    { title: "Overview", content: "Here's what we'll cover today" },
    { title: "Details", content: "Let's dive into the specifics" },
    { title: "Conclusion", content: "Thank you for your attention" }
  ]

  const startPresentation = async () => {
    setCurrentSlide(0)
    await enter()
  }

  const endPresentation = async () => {
    await exit()
    setCurrentSlide(0)
  }

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1)
    } else {
      endPresentation()
    }
  }

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1))
  }

  useEffect(() => {
    if (isFullscreen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === ' ') nextSlide()
        if (e.key === 'ArrowLeft') prevSlide()
        if (e.key === 'Escape') endPresentation()
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen, currentSlide])

  return (
    <div>
      {!isFullscreen ? (
        <div className="p-6">
          <h2>Presentation Ready</h2>
          <p>Slides: {slides.length}</p>
          {isSupported ? (
            <button 
              onClick={startPresentation}
              className="mt-4 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Start Presentation
            </button>
          ) : (
            <p className="text-red-600">Fullscreen not supported</p>
          )}
        </div>
      ) : (
        <div
          ref={presentationRef}
          className="h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex flex-col justify-center items-center p-8"
        >
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-8">{slides[currentSlide].title}</h1>
            <p className="text-2xl mb-12">{slides[currentSlide].content}</p>
          </div>
          
          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="px-4 py-2 bg-white bg-opacity-20 rounded disabled:opacity-50"
            >
              Previous
            </button>
            
            <span className="text-lg">
              {currentSlide + 1} / {slides.length}
            </span>
            
            <button
              onClick={nextSlide}
              className="px-4 py-2 bg-white bg-opacity-20 rounded"
            >
              {currentSlide === slides.length - 1 ? 'End' : 'Next'}
            </button>
          </div>
          
          <button
            onClick={endPresentation}
            className="absolute top-8 right-8 px-4 py-2 bg-red-500 bg-opacity-80 rounded hover:bg-opacity-100"
          >
            Exit
          </button>
        </div>
      )}
    </div>
  )
}
```

### Gaming Interface

```tsx
function GameFullscreenInterface() {
  const gameRef = useRef<HTMLDivElement>(null)
  const { isFullscreen, isSupported, toggle } = useFullscreen(gameRef)
  const [gameStarted, setGameStarted] = useState(false)

  return (
    <div>
      <div
        ref={gameRef}
        className={`relative ${
          isFullscreen 
            ? 'h-screen bg-black' 
            : 'h-96 bg-gray-900 rounded-lg overflow-hidden'
        }`}
      >
        {/* Game content */}
        <div className="w-full h-full flex items-center justify-center text-white">
          {gameStarted ? (
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">Game Running</h2>
              <p className="text-xl">Use WASD to move, ESC for menu</p>
              
              {/* Game controls overlay */}
              <div className="absolute bottom-4 right-4 space-y-2">
                {isSupported && (
                  <button
                    onClick={toggle}
                    className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                  >
                    {isFullscreen ? 'Windowed' : 'Fullscreen'}
                  </button>
                )}
                <button
                  onClick={() => setGameStarted(false)}
                  className="block w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                >
                  Quit Game
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6">Awesome Game</h2>
              <button
                onClick={() => setGameStarted(true)}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-semibold"
              >
                Start Game
              </button>
              
              {isSupported && (
                <p className="mt-4 text-sm opacity-75">
                  Click fullscreen button after starting for best experience
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {!isSupported && (
        <p className="mt-2 text-red-600 text-sm">
          Fullscreen mode is not supported in your browser
        </p>
      )}
    </div>
  )
}
```

## Next.js Specific Usage

### App Router Implementation

```tsx
'use client'

import { useFullscreen } from 'garuda-hooks'
import { useEffect } from 'react'

export default function FullscreenPage() {
  const { isFullscreen, isSupported, toggle, enter, exit } = useFullscreen()

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exit()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isFullscreen, exit])

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Next.js Fullscreen Demo</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded">
          <p><strong>Fullscreen Status:</strong> {isFullscreen ? 'Active' : 'Inactive'}</p>
          <p><strong>Browser Support:</strong> {isSupported ? 'Yes' : 'No'}</p>
        </div>
        
        {isSupported && (
          <button
            onClick={toggle}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </button>
        )}
      </div>
    </div>
  )
}
```

### Server Component + Client Component Pattern

```tsx
// app/fullscreen/page.tsx (Server Component)
import FullscreenDemo from './FullscreenDemo'

export default function FullscreenPage() {
  return (
    <div>
      <h1>Fullscreen Feature Demo</h1>
      <FullscreenDemo />
    </div>
  )
}

// app/fullscreen/FullscreenDemo.tsx (Client Component)
'use client'

import { useFullscreen } from 'garuda-hooks'

export default function FullscreenDemo() {
  const { isFullscreen, isSupported, toggle } = useFullscreen()

  return (
    <div className="p-4">
      {isSupported ? (
        <button onClick={toggle}>
          {isFullscreen ? 'Exit' : 'Enter'} Fullscreen
        </button>
      ) : (
        <p>Fullscreen not supported</p>
      )}
    </div>
  )
}
```

## Advanced Patterns

### Fullscreen with State Persistence

```tsx
function PersistentFullscreenState() {
  const { isFullscreen, isSupported, toggle } = useFullscreen()
  const [userPreference, setUserPreference] = useState(false)

  // Remember user's fullscreen preference
  useEffect(() => {
    const saved = localStorage.getItem('fullscreen-preference')
    if (saved) {
      setUserPreference(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('fullscreen-preference', JSON.stringify(isFullscreen))
    setUserPreference(isFullscreen)
  }, [isFullscreen])

  return (
    <div>
      <p>User prefers fullscreen: {userPreference ? 'Yes' : 'No'}</p>
      {isSupported && (
        <button onClick={toggle}>
          Toggle Fullscreen
        </button>
      )}
    </div>
  )
}
```

### Fullscreen with Analytics

```tsx
function AnalyticsFullscreen() {
  const { isFullscreen, isSupported, enter, exit } = useFullscreen()

  const trackFullscreenEnter = async () => {
    // Track analytics event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'fullscreen_enter', {
        event_category: 'user_interaction'
      })
    }
    await enter()
  }

  const trackFullscreenExit = async () => {
    // Track analytics event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'fullscreen_exit', {
        event_category: 'user_interaction'
      })
    }
    await exit()
  }

  return (
    <div>
      {isSupported && (
        <div>
          <button onClick={trackFullscreenEnter}>Enter Fullscreen</button>
          <button onClick={trackFullscreenExit}>Exit Fullscreen</button>
        </div>
      )}
    </div>
  )
}
```

## Best Practices

### 1. User Experience

```tsx
function UserFriendlyFullscreen() {
  const { isFullscreen, isSupported, toggle } = useFullscreen()
  const [showInstructions, setShowInstructions] = useState(true)

  useEffect(() => {
    if (isFullscreen) {
      setShowInstructions(false)
      // Show a brief instruction
      const timer = setTimeout(() => setShowInstructions(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [isFullscreen])

  return (
    <div>
      {isFullscreen && showInstructions && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white p-2 rounded z-50">
          Press ESC to exit fullscreen
        </div>
      )}
      
      {isSupported && (
        <button
          onClick={toggle}
          className="px-4 py-2 bg-blue-500 text-white rounded"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? '⛶' : '⛶'} Fullscreen
        </button>
      )}
    </div>
  )
}
```

### 2. Error Handling

```tsx
function RobustFullscreen() {
  const { isFullscreen, isSupported, enter, exit } = useFullscreen()
  const [error, setError] = useState<string | null>(null)

  const handleFullscreenToggle = async () => {
    try {
      setError(null)
      if (isFullscreen) {
        await exit()
      } else {
        await enter()
      }
    } catch (err) {
      setError('Fullscreen operation failed. Please try again.')
      console.error('Fullscreen error:', err)
    }
  }

  return (
    <div>
      {isSupported ? (
        <div>
          <button onClick={handleFullscreenToggle}>
            Toggle Fullscreen
          </button>
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>
      ) : (
        <p>Fullscreen is not supported in your browser</p>
      )}
    </div>
  )
}
```

### 3. Performance Optimization

```tsx
function OptimizedFullscreen() {
  const targetRef = useRef<HTMLDivElement>(null)
  const { isFullscreen, isSupported, toggle } = useFullscreen(targetRef)

  // Memoize expensive operations
  const fullscreenContent = useMemo(() => {
    if (!isFullscreen) return null
    
    return (
      <div className="h-full bg-gradient-to-br from-purple-900 to-blue-900">
        {/* Expensive fullscreen content */}
      </div>
    )
  }, [isFullscreen])

  return (
    <div ref={targetRef}>
      {isFullscreen ? fullscreenContent : (
        <div className="p-4">
          <p>Normal view content</p>
          {isSupported && (
            <button onClick={toggle}>Go Fullscreen</button>
          )}
        </div>
      )}
    </div>
  )
}
```

## Troubleshooting

### Fullscreen Not Working

```tsx
function FullscreenDebugging() {
  const { isFullscreen, isSupported, enter } = useFullscreen()
  
  const handleDebugEnter = async () => {
    if (!isSupported) {
      console.error('Fullscreen API not supported')
      return
    }
    
    if (!document.hasFocus()) {
      alert('Please interact with the page first (click somewhere)')
      return
    }
    
    try {
      await enter()
    } catch (error) {
      console.error('Fullscreen error:', error)
      alert('Fullscreen failed. Check browser permissions.')
    }
  }

  return (
    <div>
      <button onClick={handleDebugEnter}>
        Debug Fullscreen Entry
      </button>
      <div className="mt-4 text-sm">
        <p>Supported: {isSupported ? 'Yes' : 'No'}</p>
        <p>Currently fullscreen: {isFullscreen ? 'Yes' : 'No'}</p>
        <p>Document has focus: {document.hasFocus() ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}
```

### Cross-Browser Issues

The hook automatically handles vendor prefixes, but for additional compatibility:

```tsx
function CrossBrowserFullscreen() {
  const { isSupported } = useFullscreen()
  
  useEffect(() => {
    // Log browser capabilities
    console.log('Fullscreen support details:', {
      standard: 'requestFullscreen' in document.documentElement,
      webkit: 'webkitRequestFullscreen' in document.documentElement,
      moz: 'mozRequestFullScreen' in document.documentElement,
      ms: 'msRequestFullscreen' in document.documentElement
    })
  }, [])

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <p className="font-semibold">Fullscreen not available</p>
        <p className="text-sm">Your browser doesn't support the fullscreen API.</p>
        <p className="text-sm">Try updating your browser or using a different one.</p>
      </div>
    )
  }

  return <div>{/* Your fullscreen component */}</div>
}
```