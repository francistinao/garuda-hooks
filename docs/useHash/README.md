# useHash

A React hook for managing the URL hash (fragment identifier) with support for parsing key-value pairs, URL decoding, and history management. Fully SSR-compatible and handles all edge cases gracefully.

## Installation

```bash
npm install garuda-hooks
```

## Usage

### Basic Example

```tsx
import { useHash } from 'garuda-hooks'

function Component() {
  const { hash, setHash, clearHash } = useHash({
    value: 'section1',
    options: {}
  })

  return (
    <div>
      <p>Current hash: {hash}</p>
      <button onClick={setHash}>Set Hash to #section1</button>
      <button onClick={clearHash}>Clear Hash</button>
    </div>
  )
}
```

### With Default Hash

```tsx
const { hash } = useHash({
  value: '',
  options: {
    defaultHash: 'home'  // Used when no hash is present
  }
})

// URL: /page -> hash will be 'home'
// URL: /page#about -> hash will be 'about'
```

### Parsing Key-Value Pairs

```tsx
const { parsed } = useHash({
  value: '',
  options: {
    parse: true,
    decode: true
  }
})

// URL: #name=John%20Doe&age=30
// parsed = { name: 'John Doe', age: '30' }
```

### Using Replace State

```tsx
const { setHash } = useHash({
  value: 'new-section',
  options: {
    replace: true  // Uses replaceState instead of changing location.hash
  }
})

// Won't create a new history entry
```

### Custom Separator for Parsing

```tsx
const { parsed } = useHash({
  value: '',
  options: {
    parse: true,
    separator: ';'  // Can be any single character
  }
})

// URL: #key1=value1;key2=value2
// parsed = { key1: 'value1', key2: 'value2' }
```

## API

### Parameters

The hook accepts an object with two properties:

#### `value: string`
The hash value to set when `setHash` is called. The `#` prefix is optional and will be added automatically if not present.

#### `options: Options`
Configuration object with the following properties:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultHash` | `string` | `undefined` | Default hash value when no hash is present in URL |
| `replace` | `boolean` | `false` | Use `replaceState` instead of changing `location.hash` directly |
| `parse` | `boolean` | `false` | Parse the hash as key-value pairs |
| `separator` | `'&'` | `'&'` | Separator for parsing key-value pairs (supports any single character) |
| `decode` | `boolean` | `false` | Decode URL-encoded values when parsing |

### Return Value

The hook returns an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `hash` | `string \| null` | Current hash value without the `#` prefix (null in SSR) |
| `rawHash` | `string \| null` | Current hash value with the `#` prefix (null in SSR) |
| `parsed` | `Record<string, string> \| null` | Parsed key-value pairs (null if `parse` is false or in SSR) |
| `setHash` | `() => void` | Function to set the hash to the configured `value` |
| `clearHash` | `() => void` | Function to clear the hash |

## Features

### Automatic Hash Synchronization
The hook automatically listens to `hashchange` events and updates when the hash changes externally (e.g., user clicks a link or uses browser navigation).

### SSR Safe
The hook is server-side rendering safe and will return safe default values when running in a non-browser environment.

### URL Encoding/Decoding
When `decode` is enabled, the hook automatically decodes URL-encoded values:
- `%20` → space
- `%40` → @
- Unicode and emoji characters are supported

### History Management
Choose between two modes:
- **Normal mode** (`replace: false`): Changes create new browser history entries
- **Replace mode** (`replace: true`): Changes replace the current history entry

### Key-Value Parsing
Parse hash strings into objects for easier data management:
```
#key1=value1&key2=value2 → { key1: 'value1', key2: 'value2' }
```

## Edge Cases Handled

- Empty hash strings (`#` → empty string)
- Keys without values (`#key1&key2=value` → `{ key1: '', key2: 'value' }`)
- Duplicate keys (last value wins)
- Special characters and XSS attempts (safely handled)
- Unicode and emoji characters
- Malformed URL encoding
- Very long hash values
- Multiple equals signs in values

## Examples

### Navigation Menu with Active Section

```tsx
import { useState } from 'react'
import { useHash } from 'garuda-hooks'

function Navigation() {
  const [currentSection, setCurrentSection] = useState('home')
  const { hash, setHash } = useHash({
    value: currentSection,
    options: { replace: true }
  })

  const sections = ['home', 'about', 'services', 'contact']

  const handleSectionClick = (section: string) => {
    setCurrentSection(section)
    setHash() // This will use the updated currentSection value
  }

  return (
    <nav>
      {sections.map(section => (
        <button
          key={section}
          className={hash === section ? 'active' : ''}
          onClick={() => handleSectionClick(section)}
        >
          {section}
        </button>
      ))}
    </nav>
  )
}
```

### Filter State in URL

```tsx
import { useState, useEffect } from 'react'
import { useHash } from 'garuda-hooks'

function ProductList() {
  const [filterString, setFilterString] = useState('')
  const { parsed, setHash } = useHash({
    value: filterString,
    options: { parse: true, decode: true, replace: true }
  })

  const updateFilters = (key: string, value: string) => {
    const currentFilters = parsed || {}
    const newFilters = { ...currentFilters, [key]: value }
    
    // Remove empty values
    Object.keys(newFilters).forEach(k => {
      if (!newFilters[k]) delete newFilters[k]
    })
    
    const hashString = Object.entries(newFilters)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')
    
    setFilterString(hashString)
  }

  // Update URL when filter string changes
  useEffect(() => {
    if (filterString !== '') {
      setHash()
    }
  }, [filterString, setHash])

  return (
    <div>
      <select onChange={(e) => updateFilters('category', e.target.value)}>
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
      
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => updateFilters('search', e.target.value)}
      />
      
      {/* Current filters */}
      <pre>{JSON.stringify(parsed, null, 2)}</pre>
    </div>
  )
}
```

## TypeScript

The hook is fully typed. The `Options` interface is:

```typescript
interface Options {
  defaultHash?: string
  replace?: boolean
  parse?: boolean
  separator?: '&'
  decode?: boolean
}
```

## Browser Compatibility

This hook requires browser support for:
- `window.location.hash`
- `history.replaceState`
- `hashchange` event
- `decodeURIComponent`

All modern browsers support these features.