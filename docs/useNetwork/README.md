# useNetwork

A comprehensive hook for monitoring network connectivity, connection quality, and data usage patterns with real-time updates.

## Features

- 🌐 **Connection Status**: Online/offline detection with event handling
- 📊 **Connection Quality**: Bandwidth estimation and effective connection type
- 💾 **Data Saver Mode**: Detect data saving preferences
- 📈 **Round Trip Time**: Network latency monitoring
- 🔔 **Quality Events**: Custom events for connection changes
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks

## API Reference

```typescript
interface UseNetworkResult<T> {
  isOnline: boolean
  downlink: T | null
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  saveData: boolean
  rtt: T | null
  isSlowConnection?: () => boolean
  connectionQuality?: () => string
}

function useNetwork<T>(): UseNetworkResult<T>
```

## Usage Examples

### Basic Network Status

```tsx
import { useNetwork } from 'garuda-hooks'

function NetworkStatusIndicator() {
  const { isOnline, effectiveType, downlink, rtt, saveData } = useNetwork()

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Network Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
          <h3 className="font-semibold">Connection Status</h3>
          <div className="flex items-center space-x-2 mt-2">
            <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        <div className="p-4 bg-blue-100 rounded-lg">
          <h3 className="font-semibold">Connection Type</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {effectiveType.toUpperCase()}
          </p>
        </div>

        <div className="p-4 bg-purple-100 rounded-lg">
          <h3 className="font-semibold">Speed</h3>
          <p className="text-lg font-semibold mt-2">
            {downlink ? `${downlink} Mbps` : 'Unknown'}
          </p>
        </div>

        <div className="p-4 bg-yellow-100 rounded-lg">
          <h3 className="font-semibold">Latency</h3>
          <p className="text-lg font-semibold mt-2">
            {rtt ? `${rtt}ms` : 'Unknown'}
          </p>
        </div>

        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold">Data Saver</h3>
          <p className="text-lg font-semibold mt-2">
            {saveData ? '✅ Enabled' : '❌ Disabled'}
          </p>
        </div>
      </div>
    </div>
  )
}
```

### Adaptive Content Loading

```tsx
function AdaptiveContentLoader() {
  const { isOnline, effectiveType, isSlowConnection, connectionQuality } = useNetwork()
  const [content, setContent] = useState<'low' | 'medium' | 'high'>('medium')

  useEffect(() => {
    if (!isOnline) {
      setContent('low')
      return
    }

    const quality = connectionQuality?.()
    
    switch (quality) {
      case 'poor':
        setContent('low')
        break
      case 'good':
        setContent('medium')
        break
      case 'excellent':
        setContent('high')
        break
      default:
        setContent('medium')
    }
  }, [isOnline, effectiveType, connectionQuality])

  const getImageQuality = () => {
    switch (content) {
      case 'low': return 'thumbnail'
      case 'medium': return 'medium'
      case 'high': return 'full'
    }
  }

  const getVideoQuality = () => {
    switch (content) {
      case 'low': return '360p'
      case 'medium': return '720p' 
      case 'high': return '1080p'
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Adaptive Content Loading</h2>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Current Quality Setting:</span>
          <span className={`px-3 py-1 rounded ${
            content === 'high' ? 'bg-green-100 text-green-800' :
            content === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {content.toUpperCase()}
          </span>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>Connection: {effectiveType.toUpperCase()}</p>
          <p>Quality: {connectionQuality?.()}</p>
          {isSlowConnection?.() && (
            <p className="text-orange-600 font-medium">⚠️ Slow connection detected</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-3">Image Gallery</h3>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500">
                  Image {i} ({getImageQuality()})
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Loading {getImageQuality()} quality images based on connection
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-3">Video Player</h3>
          <div className="aspect-video bg-gray-900 rounded flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-2xl mb-2">▶️</div>
              <div className="text-sm">Video Quality: {getVideoQuality()}</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Streaming at {getVideoQuality()} based on network conditions
          </p>
        </div>
      </div>

      {!isOnline && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800">Offline Mode</h3>
          <p className="text-red-700 text-sm">
            You're currently offline. Showing cached content only.
          </p>
        </div>
      )}
    </div>
  )
}
```

### Download Manager with Network Awareness

```tsx
interface Download {
  id: string
  name: string
  size: number // in MB
  progress: number
  status: 'waiting' | 'downloading' | 'paused' | 'completed' | 'error'
}

function NetworkAwareDownloadManager() {
  const { isOnline, effectiveType, saveData, isSlowConnection } = useNetwork()
  const [downloads, setDownloads] = useState<Download[]>([
    { id: '1', name: 'Large Video.mp4', size: 500, progress: 30, status: 'downloading' },
    { id: '2', name: 'Software.zip', size: 150, progress: 0, status: 'waiting' },
    { id: '3', name: 'Photos.zip', size: 75, progress: 100, status: 'completed' }
  ])

  const [autoPause, setAutoPause] = useState(true)

  // Auto-pause downloads on slow connections or data saver mode
  useEffect(() => {
    if (autoPause && (saveData || isSlowConnection?.())) {
      setDownloads(prev => prev.map(download => 
        download.status === 'downloading' 
          ? { ...download, status: 'paused' as const }
          : download
      ))
    }
  }, [saveData, isSlowConnection, autoPause])

  // Pause all downloads when offline
  useEffect(() => {
    if (!isOnline) {
      setDownloads(prev => prev.map(download => 
        download.status === 'downloading' 
          ? { ...download, status: 'paused' as const }
          : download
      ))
    }
  }, [isOnline])

  const startDownload = (id: string) => {
    if (!isOnline) {
      alert('Cannot start download - you are offline')
      return
    }

    if (saveData && !confirm('Data saver is enabled. Continue download?')) {
      return
    }

    setDownloads(prev => prev.map(download =>
      download.id === id 
        ? { ...download, status: 'downloading' as const }
        : download
    ))
  }

  const pauseDownload = (id: string) => {
    setDownloads(prev => prev.map(download =>
      download.id === id 
        ? { ...download, status: 'paused' as const }
        : download
    ))
  }

  const getStatusColor = (status: Download['status']) => {
    switch (status) {
      case 'downloading': return 'text-blue-600'
      case 'completed': return 'text-green-600'
      case 'paused': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getEstimatedTime = (remaining: number, speed: number) => {
    const timeMinutes = Math.ceil(remaining / speed)
    return timeMinutes < 60 ? `${timeMinutes}m` : `${Math.ceil(timeMinutes / 60)}h`
  }

  const getConnectionSpeed = () => {
    switch (effectiveType) {
      case 'slow-2g': return 0.1
      case '2g': return 0.5
      case '3g': return 2
      case '4g': return 10
      default: return 5
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Smart Download Manager</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="font-semibold">Network Status: </span>
            <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
              {isOnline ? `Online (${effectiveType.toUpperCase()})` : 'Offline'}
            </span>
          </div>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoPause}
              onChange={(e) => setAutoPause(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-pause on slow connections</span>
          </label>
        </div>
        
        {saveData && (
          <div className="text-sm text-orange-600 font-medium">
            ⚠️ Data saver mode is enabled - downloads may be paused
          </div>
        )}
        
        {isSlowConnection?.() && (
          <div className="text-sm text-yellow-600 font-medium">
            🐌 Slow connection detected - large downloads may take longer
          </div>
        )}
      </div>

      <div className="space-y-4">
        {downloads.map((download) => {
          const remaining = (download.size * (100 - download.progress)) / 100
          const estimatedTime = getEstimatedTime(remaining, getConnectionSpeed())

          return (
            <div key={download.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{download.name}</h3>
                <span className={`text-sm font-medium ${getStatusColor(download.status)}`}>
                  {download.status.toUpperCase()}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{download.progress}% of {download.size}MB</span>
                  {download.status === 'downloading' && (
                    <span>~{estimatedTime} remaining</span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      download.status === 'completed' ? 'bg-green-500' :
                      download.status === 'downloading' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${download.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                {download.status === 'waiting' || download.status === 'paused' ? (
                  <button
                    onClick={() => startDownload(download.id)}
                    disabled={!isOnline}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-400"
                  >
                    {download.status === 'waiting' ? 'Start' : 'Resume'}
                  </button>
                ) : download.status === 'downloading' ? (
                  <button
                    onClick={() => pauseDownload(download.id)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                  >
                    Pause
                  </button>
                ) : null}
                
                {download.status === 'completed' && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                    ✅ Complete
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### Real-time Connection Monitor

```tsx
function ConnectionMonitor() {
  const { isOnline, downlink, rtt, effectiveType } = useNetwork()
  const [connectionHistory, setConnectionHistory] = useState<Array<{
    timestamp: Date
    online: boolean
    speed: number | null
    latency: number | null
    type: string
  }>>([])

  // Track connection changes
  useEffect(() => {
    const newEntry = {
      timestamp: new Date(),
      online: isOnline,
      speed: downlink,
      latency: rtt,
      type: effectiveType
    }
    
    setConnectionHistory(prev => [...prev.slice(-19), newEntry]) // Keep last 20 entries
  }, [isOnline, downlink, rtt, effectiveType])

  useEffect(() => {
    // Listen for custom network quality change events
    const handleQualityChange = (event: CustomEvent) => {
      console.log('Network quality changed:', event.detail)
    }

    window.addEventListener('networkQualityChange', handleQualityChange as EventListener)
    return () => window.removeEventListener('networkQualityChange', handleQualityChange as EventListener)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getQualityColor = (type: string) => {
    switch (type) {
      case 'slow-2g': case '2g': return 'text-red-500'
      case '3g': return 'text-yellow-500'
      case '4g': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Real-time Connection Monitor</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className={`text-3xl mb-2 ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
            {isOnline ? '🟢' : '🔴'}
          </div>
          <div className="text-sm text-gray-600">Status</div>
          <div className="font-semibold">{isOnline ? 'Online' : 'Offline'}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl mb-2">📶</div>
          <div className="text-sm text-gray-600">Speed</div>
          <div className="font-semibold">{downlink ? `${downlink} Mbps` : 'Unknown'}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl mb-2">⚡</div>
          <div className="text-sm text-gray-600">Latency</div>
          <div className="font-semibold">{rtt ? `${rtt}ms` : 'Unknown'}</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl mb-2">🌐</div>
          <div className="text-sm text-gray-600">Type</div>
          <div className={`font-semibold ${getQualityColor(effectiveType)}`}>
            {effectiveType.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Connection History</h3>
        </div>
        
        <div className="p-4">
          {connectionHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No connection data yet...</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {connectionHistory.slice().reverse().map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-600">{formatTime(entry.timestamp)}</span>
                  
                  <div className="flex items-center space-x-4">
                    <span className={entry.online ? 'text-green-600' : 'text-red-600'}>
                      {entry.online ? 'Online' : 'Offline'}
                    </span>
                    
                    <span className={getQualityColor(entry.type)}>
                      {entry.type.toUpperCase()}
                    </span>
                    
                    <span className="text-gray-600">
                      {entry.speed ? `${entry.speed}Mbps` : 'N/A'}
                    </span>
                    
                    <span className="text-gray-600">
                      {entry.latency ? `${entry.latency}ms` : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

## Next.js Specific Usage

### App Router Implementation

```tsx
'use client'

import { useNetwork } from 'garuda-hooks'
import { useEffect, useState } from 'react'

export default function NetworkStatusPage() {
  const network = useNetwork()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading network status...</div>
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Network Status Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NetworkCard
          title="Connection"
          value={network.isOnline ? 'Online' : 'Offline'}
          status={network.isOnline ? 'good' : 'bad'}
        />
        
        <NetworkCard
          title="Speed"
          value={network.downlink ? `${network.downlink} Mbps` : 'Unknown'}
          status="neutral"
        />
        
        <NetworkCard
          title="Latency"
          value={network.rtt ? `${network.rtt}ms` : 'Unknown'}
          status="neutral"
        />
      </div>
    </div>
  )
}

function NetworkCard({ title, value, status }: {
  title: string
  value: string
  status: 'good' | 'bad' | 'neutral'
}) {
  const bgColor = {
    good: 'bg-green-100 border-green-500',
    bad: 'bg-red-100 border-red-500',
    neutral: 'bg-blue-100 border-blue-500'
  }[status]

  return (
    <div className={`p-4 rounded-lg border-l-4 ${bgColor}`}>
      <h3 className="font-semibold text-gray-700">{title}</h3>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  )
}
```

### API Integration for Network Logging

```tsx
// app/api/network-log/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { userId, networkData, timestamp } = await request.json()
  
  // Log network information for analytics
  await logNetworkData(userId, networkData, timestamp)
  
  return NextResponse.json({ success: true })
}

// Component using the API
function NetworkLogger() {
  const network = useNetwork()
  const [userId] = useState('user123') // Get from auth context

  useEffect(() => {
    // Log significant network changes
    const logData = async () => {
      try {
        await fetch('/api/network-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            networkData: {
              isOnline: network.isOnline,
              effectiveType: network.effectiveType,
              downlink: network.downlink,
              rtt: network.rtt,
              saveData: network.saveData
            },
            timestamp: Date.now()
          })
        })
      } catch (error) {
        console.error('Failed to log network data:', error)
      }
    }

    logData()
  }, [network.isOnline, network.effectiveType, userId])

  return (
    <div>
      <p>Network data is being logged for analytics</p>
    </div>
  )
}
```

## Advanced Patterns

### Network-Aware Image Component

```tsx
interface NetworkImageProps {
  src: string
  alt: string
  highQualitySrc?: string
  lowQualitySrc?: string
  className?: string
}

function NetworkAwareImage({ 
  src, 
  alt, 
  highQualitySrc, 
  lowQualitySrc, 
  className 
}: NetworkImageProps) {
  const { effectiveType, saveData, isSlowConnection } = useNetwork()
  const [imageSrc, setImageSrc] = useState(src)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const shouldUseHighQuality = 
      !saveData && 
      !isSlowConnection?.() && 
      (effectiveType === '4g' || effectiveType === '3g')

    if (shouldUseHighQuality && highQualitySrc) {
      setImageSrc(highQualitySrc)
    } else if (isSlowConnection?.() || saveData) {
      setImageSrc(lowQualitySrc || src)
    } else {
      setImageSrc(src)
    }
  }, [effectiveType, saveData, isSlowConnection, src, highQualitySrc, lowQualitySrc])

  return (
    <div className="relative">
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
      
      {loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      {saveData && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          Data Saver
        </div>
      )}
    </div>
  )
}
```

### Offline-First Data Sync

```tsx
function OfflineDataManager() {
  const { isOnline } = useNetwork()
  const [pendingSync, setPendingSync] = useState<any[]>([])
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Queue actions when offline
  const queueAction = useCallback((action: any) => {
    setPendingSync(prev => [...prev, { ...action, timestamp: Date.now() }])
    
    // Store in localStorage for persistence
    const stored = localStorage.getItem('pendingSync') || '[]'
    const actions = JSON.parse(stored)
    localStorage.setItem('pendingSync', JSON.stringify([...actions, action]))
  }, [])

  // Sync when coming online
  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      const syncActions = async () => {
        try {
          for (const action of pendingSync) {
            await syncAction(action)
          }
          setPendingSync([])
          localStorage.removeItem('pendingSync')
          setLastSyncTime(new Date())
        } catch (error) {
          console.error('Sync failed:', error)
        }
      }
      
      syncActions()
    }
  }, [isOnline, pendingSync])

  const syncAction = async (action: any) => {
    // Implement your sync logic here
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action)
    })
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Data Sync Status</h3>
        <div className={`px-2 py-1 rounded text-sm ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
      
      {pendingSync.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
          <p className="text-sm">
            📊 {pendingSync.length} action(s) pending sync
          </p>
        </div>
      )}
      
      {lastSyncTime && (
        <p className="text-sm text-gray-600">
          Last sync: {lastSyncTime.toLocaleString()}
        </p>
      )}
    </div>
  )
}
```

## Best Practices

### 1. Performance Optimization

```tsx
function OptimizedNetworkComponent() {
  const network = useNetwork()
  
  // Debounce rapid network changes
  const [stableNetwork, setStableNetwork] = useState(network)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setStableNetwork(network)
    }, 1000) // Wait 1 second for stability
    
    return () => clearTimeout(timer)
  }, [network.isOnline, network.effectiveType])

  return (
    <div>
      <p>Stable network status: {stableNetwork.isOnline ? 'Online' : 'Offline'}</p>
    </div>
  )
}
```

### 2. User Experience

```tsx
function UserFriendlyNetworkIndicator() {
  const { isOnline, isSlowConnection } = useNetwork()
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true)
    } else {
      // Hide message after coming back online
      const timer = setTimeout(() => setShowOfflineMessage(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  return (
    <>
      {showOfflineMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {isOnline ? '✅ Back online!' : '📡 You are offline'}
        </div>
      )}
      
      {isSlowConnection?.() && isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
          🐌 Slow connection detected. Some features may be limited.
        </div>
      )}
    </>
  )
}
```

## Common Use Cases

### Video Streaming Quality

```tsx
function AdaptiveVideoPlayer() {
  const { effectiveType, saveData } = useNetwork()
  const [quality, setQuality] = useState<'auto' | '360p' | '720p' | '1080p'>('auto')

  useEffect(() => {
    if (quality === 'auto') {
      if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
        setQuality('360p')
      } else if (effectiveType === '3g') {
        setQuality('720p')
      } else {
        setQuality('1080p')
      }
    }
  }, [effectiveType, saveData, quality])

  return (
    <div className="p-4">
      <div className="aspect-video bg-black rounded mb-4 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-2">▶️</div>
          <div>Playing at {quality}</div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        {(['auto', '360p', '720p', '1080p'] as const).map(q => (
          <button
            key={q}
            onClick={() => setQuality(q)}
            className={`px-3 py-1 rounded text-sm ${
              quality === q ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
```

## Troubleshooting

### Network Information Not Available

```tsx
function NetworkFallback() {
  const { isOnline, downlink, rtt } = useNetwork()
  const [hasNetworkInfo, setHasNetworkInfo] = useState(true)

  useEffect(() => {
    // Check if network information is available
    if (typeof navigator !== 'undefined' && !('connection' in navigator)) {
      setHasNetworkInfo(false)
    }
  }, [])

  if (!hasNetworkInfo) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold">Limited Network Information</h3>
        <p className="text-sm">
          Your browser doesn't support detailed network information.
          Only online/offline status is available.
        </p>
        <p className="mt-2">Status: {isOnline ? 'Online' : 'Offline'}</p>
      </div>
    )
  }

  return (
    <div>
      <p>Speed: {downlink || 'Unknown'}</p>
      <p>Latency: {rtt || 'Unknown'}</p>
    </div>
  )
}
```

### Polling for Connection Changes

```tsx
function NetworkPolling() {
  const network = useNetwork()
  const [lastChecked, setLastChecked] = useState(Date.now())

  useEffect(() => {
    // Fallback polling for browsers with limited event support
    const interval = setInterval(() => {
      setLastChecked(Date.now())
      // The network hook handles the actual checking
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <p>Network status: {network.isOnline ? 'Online' : 'Offline'}</p>
      <p className="text-xs text-gray-500">
        Last checked: {new Date(lastChecked).toLocaleTimeString()}
      </p>
    </div>
  )
}
```