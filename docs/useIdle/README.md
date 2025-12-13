# useIdle

A robust hook for detecting user idle state with configurable timeout and manual control options.

## Features

- ⏱️ **Idle Detection**: Automatically detects user inactivity after 3 minutes
- 🎮 **Manual Control**: Pause, resume, and reset idle tracking
- 👂 **Multi-Event Tracking**: Monitors mouse, keyboard, and touch events
- 📊 **Detailed State**: Provides idle status, last activity time, and elapsed idle time
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- 🧹 **Auto Cleanup**: Automatic event listener and timer cleanup

## API Reference

```typescript
interface UseIdle {
  isIdle: boolean
  lastActivity: number
  idleTime: number
  reset?: () => void
  pause?: () => void
  resume?: () => void
}

function useIdle(): UseIdle
```

## Usage Examples

### Basic Idle Detection

```tsx
import { useIdle } from 'garuda-hooks'

function BasicIdleExample() {
  const { isIdle, lastActivity, idleTime } = useIdle()

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`
  }

  return (
    <div className="p-6">
      <h2>User Activity Monitor</h2>
      
      <div className="mb-4 p-4 rounded-lg bg-gray-100">
        <div className={`text-lg font-semibold mb-2 ${isIdle ? 'text-red-600' : 'text-green-600'}`}>
          Status: {isIdle ? '😴 User is Idle' : '👋 User is Active'}
        </div>
        
        <div className="space-y-1 text-sm">
          <p><strong>Last Activity:</strong> {formatTime(lastActivity)}</p>
          <p><strong>Idle Time:</strong> {formatDuration(idleTime)}</p>
          <p><strong>Threshold:</strong> 3 minutes</p>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p>Move your mouse, press any key, or click to reset the idle timer.</p>
        <p>You'll be marked as idle after 3 minutes of inactivity.</p>
      </div>
    </div>
  )
}
```

### Session Management with Auto-Save

```tsx
function AutoSaveEditor() {
  const { isIdle, reset } = useIdle()
  const [content, setContent] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)

  // Auto-save when user becomes idle
  useEffect(() => {
    if (isIdle && content.trim() && !saving) {
      handleAutoSave()
    }
  }, [isIdle, content, saving])

  const handleAutoSave = async () => {
    setSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      await saveContent(content)
      setLastSaved(new Date())
      reset() // Reset idle timer after save
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveContent = async (text: string) => {
    // Simulate saving to API
    console.log('Saving content:', text.substring(0, 50) + '...')
  }

  return (
    <div className="p-6">
      <h2>Auto-Save Text Editor</h2>
      
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className={`px-2 py-1 rounded text-sm ${isIdle ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
            {isIdle ? 'Idle' : 'Active'}
          </span>
          
          {saving && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              💾 Auto-saving...
            </span>
          )}
        </div>

        {lastSaved && (
          <span className="text-sm text-gray-600">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-64 p-4 border rounded-lg resize-none"
        placeholder="Start typing... Your work will be automatically saved when you become idle."
      />

      <div className="mt-2 text-xs text-gray-500">
        <p>• Auto-save triggers after 3 minutes of inactivity</p>
        <p>• Type, move mouse, or click to stay active</p>
      </div>
    </div>
  )
}
```

### Session Timeout Warning

```tsx
function SessionTimeoutManager() {
  const { isIdle, idleTime, reset } = useIdle()
  const [showWarning, setShowWarning] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Show warning at 2.5 minutes, expire at 5 minutes of total idle time
  useEffect(() => {
    const warningTime = 150000 // 2.5 minutes
    const expireTime = 300000  // 5 minutes

    if (idleTime >= expireTime) {
      setSessionExpired(true)
      setShowWarning(false)
    } else if (idleTime >= warningTime && isIdle) {
      setShowWarning(true)
    } else {
      setShowWarning(false)
    }
  }, [isIdle, idleTime])

  const extendSession = () => {
    reset()
    setShowWarning(false)
    setSessionExpired(false)
  }

  const logout = () => {
    // Handle logout logic
    console.log('Logging out due to inactivity')
    setSessionExpired(true)
  }

  if (sessionExpired) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Session Expired</h2>
          <p className="text-gray-700 mb-6">
            Your session has expired due to inactivity. Please log in again to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Log In Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2>Active User Session</h2>
      
      <div className="mb-4 p-4 bg-green-100 rounded">
        <p className="text-green-800">
          ✅ You are logged in and active
        </p>
        <p className="text-sm text-green-600 mt-1">
          Idle time: {Math.floor(idleTime / 1000)}s
        </p>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <p>• Session will show a warning after 2.5 minutes of inactivity</p>
        <p>• Session will expire after 5 minutes of inactivity</p>
        <p>• Move your mouse or press any key to stay active</p>
      </div>

      {showWarning && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded shadow-lg max-w-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-yellow-500 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Session Timeout Warning
              </h3>
              <p className="mt-1 text-xs text-yellow-700">
                Your session will expire in {Math.floor((300000 - idleTime) / 1000)} seconds due to inactivity.
              </p>
              <div className="mt-3 space-x-2">
                <button
                  onClick={extendSession}
                  className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                >
                  Stay Logged In
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                >
                  Log Out Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Gaming Idle Detection

```tsx
function GameIdleManager() {
  const { isIdle, idleTime, pause, resume, reset } = useIdle()
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'idle'>('playing')
  const [score, setScore] = useState(0)

  // Auto-pause game when user is idle
  useEffect(() => {
    if (isIdle && gameState === 'playing') {
      setGameState('idle')
      console.log('Game auto-paused due to inactivity')
    }
  }, [isIdle, gameState])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    reset()
    resume() // Resume idle tracking
  }

  const pauseGame = () => {
    setGameState('paused')
    pause() // Pause idle tracking while game is paused
  }

  const resumeGame = () => {
    setGameState('playing')
    reset() // Reset idle timer
    resume() // Resume idle tracking
  }

  const formatIdleTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return seconds > 0 ? `${seconds}s` : '0s'
  }

  // Simulate score increment
  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        setScore(prev => prev + 10)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameState])

  return (
    <div className="p-6">
      <h2>Idle-Aware Game</h2>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <div className="flex justify-between items-center mb-2">
          <span className="text-2xl font-bold">Score: {score}</span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            gameState === 'playing' ? 'bg-green-100 text-green-800' :
            gameState === 'paused' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {gameState.toUpperCase()}
          </span>
        </div>
        
        {gameState === 'playing' && (
          <div className="text-sm text-gray-600">
            Idle time: {formatIdleTime(idleTime)}
          </div>
        )}
      </div>

      <div className="space-x-2 mb-4">
        {gameState === 'playing' ? (
          <button
            onClick={pauseGame}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            ⏸️ Pause Game
          </button>
        ) : gameState === 'paused' ? (
          <button
            onClick={resumeGame}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            ▶️ Resume Game
          </button>
        ) : (
          <button
            onClick={resumeGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ▶️ Continue Playing
          </button>
        )}

        <button
          onClick={startGame}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          🔄 New Game
        </button>
      </div>

      {gameState === 'idle' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800 mb-2">Game Auto-Paused</h3>
          <p className="text-blue-700 text-sm">
            The game has been automatically paused due to inactivity. 
            Click "Continue Playing" or interact with the game to resume.
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>• Game auto-pauses after 3 minutes of inactivity</p>
        <p>• Manual pause stops idle detection</p>
        <p>• Move mouse or press keys to stay active</p>
      </div>
    </div>
  )
}
```

## Next.js Specific Usage

### App Router Implementation

```tsx
'use client'

import { useIdle } from 'garuda-hooks'
import { useEffect, useState } from 'react'

export default function IdleMonitorPage() {
  const { isIdle, lastActivity, idleTime, reset } = useIdle()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading idle monitor...</div>
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Next.js Idle Detection</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Idle Status</h3>
          <div className={`text-2xl ${isIdle ? 'text-red-500' : 'text-green-500'}`}>
            {isIdle ? '😴' : '👋'}
          </div>
          <p className="text-sm text-gray-600">
            {isIdle ? 'User is idle' : 'User is active'}
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Last Activity</h3>
          <p className="text-lg">
            {new Date(lastActivity).toLocaleTimeString()}
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Idle Duration</h3>
          <p className="text-lg">
            {Math.floor(idleTime / 1000)}s
          </p>
        </div>
      </div>

      <button
        onClick={reset}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Reset Idle Timer
      </button>
    </div>
  )
}
```

### API Route for Activity Logging

```tsx
// app/api/activity/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { userId, activity, timestamp } = await request.json()
  
  // Log user activity
  await logUserActivity(userId, activity, timestamp)
  
  return NextResponse.json({ success: true })
}

// Component using the API
function ActivityLogger() {
  const { isIdle, lastActivity } = useIdle()
  const [userId] = useState('user123') // Get from auth context

  useEffect(() => {
    // Log when user becomes active again
    if (!isIdle) {
      fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          activity: 'became_active',
          timestamp: Date.now()
        })
      })
    }
  }, [isIdle, userId])

  return (
    <div>
      <p>Activity is being logged to the server</p>
    </div>
  )
}
```

## Advanced Patterns

### Idle with Local Storage Persistence

```tsx
function PersistentIdleTracker() {
  const { isIdle, lastActivity, reset } = useIdle()
  
  useEffect(() => {
    // Store activity timestamp
    localStorage.setItem('lastActivity', lastActivity.toString())
  }, [lastActivity])

  useEffect(() => {
    // Check if user was idle when they left
    const storedLastActivity = localStorage.getItem('lastActivity')
    if (storedLastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(storedLastActivity)
      if (timeSinceLastActivity > 180000) { // 3 minutes
        console.log('User was away for', Math.floor(timeSinceLastActivity / 1000), 'seconds')
        // Handle returning user logic
      }
    }
  }, [])

  return (
    <div>
      <p>Idle state persists across page reloads</p>
    </div>
  )
}
```

### Idle with Context

```tsx
const IdleContext = createContext<{
  isIdle: boolean
  resetIdle: () => void
}>({
  isIdle: false,
  resetIdle: () => {}
})

function IdleProvider({ children }: { children: React.ReactNode }) {
  const { isIdle, reset } = useIdle()

  return (
    <IdleContext.Provider value={{ isIdle, resetIdle: reset }}>
      {children}
    </IdleContext.Provider>
  )
}

function useIdleContext() {
  const context = useContext(IdleContext)
  if (!context) {
    throw new Error('useIdleContext must be used within IdleProvider')
  }
  return context
}

// Usage in any component
function SomeComponent() {
  const { isIdle, resetIdle } = useIdleContext()
  
  return (
    <div>
      {isIdle && (
        <button onClick={resetIdle}>
          Wake Up!
        </button>
      )}
    </div>
  )
}
```

## Best Practices

### 1. Performance Optimization

```tsx
function OptimizedIdleComponent() {
  const { isIdle, idleTime } = useIdle()
  
  // Only update UI every 5 seconds to reduce re-renders
  const [displayTime, setDisplayTime] = useState(idleTime)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayTime(idleTime)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [idleTime])

  return (
    <div>
      <p>Idle for: {Math.floor(displayTime / 1000)}s</p>
    </div>
  )
}
```

### 2. Accessibility Considerations

```tsx
function AccessibleIdleIndicator() {
  const { isIdle, reset } = useIdle()
  
  useEffect(() => {
    // Announce idle state to screen readers
    const announcement = isIdle 
      ? 'User session is now idle'
      : 'User session is active'
    
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.textContent = announcement
    
    document.body.appendChild(announcer)
    
    const timer = setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
    
    return () => {
      clearTimeout(timer)
      if (document.body.contains(announcer)) {
        document.body.removeChild(announcer)
      }
    }
  }, [isIdle])

  return (
    <div>
      <button 
        onClick={reset}
        aria-label={`Reset idle timer. Currently ${isIdle ? 'idle' : 'active'}`}
      >
        Reset Timer
      </button>
    </div>
  )
}
```

## Common Use Cases

### Chat Application

```tsx
function ChatIdleIndicator() {
  const { isIdle } = useIdle()
  const [status, setStatus] = useState<'online' | 'away'>('online')

  useEffect(() => {
    const newStatus = isIdle ? 'away' : 'online'
    if (newStatus !== status) {
      setStatus(newStatus)
      // Send status update to chat server
      updateUserStatus(newStatus)
    }
  }, [isIdle, status])

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${status === 'online' ? 'bg-green-400' : 'bg-yellow-400'}`} />
      <span className="text-sm">{status}</span>
    </div>
  )
}
```

### Dashboard Auto-Refresh

```tsx
function AutoRefreshDashboard() {
  const { isIdle } = useIdle()
  const [data, setData] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  useEffect(() => {
    // Only auto-refresh when user is not idle
    if (!isIdle) {
      const interval = setInterval(async () => {
        const newData = await fetchDashboardData()
        setData(newData)
        setLastRefresh(Date.now())
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [isIdle])

  return (
    <div>
      <p>Last refresh: {new Date(lastRefresh).toLocaleTimeString()}</p>
      <p>Auto-refresh: {isIdle ? 'Paused (user idle)' : 'Active'}</p>
      {/* Dashboard content */}
    </div>
  )
}
```

## Troubleshooting

### Timer Not Working
Ensure the component is properly mounted and event listeners are attached:

```tsx
function DebuggingIdle() {
  const idle = useIdle()
  
  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3>Debug Info:</h3>
      <p>Is Idle: {idle.isIdle ? 'Yes' : 'No'}</p>
      <p>Last Activity: {new Date(idle.lastActivity).toISOString()}</p>
      <p>Idle Time: {idle.idleTime}ms</p>
      <p>Has Window: {typeof window !== 'undefined' ? 'Yes' : 'No'}</p>
    </div>
  )
}
```

### Memory Leaks
The hook automatically cleans up, but ensure you're not creating additional listeners:

```tsx
function SafeIdleUsage() {
  const { isIdle } = useIdle()
  
  // ❌ Don't add extra event listeners
  // useEffect(() => {
  //   const handler = () => console.log('activity')
  //   window.addEventListener('mousemove', handler)
  //   return () => window.removeEventListener('mousemove', handler)
  // }, [])
  
  // ✅ Just use the hook's state
  return <div>Idle: {isIdle}</div>
}
```