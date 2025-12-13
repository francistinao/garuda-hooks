# useOrientation

A comprehensive hook for detecting device orientation changes with screen rotation, device motion tracking, and permission management.

## Features

- 📱 **Screen Orientation**: Detect portrait/landscape and exact rotation angles
- 🎯 **Device Motion**: Optional gyroscope and accelerometer data tracking
- 🔐 **Permission Management**: Handle iOS 13+ motion permission requirements  
- ⏱️ **Debounced Updates**: Configurable debouncing to prevent excessive re-renders
- 🧠 **Idle Awareness**: Optional pause updates when user is inactive
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks

## API Reference

```typescript
interface Options {
  trackDeviceMotion: boolean // will listen to device sensors
  debounce: number // debounce orientation updates every 200 ms
  idleAware: boolean // pause update if user is inactive or idle
}

interface Orientation {
  type: 'portrait' | 'landscape' | 'unknown'
  angle: 0 | 90 | 180 | 270 | null
  screen: {
    width: number
    height: number
  }
  device: {
    alpha: number | null // Z-axis rotation (compass)
    beta: number | null  // X-axis rotation (front-to-back)
    gamma: number | null // Y-axis rotation (left-to-right)
    absolute: boolean | null
  }
  supported: {
    screenOrientation: boolean
    deviceOrientation: boolean
  }
  permission: 'granted' | 'denied' | 'prompt' | 'not-required'
  lastUpdated: number
}

function useOrentation(options?: Options): { orientation: Orientation | null }
```

## Usage Examples

### Basic Orientation Detection

```tsx
import { useOrentation } from 'garuda-hooks'

function BasicOrientationExample() {
  const { orientation } = useOrentation()

  if (!orientation) {
    return <div>Loading orientation data...</div>
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Device Orientation</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Screen Orientation</h3>
          <div className="space-y-1">
            <p><strong>Type:</strong> {orientation.type}</p>
            <p><strong>Angle:</strong> {orientation.angle}°</p>
            <p><strong>Dimensions:</strong> {orientation.screen.width} × {orientation.screen.height}</p>
          </div>
        </div>

        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Support Status</h3>
          <div className="space-y-1">
            <p><strong>Screen API:</strong> {orientation.supported.screenOrientation ? '✅' : '❌'}</p>
            <p><strong>Device Motion:</strong> {orientation.supported.deviceOrientation ? '✅' : '❌'}</p>
            <p><strong>Permission:</strong> {orientation.permission}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className={`inline-block text-6xl transition-transform duration-300 ${
          orientation.type === 'landscape' ? 'transform rotate-90' : ''
        }`}>
          📱
        </div>
        <p className="mt-2 text-gray-600">
          {orientation.type === 'portrait' ? 'Portrait Mode' : 'Landscape Mode'}
        </p>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Last updated: {new Date(orientation.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  )
}
```

### Gaming Controller with Device Motion

```tsx
function MotionGameController() {
  const { orientation } = useOrentation({
    trackDeviceMotion: true, // Enable gyroscope/accelerometer
    debounce: 50, // Update more frequently for games
    idleAware: false // Don't pause during gameplay
  })

  const [gameState, setGameState] = useState({
    ballX: 50, // percentage
    ballY: 50,
    score: 0
  })

  // Control ball position with device tilt
  useEffect(() => {
    if (!orientation?.device.beta || !orientation?.device.gamma) return

    const { beta, gamma } = orientation.device
    
    // Convert tilt angles to screen positions
    const newX = Math.max(0, Math.min(100, 50 + (gamma * 2))) // gamma controls X
    const newY = Math.max(0, Math.min(100, 50 + (beta * 2)))  // beta controls Y
    
    setGameState(prev => ({ ...prev, ballX: newX, ballY: newY }))
  }, [orientation?.device.beta, orientation?.device.gamma])

  const requestMotionPermission = async () => {
    // This would be handled automatically by the hook,
    // but you can provide UI feedback
    if (orientation?.permission === 'prompt') {
      alert('Please allow motion access to play the game!')
    }
  }

  if (!orientation) {
    return <div>Loading game controller...</div>
  }

  if (orientation.permission === 'denied') {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Motion Access Required</h2>
        <p className="text-gray-600 mb-4">
          This game requires device motion access to control the ball.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Tilt Ball Game</h2>
      
      <div className="mb-4 flex justify-between items-center">
        <div className="text-lg font-semibold">Score: {gameState.score}</div>
        <div className="text-sm text-gray-600">
          Tilt: β={orientation.device.beta?.toFixed(1)}° γ={orientation.device.gamma?.toFixed(1)}°
        </div>
      </div>

      <div className="relative bg-gray-800 rounded-lg h-96 overflow-hidden">
        {/* Game ball */}
        <div
          className="absolute w-6 h-6 bg-red-500 rounded-full transition-all duration-100"
          style={{
            left: `${gameState.ballX}%`,
            top: `${gameState.ballY}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* Target zones */}
        <div className="absolute top-4 left-4 w-12 h-12 bg-green-500 rounded-full opacity-50" />
        <div className="absolute top-4 right-4 w-12 h-12 bg-blue-500 rounded-full opacity-50" />
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-yellow-500 rounded-full opacity-50" />
        <div className="absolute bottom-4 right-4 w-12 h-12 bg-purple-500 rounded-full opacity-50" />
      </div>

      {orientation.permission === 'prompt' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm">
            Tap "Allow" when prompted to enable device motion for better gameplay.
          </p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>• Tilt your device to move the red ball</p>
        <p>• Try to hit the colored targets in the corners</p>
        <p>• Works best on mobile devices</p>
      </div>
    </div>
  )
}
```

### Responsive Layout with Orientation

```tsx
function OrientationAwareLayout() {
  const { orientation } = useOrentation()
  const [content] = useState([
    { id: 1, title: 'Card 1', content: 'Sample content for card 1' },
    { id: 2, title: 'Card 2', content: 'Sample content for card 2' },
    { id: 3, title: 'Card 3', content: 'Sample content for card 3' },
    { id: 4, title: 'Card 4', content: 'Sample content for card 4' }
  ])

  if (!orientation) {
    return <div>Loading layout...</div>
  }

  const isPortrait = orientation.type === 'portrait'
  const gridCols = isPortrait ? 'grid-cols-1' : 'grid-cols-2'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Adaptive Layout</h2>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{isPortrait ? '📱' : '📟'}</span>
          <span className="text-sm text-gray-600">
            {orientation.type} ({orientation.angle}°)
          </span>
        </div>
      </div>

      <div className={`grid ${gridCols} gap-4 transition-all duration-300`}>
        {content.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-lg shadow-md p-4 ${
              isPortrait ? 'min-h-[200px]' : 'min-h-[150px]'
            }`}
          >
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.content}</p>
            
            {!isPortrait && (
              <div className="mt-4 text-sm text-blue-600">
                Additional landscape content...
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Orientation Details</h3>
        <div className="text-sm space-y-1">
          <p><strong>Screen Size:</strong> {orientation.screen.width} × {orientation.screen.height}</p>
          <p><strong>Rotation:</strong> {orientation.angle}°</p>
          <p><strong>Layout:</strong> {isPortrait ? 'Single column' : 'Two columns'}</p>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        💡 Rotate your device to see the layout change
      </div>
    </div>
  )
}
```

### Camera/Photo App Interface

```tsx
function CameraInterface() {
  const { orientation } = useOrentation({
    trackDeviceMotion: true,
    debounce: 100
  })

  const [capturedPhotos, setCapturedPhotos] = useState<Array<{
    id: string
    orientation: string
    timestamp: Date
    angle: number
  }>>([])

  const [isCapturing, setIsCapturing] = useState(false)

  const capturePhoto = () => {
    if (!orientation) return

    setIsCapturing(true)
    
    // Simulate photo capture
    setTimeout(() => {
      const newPhoto = {
        id: Date.now().toString(),
        orientation: orientation.type,
        timestamp: new Date(),
        angle: orientation.angle || 0
      }
      
      setCapturedPhotos(prev => [newPhoto, ...prev.slice(0, 4)]) // Keep last 5 photos
      setIsCapturing(false)
    }, 500)
  }

  if (!orientation) {
    return <div>Loading camera interface...</div>
  }

  const isLandscape = orientation.type === 'landscape'
  const rotationClass = {
    0: 'rotate-0',
    90: 'rotate-90', 
    180: 'rotate-180',
    270: 'rotate-270'
  }[orientation.angle || 0] || 'rotate-0'

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">Camera App</h2>
      
      {/* Camera Viewfinder */}
      <div className={`relative bg-black rounded-lg overflow-hidden transition-all duration-300 ${
        isLandscape ? 'aspect-[4/3]' : 'aspect-[3/4]'
      }`}>
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <div className={`text-4xl mb-2 transition-transform duration-300 ${rotationClass}`}>
              📷
            </div>
            <div className="text-sm">
              {orientation.type} • {orientation.angle}°
            </div>
            {orientation.device.beta !== null && (
              <div className="text-xs mt-1 opacity-75">
                Tilt: {orientation.device.beta.toFixed(1)}°
              </div>
            )}
          </div>
        </div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white border-opacity-30" />
          ))}
        </div>

        {/* Orientation indicator */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          {isLandscape ? 'Landscape' : 'Portrait'}
        </div>
      </div>

      {/* Capture Button */}
      <div className="flex justify-center my-6">
        <button
          onClick={capturePhoto}
          disabled={isCapturing}
          className={`w-20 h-20 rounded-full border-4 border-white bg-red-500 ${
            isCapturing ? 'scale-95 bg-red-600' : 'hover:scale-105'
          } transition-transform duration-150`}
        >
          <span className="text-white text-2xl">
            {isCapturing ? '⏱️' : '📸'}
          </span>
        </button>
      </div>

      {/* Photo Gallery */}
      {capturedPhotos.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Recent Photos</h3>
          <div className="grid grid-cols-5 gap-2">
            {capturedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square bg-gray-200 rounded flex flex-col items-center justify-center text-xs"
              >
                <span className="text-lg mb-1">🖼️</span>
                <span className="text-gray-600">
                  {photo.orientation === 'portrait' ? 'P' : 'L'}
                </span>
                <span className="text-gray-500">
                  {photo.angle}°
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-3 bg-gray-50 rounded text-sm">
        <h4 className="font-semibold mb-1">Tips:</h4>
        <ul className="text-gray-600 space-y-1">
          <li>• Hold device steady for best results</li>
          <li>• Grid helps with composition</li>
          <li>• Orientation is automatically detected</li>
          {orientation.supported.deviceOrientation && (
            <li>• Tilt angle shows device stability</li>
          )}
        </ul>
      </div>
    </div>
  )
}
```

### VR/AR Orientation Viewer

```tsx
function VROrientationViewer() {
  const { orientation } = useOrentation({
    trackDeviceMotion: true,
    debounce: 16 // ~60fps for smooth VR experience
  })

  const [vrMode, setVRMode] = useState(false)

  if (!orientation) {
    return <div>Loading VR viewer...</div>
  }

  const { device } = orientation
  const alpha = device.alpha || 0
  const beta = device.beta || 0
  const gamma = device.gamma || 0

  return (
    <div className={`${vrMode ? 'fixed inset-0 bg-black' : 'p-6'}`}>
      {!vrMode ? (
        <div>
          <h2 className="text-xl font-bold mb-4">VR Orientation Viewer</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-blue-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Compass (Z-axis)</h3>
                <div className="text-center">
                  <div 
                    className="inline-block text-4xl transition-transform duration-100"
                    style={{ transform: `rotate(${alpha}deg)` }}
                  >
                    🧭
                  </div>
                  <p className="text-lg font-mono">{alpha.toFixed(1)}°</p>
                </div>
              </div>

              <div className="bg-green-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Tilt Forward/Back (X-axis)</h3>
                <div className="text-center">
                  <div 
                    className="inline-block text-4xl transition-transform duration-100"
                    style={{ transform: `rotateX(${beta}deg)` }}
                  >
                    📱
                  </div>
                  <p className="text-lg font-mono">{beta.toFixed(1)}°</p>
                </div>
              </div>

              <div className="bg-purple-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Tilt Left/Right (Y-axis)</h3>
                <div className="text-center">
                  <div 
                    className="inline-block text-4xl transition-transform duration-100"
                    style={{ transform: `rotateY(${gamma}deg)` }}
                  >
                    📱
                  </div>
                  <p className="text-lg font-mono">{gamma.toFixed(1)}°</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
              <div 
                className="text-white text-6xl transition-transform duration-100"
                style={{
                  transform: `rotateZ(${alpha}deg) rotateX(${beta}deg) rotateY(${gamma}deg)`
                }}
              >
                🎲
              </div>
            </div>
          </div>

          <button
            onClick={() => setVRMode(true)}
            className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            disabled={orientation.permission === 'denied'}
          >
            Enter VR Mode
          </button>

          {orientation.permission === 'denied' && (
            <p className="mt-2 text-red-600 text-sm">
              Device motion permission is required for VR mode
            </p>
          )}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-white relative">
          <button
            onClick={() => setVRMode(false)}
            className="absolute top-4 right-4 bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Exit VR
          </button>
          
          <div className="text-center">
            <div 
              className="text-9xl mb-4 transition-transform duration-100"
              style={{
                transform: `rotateZ(${alpha}deg) rotateX(${beta}deg) rotateY(${gamma}deg)`
              }}
            >
              🌍
            </div>
            <div className="space-y-2 text-lg font-mono">
              <div>α: {alpha.toFixed(1)}°</div>
              <div>β: {beta.toFixed(1)}°</div> 
              <div>γ: {gamma.toFixed(1)}°</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

## Next.js Specific Usage

### App Router Implementation

```tsx
'use client'

import { useOrentation } from 'garuda-hooks'
import { useEffect, useState } from 'react'

export default function OrientationPage() {
  const { orientation } = useOrentation({
    trackDeviceMotion: true
  })
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading orientation detector...</div>
  }

  if (!orientation) {
    return <div>Initializing orientation data...</div>
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Device Orientation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <OrientationCard
          title="Screen Orientation"
          value={`${orientation.type} (${orientation.angle}°)`}
          icon="📱"
        />
        
        <OrientationCard
          title="Screen Size"
          value={`${orientation.screen.width} × ${orientation.screen.height}`}
          icon="📏"
        />
        
        <OrientationCard
          title="Motion Permission"
          value={orientation.permission}
          icon="🔐"
        />

        {orientation.device.alpha !== null && (
          <>
            <OrientationCard
              title="Compass (α)"
              value={`${orientation.device.alpha.toFixed(1)}°`}
              icon="🧭"
            />
            
            <OrientationCard
              title="Tilt Forward/Back (β)"
              value={`${orientation.device.beta?.toFixed(1) || 0}°`}
              icon="⬆️"
            />
            
            <OrientationCard
              title="Tilt Left/Right (γ)"
              value={`${orientation.device.gamma?.toFixed(1) || 0}°`}
              icon="↔️"
            />
          </>
        )}
      </div>
    </div>
  )
}

function OrientationCard({ title, value, icon }: {
  title: string
  value: string
  icon: string
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-semibold text-gray-700">{title}</h3>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}
```

### SSR-Safe Implementation

```tsx
'use client'

import { useOrentation } from 'garuda-hooks'
import { useEffect, useState } from 'react'

function SSRSafeOrientation() {
  const { orientation } = useOrentation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Server-safe fallback
    return (
      <div className="p-4">
        <h2>Device Orientation</h2>
        <p>Detecting orientation...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2>Device Orientation</h2>
      {orientation ? (
        <div>
          <p>Type: {orientation.type}</p>
          <p>Angle: {orientation.angle}°</p>
        </div>
      ) : (
        <p>Loading orientation data...</p>
      )}
    </div>
  )
}
```

## Advanced Patterns

### Gesture Recognition

```tsx
function GestureRecognition() {
  const { orientation } = useOrentation({
    trackDeviceMotion: true,
    debounce: 50
  })
  
  const [gesture, setGesture] = useState<string | null>(null)
  const [gestureHistory, setGestureHistory] = useState<Array<{
    gesture: string
    timestamp: Date
  }>>([])

  useEffect(() => {
    if (!orientation?.device) return

    const { beta, gamma } = orientation.device
    if (beta === null || gamma === null) return

    let detectedGesture = null

    // Simple gesture detection
    if (Math.abs(beta) > 30) {
      detectedGesture = beta > 0 ? 'Tilt Forward' : 'Tilt Back'
    } else if (Math.abs(gamma) > 30) {
      detectedGesture = gamma > 0 ? 'Tilt Right' : 'Tilt Left'
    } else {
      detectedGesture = 'Stable'
    }

    if (detectedGesture !== gesture) {
      setGesture(detectedGesture)
      
      if (detectedGesture !== 'Stable') {
        setGestureHistory(prev => [
          { gesture: detectedGesture, timestamp: new Date() },
          ...prev.slice(0, 9) // Keep last 10 gestures
        ])
      }
    }
  }, [orientation?.device.beta, orientation?.device.gamma, gesture])

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Gesture Recognition</h2>
      
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">
          {gesture === 'Tilt Forward' && '⬆️'}
          {gesture === 'Tilt Back' && '⬇️'}
          {gesture === 'Tilt Left' && '⬅️'}
          {gesture === 'Tilt Right' && '➡️'}
          {gesture === 'Stable' && '⚪'}
        </div>
        <p className="text-2xl font-semibold">{gesture}</p>
      </div>

      <div className="bg-gray-50 p-4 rounded">
        <h3 className="font-semibold mb-2">Recent Gestures</h3>
        {gestureHistory.length === 0 ? (
          <p className="text-gray-500">Tilt your device to see gestures</p>
        ) : (
          <div className="space-y-1">
            {gestureHistory.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.gesture}</span>
                <span className="text-gray-500">
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Permission Handling

```tsx
function PermissionAwareOrientation() {
  const { orientation } = useOrentation({
    trackDeviceMotion: true
  })

  const handlePermissionRequest = () => {
    if (orientation?.permission === 'prompt') {
      // The hook will automatically request permission
      // when trackDeviceMotion is enabled
      alert('Please allow motion access when prompted')
    } else if (orientation?.permission === 'denied') {
      alert('Motion access was denied. Please enable it in browser settings.')
    }
  }

  return (
    <div>
      {orientation?.permission === 'prompt' && (
        <button onClick={handlePermissionRequest}>
          Enable Motion Tracking
        </button>
      )}
    </div>
  )
}
```

### 2. Performance Optimization

```tsx
function OptimizedOrientation() {
  const { orientation } = useOrentation({
    debounce: 200, // Reduce update frequency
    idleAware: true // Pause when user is idle
  })

  // Memoize expensive calculations
  const layoutClass = useMemo(() => {
    if (!orientation) return 'portrait'
    return orientation.type === 'landscape' ? 'landscape' : 'portrait'
  }, [orientation?.type])

  return (
    <div className={`layout-${layoutClass}`}>
      {/* Component content */}
    </div>
  )
}
```

### 3. Error Handling

```tsx
function RobustOrientation() {
  const { orientation } = useOrentation({
    trackDeviceMotion: true
  })
  
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orientation) return

    if (!orientation.supported.screenOrientation && !orientation.supported.deviceOrientation) {
      setError('Orientation detection is not supported on this device')
    } else if (orientation.permission === 'denied') {
      setError('Motion permission was denied')
    } else {
      setError(null)
    }
  }, [orientation])

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="font-semibold text-red-800">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div>
      {orientation && (
        <p>Orientation: {orientation.type}</p>
      )}
    </div>
  )
}
```

## Common Use Cases

### Screen Rotation Lock

```tsx
function ScreenLockToggle() {
  const { orientation } = useOrentation()
  const [locked, setLocked] = useState(false)

  const toggleLock = async () => {
    try {
      if (locked) {
        await screen.orientation.unlock()
        setLocked(false)
      } else {
        await screen.orientation.lock(orientation?.type || 'portrait-primary')
        setLocked(true)
      }
    } catch (error) {
      console.error('Screen lock failed:', error)
    }
  }

  return (
    <div className="p-4">
      <button
        onClick={toggleLock}
        className={`px-4 py-2 rounded ${
          locked ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        {locked ? '🔒 Unlock Rotation' : '🔓 Lock Rotation'}
      </button>
    </div>
  )
}
```

### Horizon Level Tool

```tsx
function HorizonLevel() {
  const { orientation } = useOrentation({
    trackDeviceMotion: true,
    debounce: 50
  })

  if (!orientation?.device.beta || !orientation?.device.gamma) {
    return (
      <div className="p-6 text-center">
        <p>Device motion not available</p>
      </div>
    )
  }

  const { beta, gamma } = orientation.device
  const isLevel = Math.abs(beta) < 2 && Math.abs(gamma) < 2

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold mb-6">Digital Level</h2>
      
      <div className={`w-48 h-48 mx-auto rounded-full border-4 relative ${
        isLevel ? 'border-green-500' : 'border-gray-300'
      }`}>
        {/* Bubble */}
        <div
          className={`absolute w-6 h-6 rounded-full transition-all duration-100 ${
            isLevel ? 'bg-green-500' : 'bg-red-500'
          }`}
          style={{
            left: `calc(50% + ${gamma * 2}px)`,
            top: `calc(50% + ${beta * 2}px)`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* Center mark */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-black rounded-full transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="mt-6 space-y-2">
        <div className={`text-2xl font-bold ${isLevel ? 'text-green-600' : 'text-red-600'}`}>
          {isLevel ? '✅ LEVEL' : '❌ NOT LEVEL'}
        </div>
        <div className="text-sm text-gray-600">
          X: {gamma.toFixed(1)}° | Y: {beta.toFixed(1)}°
        </div>
      </div>
    </div>
  )
}
```

## Troubleshooting

### iOS Permission Issues

```tsx
function iOSPermissionHandler() {
  const { orientation } = useOrentation({
    trackDeviceMotion: true
  })

  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)
  }, [])

  if (isIOS && orientation?.permission === 'prompt') {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold">iOS Motion Permission</h3>
        <p className="text-sm mt-1">
          On iOS 13+, you need to grant permission for motion data.
          The permission dialog will appear automatically when needed.
        </p>
      </div>
    )
  }

  return <div>{/* Normal content */}</div>
}
```

### Debouncing Issues

```tsx
function CustomDebouncedOrientation() {
  const { orientation } = useOrentation({
    debounce: 100 // Adjust based on your needs
  })

  // Additional debouncing for specific values
  const [stableAngle, setStableAngle] = useState(0)

  useEffect(() => {
    if (!orientation?.angle) return

    const timer = setTimeout(() => {
      setStableAngle(orientation.angle)
    }, 500) // Wait 500ms for angle to stabilize

    return () => clearTimeout(timer)
  }, [orientation?.angle])

  return (
    <div>
      <p>Current angle: {orientation?.angle}°</p>
      <p>Stable angle: {stableAngle}°</p>
    </div>
  )
}
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create documentation for useGeolocation hook", "status": "completed"}, {"content": "Create documentation for useIdle hook", "status": "completed"}, {"content": "Create documentation for useMediaQuery hook", "status": "completed"}, {"content": "Create documentation for useNetwork hook", "status": "completed"}, {"content": "Create documentation for useOrientation hook", "status": "completed"}]