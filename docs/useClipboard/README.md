# useClipboard

A simple and efficient hook for copying content to the clipboard using ref targeting with automatic feedback management.

## Features

- 📋 **Ref-Based**: Target any DOM element for clipboard copying
- ⚡ **Automatic Feedback**: Built-in copy state management with auto-reset
- 🔒 **SSR Safe**: Works seamlessly with Next.js and other SSR frameworks
- 🎯 **TypeScript**: Full type safety with generic ref support
- 📱 **Modern API**: Uses the modern Clipboard API with fallbacks

## API Reference

```typescript
interface UseClipboardReturn {
  ref: RefObject<HTMLElement | null>
  copied: boolean
  copy: () => Promise<boolean>
}

function useClipboard(): UseClipboardReturn
```

## Usage Examples

### Basic Text Copy

```tsx
import { useClipboard } from 'garuda-hooks'

function CopyTextExample() {
  const { ref, copied, copy } = useClipboard()

  return (
    <div>
      <p ref={ref}>This text will be copied to clipboard!</p>
      <button onClick={copy}>
        {copied ? 'Copied!' : 'Copy Text'}
      </button>
    </div>
  )
}
```

### Code Block Copy

```tsx
function CodeBlockWithCopy() {
  const { ref, copied, copy } = useClipboard()

  const codeSnippet = `
function greet(name: string) {
  return \`Hello, \${name}!\`
}
  `.trim()

  return (
    <div className="relative">
      <pre 
        ref={ref} 
        className="bg-gray-100 p-4 rounded overflow-x-auto"
      >
        <code>{codeSnippet}</code>
      </pre>
      
      <button
        onClick={copy}
        className={`absolute top-2 right-2 px-3 py-1 rounded text-sm ${
          copied 
            ? 'bg-green-500 text-white' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}
```

### Share Button with URL

```tsx
function ShareUrlButton() {
  const { ref, copied, copy } = useClipboard()

  // Hidden element containing the URL
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div>
      <span ref={ref} style={{ display: 'none' }}>
        {currentUrl}
      </span>
      
      <button 
        onClick={copy}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        <ShareIcon />
        {copied ? 'Link Copied!' : 'Share Page'}
      </button>
    </div>
  )
}
```

### Multiple Copy Targets

```tsx
function MultiCopyExample() {
  const emailClipboard = useClipboard()
  const phoneClipboard = useClipboard()
  const addressClipboard = useClipboard()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span ref={emailClipboard.ref}>john.doe@example.com</span>
        <button 
          onClick={emailClipboard.copy}
          className={emailClipboard.copied ? 'text-green-600' : 'text-blue-600'}
        >
          {emailClipboard.copied ? 'Copied!' : 'Copy Email'}
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <span ref={phoneClipboard.ref}>+1 (555) 123-4567</span>
        <button 
          onClick={phoneClipboard.copy}
          className={phoneClipboard.copied ? 'text-green-600' : 'text-blue-600'}
        >
          {phoneClipboard.copied ? 'Copied!' : 'Copy Phone'}
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        <span ref={addressClipboard.ref}>123 Main St, City, State 12345</span>
        <button 
          onClick={addressClipboard.copy}
          className={addressClipboard.copied ? 'text-green-600' : 'text-blue-600'}
        >
          {addressClipboard.copied ? 'Copied!' : 'Copy Address'}
        </button>
      </div>
    </div>
  )
}
```

### Table Row Copy

```tsx
interface User {
  id: string
  name: string
  email: string
  role: string
}

function UserTable({ users }: { users: User[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </tbody>
    </table>
  )
}

function UserRow({ user }: { user: User }) {
  const { ref, copied, copy } = useClipboard()

  return (
    <tr>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>{user.role}</td>
      <td>
        {/* Hidden element with formatted user info */}
        <span ref={ref} style={{ display: 'none' }}>
          {`${user.name} (${user.email}) - ${user.role}`}
        </span>
        <button 
          onClick={copy}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {copied ? 'Copied!' : 'Copy Info'}
        </button>
      </td>
    </tr>
  )
}
```

## Next.js Specific Usage

### App Router Component

```tsx
'use client'

import { useClipboard } from 'garuda-hooks'

export default function ClientClipboardComponent() {
  const { ref, copied, copy } = useClipboard()

  return (
    <div className="p-4">
      <h2 ref={ref}>Welcome to Next.js App Router</h2>
      <button 
        onClick={copy}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {copied ? 'Title Copied!' : 'Copy Title'}
      </button>
    </div>
  )
}
```

### API Response Copy

```tsx
function ApiResponseCopier() {
  const { ref, copied, copy } = useClipboard()
  const [apiResponse, setApiResponse] = useState('')

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data')
      const data = await response.json()
      setApiResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  return (
    <div>
      <button onClick={fetchData} className="mb-4 px-4 py-2 bg-green-500 text-white rounded">
        Fetch API Data
      </button>
      
      {apiResponse && (
        <div className="relative">
          <pre 
            ref={ref}
            className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96"
          >
            {apiResponse}
          </pre>
          <button
            onClick={copy}
            className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
        </div>
      )}
    </div>
  )
}
```

### SSR-Safe Implementation

```tsx
import { useClipboard } from 'garuda-hooks'
import { useEffect, useState } from 'react'

function SSRSafeClipboard() {
  const { ref, copied, copy } = useClipboard()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div>
        <p>Content will be copyable once loaded...</p>
        <button disabled>Copy (Loading...)</button>
      </div>
    )
  }

  return (
    <div>
      <p ref={ref}>This content is now copyable!</p>
      <button onClick={copy}>
        {copied ? 'Copied!' : 'Copy Content'}
      </button>
    </div>
  )
}
```

## Advanced Patterns

### Copy with Custom Formatting

```tsx
function FormattedCopyExample() {
  const { ref, copied, copy } = useClipboard()
  
  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-123-4567',
    address: '123 Main St, City, State 12345'
  }

  // Format data for clipboard
  const formattedData = `
Contact Information:
Name: ${userData.name}
Email: ${userData.email}
Phone: ${userData.phone}
Address: ${userData.address}
  `.trim()

  return (
    <div>
      <div className="bg-gray-100 p-4 rounded">
        <h3>Contact Details</h3>
        <p><strong>Name:</strong> {userData.name}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Phone:</strong> {userData.phone}</p>
        <p><strong>Address:</strong> {userData.address}</p>
      </div>
      
      {/* Hidden formatted content */}
      <span ref={ref} style={{ display: 'none' }}>
        {formattedData}
      </span>
      
      <button 
        onClick={copy}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {copied ? 'Contact Info Copied!' : 'Copy All Details'}
      </button>
    </div>
  )
}
```

### Copy with Notification

```tsx
function CopyWithNotification() {
  const { ref, copied, copy } = useClipboard()
  const [showNotification, setShowNotification] = useState(false)

  const handleCopy = async () => {
    const success = await copy()
    if (success) {
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }
  }

  return (
    <div className="relative">
      <div ref={ref} className="p-4 border rounded">
        <h3>Important Information</h3>
        <p>This content will be copied with a custom notification.</p>
      </div>
      
      <button 
        onClick={handleCopy}
        className="mt-2 px-4 py-2 bg-purple-500 text-white rounded"
      >
        Copy Content
      </button>
      
      {showNotification && (
        <div className="absolute top-0 right-0 bg-green-500 text-white p-2 rounded shadow-lg">
          ✓ Successfully copied to clipboard!
        </div>
      )}
    </div>
  )
}
```

### Conditional Copy Content

```tsx
function ConditionalCopyContent() {
  const { ref, copied, copy } = useClipboard()
  const [copyMode, setCopyMode] = useState<'plain' | 'formatted'>('plain')
  
  const plainText = "Visit our website for more information."
  const formattedText = "🌟 Visit our website for more information: https://example.com 🌟"

  return (
    <div>
      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={copyMode === 'plain'}
            onChange={() => setCopyMode('plain')}
          />
          Plain text
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={copyMode === 'formatted'}
            onChange={() => setCopyMode('formatted')}
          />
          Formatted text
        </label>
      </div>
      
      <p>Preview: {copyMode === 'plain' ? plainText : formattedText}</p>
      
      <span ref={ref} style={{ display: 'none' }}>
        {copyMode === 'plain' ? plainText : formattedText}
      </span>
      
      <button 
        onClick={copy}
        className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded"
      >
        {copied ? `${copyMode} text copied!` : `Copy ${copyMode} text`}
      </button>
    </div>
  )
}
```

## Best Practices

### 1. Accessible Copy Buttons

```tsx
function AccessibleCopyButton() {
  const { ref, copied, copy } = useClipboard()

  return (
    <div>
      <p ref={ref} id="content-to-copy">
        This is the content that will be copied.
      </p>
      <button
        onClick={copy}
        aria-describedby="content-to-copy"
        aria-label={copied ? 'Content copied to clipboard' : 'Copy content to clipboard'}
        className="px-4 py-2 bg-blue-500 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
```

### 2. Error Handling

```tsx
function RobustCopyImplementation() {
  const { ref, copied, copy } = useClipboard()
  const [error, setError] = useState<string | null>(null)

  const handleCopy = async () => {
    setError(null)
    try {
      const success = await copy()
      if (!success) {
        setError('Failed to copy content. Please try again.')
      }
    } catch (err) {
      setError('Clipboard access denied or unavailable.')
    }
  }

  return (
    <div>
      <p ref={ref}>Content to copy</p>
      <button onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
```

### 3. Performance Optimization

```tsx
function OptimizedCopyComponent() {
  const { ref, copied, copy } = useClipboard()
  
  // Memoize the copy handler to prevent unnecessary re-renders
  const handleCopy = useCallback(async () => {
    await copy()
  }, [copy])

  return (
    <div>
      <p ref={ref}>Optimized content for copying</p>
      <button onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
```

## Common Use Cases

### Documentation Site

```tsx
function DocumentationCodeBlock({ code, language }: { code: string; language: string }) {
  const { ref, copied, copy } = useClipboard()

  return (
    <div className="relative group">
      <pre 
        ref={ref}
        className={`language-${language} p-4 rounded bg-gray-900 text-white overflow-x-auto`}
      >
        <code>{code}</code>
      </pre>
      
      <button
        onClick={copy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
      >
        {copied ? '✓' : 'Copy'}
      </button>
    </div>
  )
}
```

### Contact Information Card

```tsx
interface ContactInfo {
  name: string
  email: string
  phone: string
  linkedin: string
}

function ContactCard({ contact }: { contact: ContactInfo }) {
  const emailClipboard = useClipboard()
  const phoneClipboard = useClipboard()

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">{contact.name}</h3>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span ref={emailClipboard.ref}>{contact.email}</span>
          <button 
            onClick={emailClipboard.copy}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {emailClipboard.copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span ref={phoneClipboard.ref}>{contact.phone}</span>
          <button 
            onClick={phoneClipboard.copy}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {phoneClipboard.copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

## Troubleshooting

### Clipboard Not Working
The hook requires HTTPS in production and user gesture:

```tsx
function ClipboardTroubleshooting() {
  const { ref, copied, copy } = useClipboard()
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    // Check if clipboard API is supported
    if (!navigator.clipboard) {
      setSupported(false)
    }
  }, [])

  if (!supported) {
    return (
      <div>
        <p ref={ref}>Content to copy (fallback)</p>
        <button onClick={() => {
          // Fallback: select text for manual copy
          if (ref.current) {
            const selection = window.getSelection()
            const range = document.createRange()
            range.selectNodeContents(ref.current)
            selection?.removeAllRanges()
            selection?.addRange(range)
          }
        }}>
          Select Text (Clipboard not supported)
        </button>
      </div>
    )
  }

  return (
    <div>
      <p ref={ref}>Content to copy</p>
      <button onClick={copy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
```

### Empty Content Issue
Ensure the ref target has content:

```tsx
function ContentValidation() {
  const { ref, copied, copy } = useClipboard()
  const [content, setContent] = useState('')

  const handleCopy = async () => {
    if (!content.trim()) {
      alert('No content to copy!')
      return
    }
    await copy()
  }

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter content to copy"
        className="w-full p-2 border rounded"
      />
      <p ref={ref} style={{ display: 'none' }}>{content}</p>
      <button 
        onClick={handleCopy}
        disabled={!content.trim()}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {copied ? 'Copied!' : 'Copy Content'}
      </button>
    </div>
  )
}
```