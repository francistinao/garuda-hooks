# Garuda Hooks

## Implementation Guide

> A comprehensive guide for building a production-ready, TypeScript-first hooks library for React and Next.js projects.

---

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Core Principles](#core-principles)
3. [Hook Categories](#hook-categories)
4. [Detailed Hook Specifications](#detailed-hook-specifications)
5. [TypeScript Patterns](#typescript-patterns)
6. [Testing Strategy](#testing-strategy)
7. [Documentation Standards](#documentation-standards)

---

## Project Architecture

### Directory Structure

```
src/
├── hooks/
│   ├── state/
│   │   ├── useToggle.ts
│   │   ├── useDisclosure.ts
│   │   ├── usePrevious.ts
│   │   └── index.ts
│   ├── storage/
│   │   ├── useLocalStorage.ts
│   │   ├── useSessionStorage.ts
│   │   └── index.ts
│   ├── dom/
│   │   ├── useClickOutside.ts
│   │   ├── useHover.ts
│   │   ├── useIntersectionObserver.ts
│   │   └── index.ts
│   ├── timing/
│   │   ├── useDebounce.ts
│   │   ├── useThrottle.ts
│   │   ├── useInterval.ts
│   │   └── index.ts
│   ├── browser/
│   │   ├── useMediaQuery.ts
│   │   ├── useClipboard.ts
│   │   ├── useNetwork.ts
│   │   └── index.ts
│   ├── nextjs/
│   │   ├── useHydrated.ts
│   │   ├── useIsServer.ts
│   │   └── index.ts
│   └── index.ts
├── utils/
│   ├── isServer.ts
│   ├── noop.ts
│   └── types.ts
├── __tests__/
│   └── [mirror structure]
└── index.ts
```

### Package Configuration

- **Build Tool**: tsup (for ESM + CJS dual output)
- **Exports**: Individual entry points per hook for tree-shaking
- **Peer Dependencies**: React 18+, React DOM 18+
- **Dev Dependencies**: TypeScript 5+, Vitest, React Testing Library

---

## Core Principles

### 1. SSR Safety

Every hook that touches browser APIs must:
- Check `typeof window !== 'undefined'` before access
- Return sensible defaults during SSR
- Handle hydration mismatches gracefully
- Document SSR behavior explicitly

### 2. TypeScript First

- Full generic support where applicable
- Strict mode enabled
- No `any` types (use `unknown` with type guards)
- Export all types for consumer use
- Inference-friendly return types

### 3. Consistent API Design

**Return Pattern Options** (pick one per hook category):

| Pattern | Use Case | Example |
|---------|----------|---------|
| `[value, setValue]` | Simple state | `useToggle`, `useLocalStorage` |
| `[value, actions]` | State with multiple actions | `useDisclosure`, `useCounter` |
| `{ value, ...actions }` | Complex returns | `useAsync`, `useFetch` |
| `ref` | DOM element binding | `useClickOutside` |

### 4. Options Object Pattern

Prefer options objects over positional parameters for extensibility:

```
// ✅ Good - extensible
useDebounce(value, { delay: 500, leading: true })

// ❌ Avoid - hard to extend
useDebounce(value, 500, true, false)
```

### 5. Cleanup Guarantees

- All subscriptions cleaned up on unmount
- All timers cleared
- All event listeners removed
- No memory leaks in effects

---

## Hook Categories

### Tier 1: Essential (15 hooks)

| Hook | Category | Priority |
|------|----------|----------|
| useLocalStorage | Storage | P0 |
| useSessionStorage | Storage | P0 |
| useDebounce | Timing | P0 |
| useDebouncedValue | Timing | P0 |
| useThrottle | Timing | P0 |
| useMediaQuery | Browser | P0 |
| useClickOutside | DOM | P0 |
| useDisclosure | State | P0 |
| useToggle | State | P0 |
| usePrevious | State | P0 |
| useMount | Lifecycle | P0 |
| useUnmount | Lifecycle | P0 |
| useIsServer | Next.js | P0 |
| useHydrated | Next.js | P0 |
| useEventListener | DOM | P0 |

### Tier 2: High Value (12 hooks)

| Hook | Category | Priority |
|------|----------|----------|
| useAsync | Async | P1 |
| useFetch | Async | P1 |
| useIntersectionObserver | DOM | P1 |
| useHotkeys | Input | P1 |
| useClipboard | Browser | P1 |
| useWindowSize | DOM | P1 |
| useElementSize | DOM | P1 |
| useInterval | Timing | P1 |
| useTimeout | Timing | P1 |
| useNetwork | Browser | P1 |
| useIdle | Browser | P1 |
| useHover | DOM | P1 |

### Tier 3: Specialized (13 hooks)

| Hook | Category | Priority |
|------|----------|----------|
| useFullscreen | Browser | P2 |
| useGeolocation | Browser | P2 |
| useOrientation | Browser | P2 |
| useColorScheme | Browser | P2 |
| useDocumentTitle | Browser | P2 |
| useFavicon | Browser | P2 |
| useHash | Browser | P2 |
| useScrollLock | DOM | P2 |
| useMouse | DOM | P2 |
| useList | State | P2 |
| useMap | State | P2 |
| useSet | State | P2 |
| useLongPress | Input | P2 |

---

## Detailed Hook Specifications

---

### Storage Hooks

---

#### useLocalStorage

**Purpose**: Persist state to localStorage with SSR safety and cross-tab synchronization.

**Signature**:
```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>
): [T, (value: T | ((prev: T) => T)) => void, () => void]
```

**Options Interface**:
```typescript
interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string
  deserializer?: (value: string) => T
  syncAcrossTabs?: boolean
  onError?: (error: Error) => void
}
```

**Return Value**:
- `[0]`: Current value (falls back to initialValue if not in storage)
- `[1]`: Setter function (supports functional updates)
- `[2]`: Remove function (clears key from storage)

**Implementation Notes**:
- Use `useState` with lazy initializer to read from storage only on mount
- Listen to `storage` event for cross-tab sync (when enabled)
- Wrap storage access in try-catch for quota exceeded errors
- Return `initialValue` during SSR
- Use `useEffect` to sync state to storage on changes
- Handle JSON serialization/deserialization with custom serializers option

**SSR Behavior**: Returns `initialValue` on server, hydrates from storage on client.

**Edge Cases**:
- Storage quota exceeded → call `onError`, keep in-memory state
- Invalid JSON in storage → call `onError`, use `initialValue`
- Storage disabled (private browsing) → graceful fallback to memory

---

#### useSessionStorage

**Purpose**: Same as useLocalStorage but with sessionStorage (cleared on tab close).

**Signature**: Identical to useLocalStorage

**Implementation Notes**:
- Same implementation as useLocalStorage
- Replace `localStorage` with `sessionStorage`
- No cross-tab sync needed (sessions don't share)

---

### Timing Hooks

---

#### useDebounce

**Purpose**: Debounce a value, delaying updates until after a specified period of inactivity.

**Signature**:
```typescript
function useDebounce<T>(
  value: T,
  delay: number,
  options?: UseDebounceOptions
): T
```

**Options Interface**:
```typescript
interface UseDebounceOptions {
  leading?: boolean    // Fire on leading edge
  trailing?: boolean   // Fire on trailing edge (default: true)
  maxWait?: number     // Maximum time to wait
}
```

**Return Value**: The debounced value

**Implementation Notes**:
- Store timeout ref with `useRef`
- Clear timeout on value change and unmount
- Use `useEffect` to schedule timeout when value changes
- Update internal state when timeout fires
- Implement leading/trailing edge logic if options provided

**SSR Behavior**: Returns initial value immediately, debouncing starts on client.

---

#### useDebouncedValue

**Purpose**: Returns both the immediate value and its debounced version.

**Signature**:
```typescript
function useDebouncedValue<T>(
  value: T,
  delay: number,
  options?: UseDebounceOptions
): [T, T, () => void]
```

**Return Value**:
- `[0]`: Immediate value (pass-through)
- `[1]`: Debounced value
- `[2]`: Cancel function to flush pending debounce

**Implementation Notes**:
- Internally use `useDebounce`
- Expose cancel function for imperative flush

---

#### useDebouncedCallback

**Purpose**: Returns a debounced version of a callback function.

**Signature**:
```typescript
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options?: UseDebounceOptions
): DebouncedFunction<T>
```

**Return Interface**:
```typescript
interface DebouncedFunction<T> {
  (...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
  pending: () => boolean
}
```

**Implementation Notes**:
- Store callback in ref to avoid stale closures
- Store timeout ID in ref
- Return stable function reference (wrap in `useCallback` with empty deps)
- Implement cancel, flush, and pending methods

---

#### useThrottle

**Purpose**: Throttle a value, limiting updates to at most once per specified interval.

**Signature**:
```typescript
function useThrottle<T>(
  value: T,
  interval: number,
  options?: UseThrottleOptions
): T
```

**Options Interface**:
```typescript
interface UseThrottleOptions {
  leading?: boolean   // Update on leading edge (default: true)
  trailing?: boolean  // Update on trailing edge (default: true)
}
```

**Implementation Notes**:
- Track last execution time with `useRef`
- Track pending value with `useRef`
- Use timeout for trailing edge execution
- Clear timeout on unmount

---

#### useInterval

**Purpose**: Execute a callback repeatedly at a specified interval.

**Signature**:
```typescript
function useInterval(
  callback: () => void,
  delay: number | null,
  options?: UseIntervalOptions
): UseIntervalReturn
```

**Options Interface**:
```typescript
interface UseIntervalOptions {
  immediate?: boolean  // Run callback immediately on mount
}
```

**Return Interface**:
```typescript
interface UseIntervalReturn {
  active: boolean
  start: () => void
  stop: () => void
  toggle: () => void
}
```

**Implementation Notes**:
- Store callback in ref to always call latest version
- Pass `null` as delay to pause interval
- Clear interval on unmount
- Return control methods for imperative control

---

#### useTimeout

**Purpose**: Execute a callback once after a specified delay.

**Signature**:
```typescript
function useTimeout(
  callback: () => void,
  delay: number | null
): UseTimeoutReturn
```

**Return Interface**:
```typescript
interface UseTimeoutReturn {
  ready: boolean | null  // null = not started, false = pending, true = fired
  start: (overrideDelay?: number) => void
  clear: () => void
  reset: () => void
}
```

**Implementation Notes**:
- Store callback in ref
- Pass `null` as delay to not start automatically
- Expose start/clear/reset for imperative control
- Track ready state for UI feedback

---

### DOM Hooks

---

#### useClickOutside

**Purpose**: Detect clicks outside a referenced element.

**Signature**:
```typescript
function useClickOutside<T extends HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
  options?: UseClickOutsideOptions
): RefObject<T>

// Alternative overload for existing ref
function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  options?: UseClickOutsideOptions
): void
```

**Options Interface**:
```typescript
interface UseClickOutsideOptions {
  enabled?: boolean
  eventTypes?: ('mousedown' | 'mouseup' | 'touchstart' | 'touchend')[]
  ignoredElements?: RefObject<HTMLElement>[]
}
```

**Implementation Notes**:
- Create ref internally or accept existing ref
- Add event listeners to `document`
- Check if click target is outside ref element using `contains()`
- Check against ignored elements list
- Use `mousedown` and `touchstart` by default (fires before focus changes)
- Clean up listeners on unmount

---

#### useHover

**Purpose**: Track hover state of an element.

**Signature**:
```typescript
function useHover<T extends HTMLElement>(): UseHoverReturn<T>
```

**Return Interface**:
```typescript
interface UseHoverReturn<T> {
  ref: RefObject<T>
  hovered: boolean
}
```

**Implementation Notes**:
- Create ref internally
- Add `mouseenter` and `mouseleave` listeners to ref element
- Use `useEffect` with ref.current dependency
- Clean up listeners when ref changes or unmount

---

#### useIntersectionObserver

**Purpose**: Observe element visibility within viewport using Intersection Observer API.

**Signature**:
```typescript
function useIntersectionObserver<T extends HTMLElement>(
  options?: UseIntersectionObserverOptions
): UseIntersectionObserverReturn<T>
```

**Options Interface**:
```typescript
interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  enabled?: boolean
  triggerOnce?: boolean  // Disconnect after first intersection
}
```

**Return Interface**:
```typescript
interface UseIntersectionObserverReturn<T> {
  ref: RefObject<T>
  entry: IntersectionObserverEntry | null
  isIntersecting: boolean
}
```

**Implementation Notes**:
- Check for `IntersectionObserver` support (SSR safety)
- Create observer in `useEffect`
- Disconnect observer on unmount or options change
- If `triggerOnce`, disconnect after first `isIntersecting === true`

---

#### useWindowSize

**Purpose**: Track browser window dimensions.

**Signature**:
```typescript
function useWindowSize(options?: UseWindowSizeOptions): WindowSize
```

**Options Interface**:
```typescript
interface UseWindowSizeOptions {
  initialWidth?: number   // SSR fallback
  initialHeight?: number  // SSR fallback
  debounceDelay?: number  // Debounce resize events
}
```

**Return Interface**:
```typescript
interface WindowSize {
  width: number
  height: number
}
```

**Implementation Notes**:
- Return initial values during SSR
- Listen to `resize` event on window
- Optionally debounce updates for performance
- Clean up listener on unmount

---

#### useElementSize

**Purpose**: Track dimensions of a specific element using ResizeObserver.

**Signature**:
```typescript
function useElementSize<T extends HTMLElement>(): UseElementSizeReturn<T>
```

**Return Interface**:
```typescript
interface UseElementSizeReturn<T> {
  ref: RefObject<T>
  width: number
  height: number
}
```

**Implementation Notes**:
- Check for `ResizeObserver` support
- Create observer in `useEffect`
- Update state on resize
- Disconnect on unmount

---

#### useEventListener

**Purpose**: Attach event listeners to elements or window/document with automatic cleanup.

**Signature**:
```typescript
function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: undefined,
  options?: AddEventListenerOptions
): void

function useEventListener<K extends keyof HTMLElementEventMap, T extends HTMLElement>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: RefObject<T>,
  options?: AddEventListenerOptions
): void

function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element: RefObject<Document>,
  options?: AddEventListenerOptions
): void
```

**Implementation Notes**:
- Store handler in ref to avoid effect re-runs
- Default to window if no element provided
- Support all standard addEventListener options (capture, passive, once)
- Type-safe event maps for window, document, and HTML elements

---

#### useScrollLock

**Purpose**: Lock body scroll (useful for modals).

**Signature**:
```typescript
function useScrollLock(locked?: boolean): UseScrollLockReturn
```

**Return Interface**:
```typescript
interface UseScrollLockReturn {
  locked: boolean
  lock: () => void
  unlock: () => void
}
```

**Implementation Notes**:
- Save original `overflow` style
- Set `overflow: hidden` on body when locked
- Account for scrollbar width to prevent layout shift
- Restore original style on unlock or unmount
- Handle nested locks (reference counting)

---

#### useMouse

**Purpose**: Track mouse position globally or relative to an element.

**Signature**:
```typescript
function useMouse<T extends HTMLElement>(
  options?: UseMouseOptions
): UseMouseReturn<T>
```

**Options Interface**:
```typescript
interface UseMouseOptions {
  type?: 'page' | 'client' | 'screen' | 'element'
  touch?: boolean  // Include touch events
}
```

**Return Interface**:
```typescript
interface UseMouseReturn<T> {
  ref: RefObject<T>
  position: { x: number; y: number }
  elementPosition: { x: number; y: number } | null
}
```

**Implementation Notes**:
- Listen to `mousemove` (and optionally `touchmove`)
- Calculate position based on `type` option
- For element-relative position, subtract element's bounding rect

---

### State Hooks

---

#### useToggle

**Purpose**: Manage boolean state with semantic toggle action.

**Signature**:
```typescript
function useToggle(initialValue?: boolean): [boolean, () => void, (value: boolean) => void]

// Overload for cycling through values
function useToggle<T>(options: T[]): [T, () => void, (value: T) => void]
```

**Return Value**:
- `[0]`: Current value
- `[1]`: Toggle function (cycles to next value)
- `[2]`: Set function (set specific value)

**Implementation Notes**:
- For boolean: flip between true/false
- For array: cycle through values in order, wrap to beginning
- Memoize toggle and set functions with `useCallback`

---

#### useDisclosure

**Purpose**: Manage open/close state for modals, drawers, accordions.

**Signature**:
```typescript
function useDisclosure(
  initialState?: boolean,
  callbacks?: UseDisclosureCallbacks
): [boolean, UseDisclosureActions]
```

**Callbacks Interface**:
```typescript
interface UseDisclosureCallbacks {
  onOpen?: () => void
  onClose?: () => void
}
```

**Actions Interface**:
```typescript
interface UseDisclosureActions {
  open: () => void
  close: () => void
  toggle: () => void
  set: (value: boolean) => void  // For controlled components (e.g., onOpenChange)
}
```

**Implementation Notes**:
- Call `onOpen` callback when opening
- Call `onClose` callback when closing
- Memoize all action functions
- `set` function useful for binding to `onOpenChange` props

---

#### useDisclosureWithData

**Purpose**: Disclosure state with associated data (for edit modals, confirmations).

**Signature**:
```typescript
function useDisclosureWithData<T>(
  initialData?: T | null
): [T | null, boolean, UseDisclosureDataActions<T>]
```

**Actions Interface**:
```typescript
interface UseDisclosureDataActions<T> {
  open: (data: T) => void
  close: () => void
  setData: (data: T | null) => void
}
```

**Return Value**:
- `[0]`: Current data (null when closed)
- `[1]`: Open state boolean
- `[2]`: Actions object

**Implementation Notes**:
- Opening sets both `isOpen` and `data`
- Closing clears `data` (or optionally retain until next open)
- Useful for "Edit Item" modals where you need the item context

---

#### usePrevious

**Purpose**: Track the previous value of a variable across renders.

**Signature**:
```typescript
function usePrevious<T>(value: T): T | undefined
```

**Return Value**: Previous value (undefined on first render)

**Implementation Notes**:
- Store value in ref
- Update ref in `useEffect` (runs after render)
- Return ref's current value (which is previous since effect hasn't run yet)

---

#### useCounter

**Purpose**: Numeric state with increment, decrement, and bounds.

**Signature**:
```typescript
function useCounter(
  initialValue?: number,
  options?: UseCounterOptions
): [number, UseCounterActions]
```

**Options Interface**:
```typescript
interface UseCounterOptions {
  min?: number
  max?: number
  step?: number
}
```

**Actions Interface**:
```typescript
interface UseCounterActions {
  increment: (amount?: number) => void
  decrement: (amount?: number) => void
  set: (value: number) => void
  reset: () => void
}
```

**Implementation Notes**:
- Clamp value to min/max bounds
- Use step as default increment/decrement amount
- Memoize all actions

---

#### useList

**Purpose**: Manage array state with common operations.

**Signature**:
```typescript
function useList<T>(initialList?: T[]): [T[], UseListActions<T>]
```

**Actions Interface**:
```typescript
interface UseListActions<T> {
  set: (list: T[]) => void
  push: (...items: T[]) => void
  insertAt: (index: number, item: T) => void
  updateAt: (index: number, item: T) => void
  removeAt: (index: number) => void
  filter: (predicate: (item: T) => boolean) => void
  clear: () => void
  reset: () => void
}
```

**Implementation Notes**:
- All operations create new array (immutable updates)
- Memoize all action functions
- `reset` returns to initial value

---

#### useMap

**Purpose**: Manage Map-like state.

**Signature**:
```typescript
function useMap<K, V>(
  initialEntries?: Iterable<[K, V]>
): [Map<K, V>, UseMapActions<K, V>]
```

**Actions Interface**:
```typescript
interface UseMapActions<K, V> {
  set: (key: K, value: V) => void
  setAll: (entries: Iterable<[K, V]>) => void
  delete: (key: K) => void
  clear: () => void
  reset: () => void
}
```

**Implementation Notes**:
- Store as `Map` internally
- Create new Map on each mutation for React to detect changes
- Memoize actions

---

#### useSet

**Purpose**: Manage Set state.

**Signature**:
```typescript
function useSet<T>(initialValues?: Iterable<T>): [Set<T>, UseSetActions<T>]
```

**Actions Interface**:
```typescript
interface UseSetActions<T> {
  add: (value: T) => void
  delete: (value: T) => void
  toggle: (value: T) => void
  clear: () => void
  reset: () => void
}
```

---

### Browser Hooks

---

#### useMediaQuery

**Purpose**: Subscribe to CSS media query matches.

**Signature**:
```typescript
function useMediaQuery(
  query: string,
  options?: UseMediaQueryOptions
): boolean
```

**Options Interface**:
```typescript
interface UseMediaQueryOptions {
  defaultValue?: boolean  // SSR fallback
  initializeWithValue?: boolean  // Read on mount vs lazily
}
```

**Implementation Notes**:
- Use `window.matchMedia()` to create MediaQueryList
- Listen to `change` event (modern) or `addListener` (legacy)
- Return `defaultValue` during SSR
- Handle hydration mismatch by initializing with `defaultValue` then updating

---

#### useClipboard

**Purpose**: Copy text to clipboard with status feedback.

**Signature**:
```typescript
function useClipboard(options?: UseClipboardOptions): UseClipboardReturn
```

**Options Interface**:
```typescript
interface UseClipboardOptions {
  timeout?: number  // Reset copied state after ms (default: 2000)
}
```

**Return Interface**:
```typescript
interface UseClipboardReturn {
  copy: (text: string) => Promise<void>
  copied: boolean
  error: Error | null
  reset: () => void
}
```

**Implementation Notes**:
- Use `navigator.clipboard.writeText()` (modern API)
- Fallback to `document.execCommand('copy')` for older browsers
- Set `copied` to true on success, reset after timeout
- Capture errors for UI feedback

---

#### useNetwork

**Purpose**: Monitor network connection status.

**Signature**:
```typescript
function useNetwork(): NetworkState
```

**Return Interface**:
```typescript
interface NetworkState {
  online: boolean
  downlink?: number
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
  rtt?: number
  saveData?: boolean
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'wifi' | 'none' | 'other' | 'unknown'
}
```

**Implementation Notes**:
- Use `navigator.onLine` for basic online/offline
- Use `navigator.connection` for detailed info (Network Information API)
- Listen to `online` and `offline` events on window
- Listen to `change` event on navigator.connection
- Return sensible defaults for unsupported properties

---

#### useIdle

**Purpose**: Detect user inactivity.

**Signature**:
```typescript
function useIdle(
  timeout: number,
  options?: UseIdleOptions
): UseIdleReturn
```

**Options Interface**:
```typescript
interface UseIdleOptions {
  events?: string[]  // Events that reset idle timer
  initialState?: boolean
}
```

**Return Interface**:
```typescript
interface UseIdleReturn {
  idle: boolean
  lastActive: Date
}
```

**Implementation Notes**:
- Default events: mousemove, mousedown, keypress, touchstart, scroll
- Reset timer on any activity event
- Use throttled event handlers for performance
- Track last active timestamp

---

#### useFullscreen

**Purpose**: Control fullscreen mode for document or element.

**Signature**:
```typescript
function useFullscreen<T extends HTMLElement>(
  ref?: RefObject<T>
): UseFullscreenReturn
```

**Return Interface**:
```typescript
interface UseFullscreenReturn {
  isFullscreen: boolean
  enter: () => Promise<void>
  exit: () => Promise<void>
  toggle: () => Promise<void>
  isSupported: boolean
}
```

**Implementation Notes**:
- Handle vendor prefixes (webkit, moz, ms)
- If no ref provided, use `document.documentElement`
- Listen to `fullscreenchange` event for state sync
- Return `isSupported: false` during SSR or if API unavailable

---

#### useColorScheme

**Purpose**: Detect system color scheme preference.

**Signature**:
```typescript
function useColorScheme(): 'light' | 'dark' | 'no-preference'
```

**Implementation Notes**:
- Use `useMediaQuery` internally with `(prefers-color-scheme: dark)`
- Also check `(prefers-color-scheme: light)`
- Return `'no-preference'` if neither matches
- Reactive to system preference changes

---

#### useDocumentTitle

**Purpose**: Dynamically set document title.

**Signature**:
```typescript
function useDocumentTitle(
  title: string,
  options?: UseDocumentTitleOptions
): void
```

**Options Interface**:
```typescript
interface UseDocumentTitleOptions {
  restoreOnUnmount?: boolean
  preserveTemplate?: string  // e.g., "%s | My App"
}
```

**Implementation Notes**:
- Store original title if `restoreOnUnmount`
- Apply template if provided
- Only run on client (check for document)
- Update in `useEffect`

---

#### useFavicon

**Purpose**: Dynamically set page favicon.

**Signature**:
```typescript
function useFavicon(href: string): void
```

**Implementation Notes**:
- Find or create `<link rel="icon">` element
- Update `href` attribute
- Support multiple formats (ico, png, svg)
- Only run on client

---

#### useHash

**Purpose**: Sync state with URL hash.

**Signature**:
```typescript
function useHash(): [string, (hash: string) => void]
```

**Implementation Notes**:
- Read from `window.location.hash`
- Listen to `hashchange` event
- Update via `window.location.hash = ` setter
- Strip leading `#` from return value

---

#### useGeolocation

**Purpose**: Access user's geographic location.

**Signature**:
```typescript
function useGeolocation(options?: PositionOptions): UseGeolocationReturn
```

**Return Interface**:
```typescript
interface UseGeolocationReturn {
  loading: boolean
  error: GeolocationPositionError | null
  latitude: number | null
  longitude: number | null
  altitude: number | null
  accuracy: number | null
  heading: number | null
  speed: number | null
  timestamp: number | null
}
```

**Implementation Notes**:
- Use `navigator.geolocation.watchPosition` for continuous updates
- Or `getCurrentPosition` for one-time fetch
- Handle permission denied, position unavailable, timeout errors
- Clear watch on unmount

---

#### useOrientation

**Purpose**: Track device orientation.

**Signature**:
```typescript
function useOrientation(): UseOrientationReturn
```

**Return Interface**:
```typescript
interface UseOrientationReturn {
  angle: number
  type: 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary'
}
```

**Implementation Notes**:
- Use `screen.orientation` API
- Listen to `change` event on `screen.orientation`
- Fallback to `window.orientation` for older browsers

---

### Input Hooks

---

#### useHotkeys

**Purpose**: Handle keyboard shortcuts.

**Signature**:
```typescript
function useHotkeys(
  hotkeys: HotkeyItem[],
  options?: UseHotkeysOptions
): void
```

**Types**:
```typescript
type HotkeyItem = [string, (event: KeyboardEvent) => void, HotkeyOptions?]

interface HotkeyOptions {
  enabled?: boolean
  preventDefault?: boolean
  enableOnFormTags?: boolean
}

interface UseHotkeysOptions {
  element?: RefObject<HTMLElement>  // Scope to element (default: document)
}
```

**Hotkey String Format**:
- Modifiers: `mod` (cmd on mac, ctrl otherwise), `ctrl`, `shift`, `alt`, `meta`
- Keys: Any key name (e.g., `a`, `enter`, `escape`, `arrowup`)
- Combine with `+`: `mod+k`, `ctrl+shift+p`

**Implementation Notes**:
- Parse hotkey strings into modifier + key combinations
- Check `event.metaKey`, `event.ctrlKey`, `event.shiftKey`, `event.altKey`
- Use `event.key` for key matching (normalize case)
- Skip if focus is on form element (unless `enableOnFormTags`)
- Detect OS for `mod` key resolution

---

#### useLongPress

**Purpose**: Detect long press on elements.

**Signature**:
```typescript
function useLongPress<T extends HTMLElement>(
  callback: (event: LongPressEvent) => void,
  options?: UseLongPressOptions
): UseLongPressReturn<T>
```

**Options Interface**:
```typescript
interface UseLongPressOptions {
  threshold?: number  // ms to trigger (default: 400)
  onStart?: () => void
  onCancel?: () => void
  cancelOnMovement?: boolean | number  // Cancel if finger moves
}
```

**Return Interface**:
```typescript
interface UseLongPressReturn<T> {
  ref: RefObject<T>
}

// Or return event handlers for spreading
interface UseLongPressHandlers {
  onMouseDown: MouseEventHandler
  onMouseUp: MouseEventHandler
  onMouseLeave: MouseEventHandler
  onTouchStart: TouchEventHandler
  onTouchEnd: TouchEventHandler
}
```

**Implementation Notes**:
- Start timer on mousedown/touchstart
- Clear timer on mouseup/touchend/mouseleave
- Track touch position if `cancelOnMovement`
- Call callback when timer fires

---

### Lifecycle Hooks

---

#### useMount

**Purpose**: Run effect only on component mount.

**Signature**:
```typescript
function useMount(callback: () => void): void
```

**Implementation Notes**:
- Simple wrapper around `useEffect` with empty deps array
- Store callback in ref to avoid lint warnings about missing deps

---

#### useUnmount

**Purpose**: Run cleanup only on component unmount.

**Signature**:
```typescript
function useUnmount(callback: () => void): void
```

**Implementation Notes**:
- Store callback in ref (always get latest)
- Return cleanup function from `useEffect` that calls ref.current

---

#### useUpdateEffect

**Purpose**: Run effect on updates only, not on mount.

**Signature**:
```typescript
function useUpdateEffect(effect: EffectCallback, deps?: DependencyList): void
```

**Implementation Notes**:
- Track mount state with ref
- Skip first effect run
- Behaves like `useEffect` for subsequent runs

---

#### useIsFirstRender

**Purpose**: Know if this is the first render.

**Signature**:
```typescript
function useIsFirstRender(): boolean
```

**Implementation Notes**:
- Use ref initialized to true
- Set to false in effect
- Return ref value

---

### Async Hooks

---

#### useAsync

**Purpose**: Handle async operations with loading/error/data states.

**Signature**:
```typescript
function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  options?: UseAsyncOptions
): UseAsyncReturn<T, E>
```

**Options Interface**:
```typescript
interface UseAsyncOptions {
  immediate?: boolean  // Run on mount (default: true)
  onSuccess?: (data: T) => void
  onError?: (error: E) => void
}
```

**Return Interface**:
```typescript
interface UseAsyncReturn<T, E> {
  execute: () => Promise<T | undefined>
  data: T | undefined
  error: E | undefined
  loading: boolean
  status: 'idle' | 'pending' | 'success' | 'error'
}
```

**Implementation Notes**:
- Track status state machine
- Store async function in ref
- Handle race conditions with cleanup flag
- Call success/error callbacks

---

#### useFetch

**Purpose**: Fetch data from URL with caching and refetching.

**Signature**:
```typescript
function useFetch<T>(
  url: string | null,
  options?: UseFetchOptions
): UseFetchReturn<T>
```

**Options Interface**:
```typescript
interface UseFetchOptions extends RequestInit {
  enabled?: boolean
  refetchInterval?: number
  refetchOnWindowFocus?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}
```

**Return Interface**:
```typescript
interface UseFetchReturn<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
  refetch: () => Promise<void>
  mutate: (data: T) => void
}
```

**Implementation Notes**:
- Use native fetch API
- Handle JSON parsing
- Support abort controller for request cancellation
- Optional refetch on interval or window focus
- Pass `null` url to disable

---

### Next.js Specific Hooks

---

#### useIsServer

**Purpose**: Determine if code is running on server.

**Signature**:
```typescript
function useIsServer(): boolean
```

**Implementation Notes**:
- Return `typeof window === 'undefined'`
- This is a constant, but useful for conditional logic in components

---

#### useHydrated

**Purpose**: Know when client-side hydration is complete.

**Signature**:
```typescript
function useHydrated(): boolean
```

**Implementation Notes**:
- Initialize state to `false`
- Set to `true` in `useEffect` (only runs on client after hydration)
- Useful for avoiding hydration mismatches with client-only content

---

#### useIsomorphicLayoutEffect

**Purpose**: Use `useLayoutEffect` on client, `useEffect` on server.

**Signature**:
```typescript
const useIsomorphicLayoutEffect: typeof useLayoutEffect
```

**Implementation Notes**:
- `useLayoutEffect` warns during SSR
- Conditionally export `useLayoutEffect` or `useEffect` based on environment
- Use for effects that need synchronous DOM measurements

---

## TypeScript Patterns

### Generic Constraints

```typescript
// For DOM element refs
function useHook<T extends HTMLElement>(): RefObject<T>

// For serializable values (storage)
function useHook<T extends JsonValue>(value: T): T

// For any value
function useHook<T>(value: T): T
```

### Utility Types

```typescript
// JSON-serializable values
type JsonPrimitive = string | number | boolean | null
type JsonArray = JsonValue[]
type JsonObject = { [key: string]: JsonValue }
type JsonValue = JsonPrimitive | JsonArray | JsonObject

// Setter function type (matches useState)
type SetStateAction<T> = T | ((prev: T) => T)
type Dispatch<T> = (action: T) => void

// Noop function
type Noop = () => void
```

### Overload Patterns

```typescript
// Multiple call signatures
function useLocalStorage<T>(key: string): [T | null, Dispatch<SetStateAction<T | null>>]
function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>]
function useLocalStorage<T>(key: string, initialValue?: T) {
  // Implementation
}
```

### Discriminated Unions for Status

```typescript
type AsyncState<T, E> =
  | { status: 'idle'; data: undefined; error: undefined }
  | { status: 'pending'; data: undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: E }
```

---

## Testing Strategy

### Test Categories

1. **Behavior Tests**: Does the hook return correct values?
2. **Update Tests**: Does state update correctly on actions?
3. **Cleanup Tests**: Are effects properly cleaned up?
4. **SSR Tests**: Does hook handle server rendering?
5. **Edge Case Tests**: Boundary conditions, error states

### Testing Utilities

- Use `@testing-library/react` with `renderHook`
- Use `act()` for state updates
- Mock browser APIs (localStorage, matchMedia, IntersectionObserver)
- Test cleanup by unmounting

### Example Test Structure

```
describe('useLocalStorage', () => {
  describe('initialization', () => {
    it('returns initial value when storage is empty')
    it('returns stored value when present')
    it('returns initial value during SSR')
  })
  
  describe('updates', () => {
    it('updates state and storage on setter call')
    it('supports functional updates')
    it('handles removal')
  })
  
  describe('cross-tab sync', () => {
    it('updates when storage event fires')
  })
  
  describe('error handling', () => {
    it('handles storage quota exceeded')
    it('handles invalid JSON')
  })
})
```

---

## Documentation Standards

### Hook Documentation Template

Each hook should have:

1. **Purpose**: One-sentence description
2. **Signature**: TypeScript function signature
3. **Parameters**: Table of parameters with types and descriptions
4. **Returns**: Description of return value(s)
5. **Options**: If applicable, options object properties
6. **Example**: Basic usage code snippet
7. **SSR Behavior**: How hook behaves during server rendering
8. **Edge Cases**: Known limitations or special behaviors

### JSDoc Comments

Include JSDoc for IDE intellisense:

```typescript
/**
 * Persists state to localStorage with SSR safety and cross-tab sync.
 * 
 * @param key - The localStorage key
 * @param initialValue - Default value if key doesn't exist
 * @param options - Configuration options
 * @returns Tuple of [value, setter, remover]
 * 
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light')
 */
```

---

## Implementation Checklist

For each hook, verify:

- [ ] TypeScript types are exported
- [ ] SSR safe (no window access without check)
- [ ] Cleanup function handles all subscriptions/timers
- [ ] Memoized return values where appropriate
- [ ] Stable function references (useCallback)
- [ ] Unit tests cover main scenarios
- [ ] JSDoc documentation complete
- [ ] Example in documentation site

---

## Priority Roadmap

### Phase 1: Core Foundation (Week 1-2)
- useLocalStorage, useSessionStorage
- useToggle, useDisclosure, usePrevious
- useDebounce, useDebouncedValue
- useMount, useUnmount
- useIsServer, useHydrated

### Phase 2: DOM & Browser (Week 3-4)
- useClickOutside, useHover
- useMediaQuery, useWindowSize
- useEventListener
- useClipboard, useNetwork

### Phase 3: Advanced (Week 5-6)
- useIntersectionObserver, useElementSize
- useAsync, useFetch
- useHotkeys
- useInterval, useTimeout

### Phase 4: Polish (Week 7-8)
- Remaining Tier 2 & 3 hooks
- Documentation site
- Performance optimization
- Bundle size analysis

---

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [usehooks-ts](https://usehooks-ts.com/) - Reference implementation
- [ahooks](https://ahooks.js.org/) - Comprehensive library
- [Mantine Hooks](https://mantine.dev/hooks/use-click-outside/) - Original inspiration for bagon-hooks