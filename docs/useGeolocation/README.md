# useGeolocation

A comprehensive hook for accessing device geolocation with permission management, watch mode, and TypeScript safety.

## Features

- 🌍 **GPS Tracking**: Get current position or watch position changes
- 🔐 **Permission Management**: Automatic permission state tracking
- 👀 **Watch Mode**: Continuous location monitoring
- 🔄 **Auto-start**: Optional automatic position fetching
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- 🎯 **TypeScript**: Full type safety with proper error handling

## API Reference

```typescript
interface UseGeolocationResult<T> {
  ref: RefObject<T | null>
  permissionState: PermissionStateExtended
  coords: GeolocationPosition | null
  loading: boolean
  error: GeolocationPositionError | null
  start: () => void
  stop: () => void
  refresh: () => void
  isSupported: boolean
}

type PermissionStateExtended = PermissionState | 'unavailable'
type GeolocationOptions = PositionOptions & { watch?: boolean; auto?: boolean }

function useGeolocation<T extends HTMLElement = HTMLElement>(
  options?: GeolocationOptions
): UseGeolocationResult<T>
```

## Usage Examples

### Basic Current Position

```tsx
import { useGeolocation } from 'garuda-hooks'

function BasicLocationExample() {
  const { coords, loading, error, start, isSupported, permissionState } = useGeolocation()

  if (!isSupported) {
    return <div>Geolocation is not supported in your browser</div>
  }

  return (
    <div className="p-6">
      <h2>Current Location</h2>
      
      <div className="mb-4">
        <p><strong>Permission:</strong> {permissionState}</p>
        <p><strong>Status:</strong> {loading ? 'Loading...' : 'Ready'}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error.message} (Code: {error.code})
        </div>
      )}

      {coords && (
        <div className="mb-4 p-3 bg-green-100 rounded">
          <p><strong>Latitude:</strong> {coords.coords.latitude}</p>
          <p><strong>Longitude:</strong> {coords.coords.longitude}</p>
          <p><strong>Accuracy:</strong> {coords.coords.accuracy} meters</p>
          <p><strong>Timestamp:</strong> {new Date(coords.timestamp).toLocaleString()}</p>
        </div>
      )}

      <button 
        onClick={start}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {loading ? 'Getting Location...' : 'Get My Location'}
      </button>
    </div>
  )
}
```

### Watch Mode for Live Tracking

```tsx
function LiveTrackingExample() {
  const { coords, loading, error, start, stop, permissionState } = useGeolocation({
    watch: true, // Enable watch mode
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  })

  const [tracking, setTracking] = useState(false)
  const [locationHistory, setLocationHistory] = useState<GeolocationPosition[]>([])

  useEffect(() => {
    if (coords && tracking) {
      setLocationHistory(prev => [...prev.slice(-9), coords]) // Keep last 10 locations
    }
  }, [coords, tracking])

  const startTracking = () => {
    setTracking(true)
    setLocationHistory([])
    start()
  }

  const stopTracking = () => {
    setTracking(false)
    stop()
  }

  return (
    <div className="p-6">
      <h2>Live Location Tracking</h2>
      
      <div className="mb-4">
        <p><strong>Permission:</strong> {permissionState}</p>
        <p><strong>Tracking:</strong> {tracking ? 'Active' : 'Stopped'}</p>
        <p><strong>Points Collected:</strong> {locationHistory.length}</p>
      </div>

      <div className="space-x-2 mb-4">
        <button
          onClick={startTracking}
          disabled={tracking || loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
        >
          Start Tracking
        </button>
        
        <button
          onClick={stopTracking}
          disabled={!tracking}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          Stop Tracking
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error.message}
        </div>
      )}

      {coords && tracking && (
        <div className="mb-4 p-3 bg-blue-100 rounded">
          <h3 className="font-bold">Current Position:</h3>
          <p>Lat: {coords.coords.latitude.toFixed(6)}</p>
          <p>Lng: {coords.coords.longitude.toFixed(6)}</p>
          <p>Speed: {coords.coords.speed ? `${coords.coords.speed.toFixed(2)} m/s` : 'N/A'}</p>
          <p>Heading: {coords.coords.heading ? `${coords.coords.heading.toFixed(0)}°` : 'N/A'}</p>
        </div>
      )}

      {locationHistory.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">Location History:</h3>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {locationHistory.map((pos, index) => (
              <div key={index} className="text-sm bg-gray-100 p-2 rounded">
                {new Date(pos.timestamp).toLocaleTimeString()}: 
                ({pos.coords.latitude.toFixed(4)}, {pos.coords.longitude.toFixed(4)})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

### Store Finder with Distance Calculation

```tsx
interface Store {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

function StoreFinder() {
  const { coords, loading, start, permissionState } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000
  })

  const [stores] = useState<Store[]>([
    { id: '1', name: 'Downtown Store', address: '123 Main St', lat: 40.7589, lng: -73.9851 },
    { id: '2', name: 'Mall Location', address: '456 Shopping Ave', lat: 40.7505, lng: -73.9934 },
    { id: '3', name: 'Airport Store', address: '789 Terminal Rd', lat: 40.6413, lng: -73.7781 }
  ])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const storesWithDistance = coords 
    ? stores.map(store => ({
        ...store,
        distance: calculateDistance(
          coords.coords.latitude,
          coords.coords.longitude,
          store.lat,
          store.lng
        )
      })).sort((a, b) => a.distance - b.distance)
    : stores.map(store => ({ ...store, distance: null }))

  return (
    <div className="p-6">
      <h2>Find Nearest Store</h2>
      
      <div className="mb-4">
        <p><strong>Permission:</strong> {permissionState}</p>
        {coords && (
          <p><strong>Your Location:</strong> {coords.coords.latitude.toFixed(4)}, {coords.coords.longitude.toFixed(4)}</p>
        )}
      </div>

      {!coords && (
        <button
          onClick={start}
          disabled={loading}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {loading ? 'Getting Location...' : 'Find Nearby Stores'}
        </button>
      )}

      <div className="space-y-3">
        {storesWithDistance.map((store, index) => (
          <div 
            key={store.id} 
            className={`p-4 rounded border ${index === 0 && coords ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{store.name}</h3>
                <p className="text-gray-600">{store.address}</p>
              </div>
              <div className="text-right">
                {store.distance !== null ? (
                  <p className="text-lg font-semibold text-blue-600">
                    {store.distance.toFixed(1)} km
                  </p>
                ) : (
                  <p className="text-gray-500">- km</p>
                )}
                {index === 0 && coords && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Nearest
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Auto-Start Location with Map Integration

```tsx
function LocationMapView() {
  const { coords, loading, error, refresh, isSupported } = useGeolocation({
    auto: true, // Automatically start getting location
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000 // Cache for 5 minutes
  })

  const [mapUrl, setMapUrl] = useState<string>('')

  useEffect(() => {
    if (coords) {
      // Generate map URL (using OpenStreetMap as example)
      const { latitude, longitude } = coords.coords
      const zoom = 15
      setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`)
    }
  }, [coords])

  if (!isSupported) {
    return <div>Geolocation not supported</div>
  }

  return (
    <div className="p-6">
      <h2>Your Location on Map</h2>
      
      <div className="mb-4 flex items-center justify-between">
        <div>
          {loading && <p>📍 Getting your location...</p>}
          {error && <p className="text-red-600">❌ {error.message}</p>}
          {coords && <p className="text-green-600">✅ Location found</p>}
        </div>
        
        <button
          onClick={refresh}
          disabled={loading}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm disabled:bg-gray-300"
        >
          🔄 Refresh
        </button>
      </div>

      {coords && (
        <div>
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p><strong>Coordinates:</strong> {coords.coords.latitude.toFixed(6)}, {coords.coords.longitude.toFixed(6)}</p>
            <p><strong>Accuracy:</strong> ±{coords.coords.accuracy}m</p>
            <p><strong>Altitude:</strong> {coords.coords.altitude ? `${coords.coords.altitude.toFixed(1)}m` : 'N/A'}</p>
            <p><strong>Last Updated:</strong> {new Date(coords.timestamp).toLocaleString()}</p>
          </div>
          
          {mapUrl && (
            <div className="border rounded overflow-hidden">
              <iframe
                src={mapUrl}
                width="100%"
                height="300"
                style={{ border: 0 }}
                title="Your location map"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

## Next.js Specific Usage

### App Router with Geolocation

```tsx
'use client'

import { useGeolocation } from 'garuda-hooks'
import { useEffect, useState } from 'react'

export default function LocationPage() {
  const { coords, loading, error, start, permissionState, isSupported } = useGeolocation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading geolocation...</div>
  }

  if (!isSupported) {
    return (
      <div className="p-6">
        <h1>Location Services Unavailable</h1>
        <p>Your browser doesn't support geolocation.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1>Next.js Geolocation Demo</h1>
      
      <div className="mb-4">
        <p><strong>Permission State:</strong> {permissionState}</p>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {coords ? (
        <div className="mb-4 p-3 bg-green-100 rounded">
          <h3>Your Location:</h3>
          <p>Latitude: {coords.coords.latitude}</p>
          <p>Longitude: {coords.coords.longitude}</p>
        </div>
      ) : (
        <button 
          onClick={start}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Get Location
        </button>
      )}
    </div>
  )
}
```

### API Route Integration

```tsx
// app/api/nearby/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { latitude, longitude, radius = 5 } = await request.json()

  // Find nearby locations
  const nearbyPlaces = await findNearbyPlaces(latitude, longitude, radius)
  
  return NextResponse.json({ places: nearbyPlaces })
}

// Component using the API
function NearbyPlacesComponent() {
  const { coords, start } = useGeolocation()
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(false)

  const findNearbyPlaces = async () => {
    if (!coords) return

    setLoading(true)
    try {
      const response = await fetch('/api/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.coords.latitude,
          longitude: coords.coords.longitude,
          radius: 10
        })
      })
      
      const data = await response.json()
      setPlaces(data.places)
    } catch (error) {
      console.error('Failed to fetch nearby places:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {coords ? (
        <button onClick={findNearbyPlaces} disabled={loading}>
          {loading ? 'Finding places...' : 'Find Nearby Places'}
        </button>
      ) : (
        <button onClick={start}>Get Location First</button>
      )}
      
      {places.map((place: any) => (
        <div key={place.id}>{place.name}</div>
      ))}
    </div>
  )
}
```

## Advanced Patterns

### Geofencing

```tsx
interface GeofenceArea {
  id: string
  name: string
  center: { lat: number; lng: number }
  radius: number // in meters
}

function GeofenceMonitor() {
  const { coords, start } = useGeolocation({ 
    watch: true,
    enableHighAccuracy: true 
  })

  const [geofences] = useState<GeofenceArea[]>([
    {
      id: 'home',
      name: 'Home Area',
      center: { lat: 40.7589, lng: -73.9851 },
      radius: 100
    },
    {
      id: 'work',
      name: 'Work Area', 
      center: { lat: 40.7505, lng: -73.9934 },
      radius: 50
    }
  ])

  const [activeGeofences, setActiveGeofences] = useState<string[]>([])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  useEffect(() => {
    if (!coords) return

    const currentlyActive = geofences.filter(geofence => {
      const distance = calculateDistance(
        coords.coords.latitude,
        coords.coords.longitude,
        geofence.center.lat,
        geofence.center.lng
      )
      return distance <= geofence.radius
    }).map(g => g.id)

    // Check for new entries
    currentlyActive.forEach(id => {
      if (!activeGeofences.includes(id)) {
        const geofence = geofences.find(g => g.id === id)
        console.log(`Entered geofence: ${geofence?.name}`)
        // Trigger entry event
      }
    })

    // Check for exits
    activeGeofences.forEach(id => {
      if (!currentlyActive.includes(id)) {
        const geofence = geofences.find(g => g.id === id)
        console.log(`Exited geofence: ${geofence?.name}`)
        // Trigger exit event
      }
    })

    setActiveGeofences(currentlyActive)
  }, [coords, activeGeofences, geofences])

  return (
    <div className="p-6">
      <h2>Geofence Monitor</h2>
      
      <button onClick={start} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">
        Start Monitoring
      </button>

      {coords && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p><strong>Current Location:</strong> {coords.coords.latitude.toFixed(4)}, {coords.coords.longitude.toFixed(4)}</p>
        </div>
      )}

      <div className="space-y-2">
        {geofences.map(geofence => {
          const isActive = activeGeofences.includes(geofence.id)
          const distance = coords ? calculateDistance(
            coords.coords.latitude,
            coords.coords.longitude,
            geofence.center.lat,
            geofence.center.lng
          ) : null

          return (
            <div 
              key={geofence.id}
              className={`p-3 rounded ${isActive ? 'bg-green-100 border-green-500' : 'bg-gray-100'} border`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{geofence.name}</span>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${isActive ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                    {isActive ? 'INSIDE' : 'OUTSIDE'}
                  </span>
                  {distance && (
                    <p className="text-xs text-gray-600 mt-1">
                      {distance.toFixed(0)}m away
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Permission Handling

```tsx
function PermissionAwareLocation() {
  const { permissionState, start, coords, error } = useGeolocation()

  const handleLocationRequest = () => {
    if (permissionState === 'denied') {
      alert('Location access was denied. Please enable it in your browser settings.')
      return
    }
    
    if (permissionState === 'prompt') {
      // Explain why you need location before requesting
      const userConsent = confirm(
        'This app needs your location to find nearby stores. Allow location access?'
      )
      if (!userConsent) return
    }
    
    start()
  }

  return (
    <div>
      <button onClick={handleLocationRequest}>
        Get Location
      </button>
    </div>
  )
}
```

### 2. Error Handling

```tsx
function RobustGeolocation() {
  const { coords, loading, error, start } = useGeolocation()
  const [userFriendlyError, setUserFriendlyError] = useState<string | null>(null)

  useEffect(() => {
    if (error) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setUserFriendlyError("Location access denied. Please enable location services.")
          break
        case error.POSITION_UNAVAILABLE:
          setUserFriendlyError("Location information unavailable. Please try again.")
          break
        case error.TIMEOUT:
          setUserFriendlyError("Location request timed out. Please try again.")
          break
        default:
          setUserFriendlyError("An unknown error occurred while getting location.")
      }
    } else {
      setUserFriendlyError(null)
    }
  }, [error])

  return (
    <div>
      {userFriendlyError && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {userFriendlyError}
        </div>
      )}
      {/* Rest of component */}
    </div>
  )
}
```

### 3. Performance Optimization

```tsx
function OptimizedGeolocation() {
  const { coords, start } = useGeolocation({
    enableHighAccuracy: false, // Use network location for faster results
    timeout: 10000,
    maximumAge: 600000 // Cache for 10 minutes
  })

  // Debounce location updates in watch mode
  const [debouncedCoords, setDebouncedCoords] = useState(coords)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCoords(coords)
    }, 1000) // Update UI only once per second
    
    return () => clearTimeout(timer)
  }, [coords])

  return (
    <div>
      {debouncedCoords && (
        <p>Location: {debouncedCoords.coords.latitude}, {debouncedCoords.coords.longitude}</p>
      )}
    </div>
  )
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Guide users to enable location in browser settings
2. **HTTPS Required**: Geolocation requires HTTPS in production
3. **Timeout Issues**: Adjust timeout values based on accuracy needs
4. **Battery Drain**: Use appropriate accuracy settings for watch mode

```tsx
function DebuggingGeolocation() {
  const { coords, loading, error, permissionState, isSupported } = useGeolocation()

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3>Debug Info:</h3>
      <p>Supported: {isSupported ? 'Yes' : 'No'}</p>
      <p>Permission: {permissionState}</p>
      <p>Loading: {loading ? 'Yes' : 'No'}</p>
      <p>Has Coords: {coords ? 'Yes' : 'No'}</p>
      <p>Error: {error ? error.message : 'None'}</p>
      <p>HTTPS: {location.protocol === 'https:' ? 'Yes' : 'No'}</p>
    </div>
  )
}
```