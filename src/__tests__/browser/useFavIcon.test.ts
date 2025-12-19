/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFavIcon } from '../../hooks/browser/useFavIcon'
import * as isSSRModule from '../../helpers/is-ssr'
import React from 'react'

// Mock react-dom/server
vi.mock('react-dom/server', () => ({
  renderToStaticMarkup: vi.fn((element: React.ReactElement) => {
    if (element.type === 'svg') {
      const props = element.props as any
      return `<svg${props?.children ? ` children="${props.children}"` : ''}></svg>`
    }
    return '<svg></svg>'
  }),
}))

describe('useFavIcon', () => {
  let originalFavIcon: HTMLLinkElement | null = null
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let originalHead: Element

  beforeEach(() => {
    // Mock DOM environment
    vi.spyOn(isSSRModule, 'isSSR', 'get').mockReturnValue(false)

    // Store original head and favicon
    originalHead = document.head
    originalFavIcon = document.querySelector('link[rel~="icon"]')

    // Clear any existing favicon links
    document.querySelectorAll('link[rel~="icon"]').forEach((link) => link.remove())

    // Mock queueMicrotask
    global.queueMicrotask = vi.fn((callback) => {
      callback()
    })
  })

  afterEach(() => {
    // Restore original state
    document.querySelectorAll('link[rel~="icon"]').forEach((link) => link.remove())

    if (originalFavIcon) {
      document.head.appendChild(originalFavIcon)
    }

    vi.restoreAllMocks()
  })

  describe('basic functionality', () => {
    it('creates favicon link element when none exists', () => {
      const { result } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
        }),
      )

      expect(document.querySelector('link[rel~="icon"]')).toBeTruthy()
      expect(result.current.currentHref).toBe('https://example.com/favicon.ico')
    })

    it('uses existing favicon link element when available', () => {
      const existingLink = document.createElement('link')
      existingLink.rel = 'icon'
      existingLink.href = 'https://existing.com/favicon.ico'
      document.head.appendChild(existingLink)

      const { result } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
        }),
      )

      const links = document.querySelectorAll('link[rel~="icon"]')
      expect(links).toHaveLength(1)
      expect(result.current.currentHref).toBe('https://example.com/favicon.ico')
    })

    it('sets favicon with string URL', () => {
      const { result } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
        }),
      )

      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      expect(link.href).toBe('https://example.com/favicon.ico')
      expect(result.current.currentHref).toBe('https://example.com/favicon.ico')
    })

    it('converts React element to data URI', () => {
      const icon = React.createElement('svg', { children: 'test' })
      const { result } = renderHook(() =>
        useFavIcon({
          icon,
        }),
      )

      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      expect(link.href).toMatch(/^data:image\/svg\+xml,/)
      expect(result.current.currentHref).toMatch(/^data:image\/svg\+xml,/)
    })
  })

  describe('setFavicon function', () => {
    it('updates favicon with new string URL', () => {
      const { result } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
        }),
      )

      act(() => {
        result.current.setFavicon('https://new.com/favicon.ico')
      })

      expect(result.current.currentHref).toBe('https://new.com/favicon.ico')
      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      expect(link.href).toBe('https://new.com/favicon.ico')
    })

    it('updates favicon with React element', () => {
      const { result } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
        }),
      )

      const newIcon = React.createElement('svg', { children: 'new' })
      act(() => {
        result.current.setFavicon(newIcon)
      })

      expect(result.current.currentHref).toMatch(/^data:image\/svg\+xml,/)
      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      expect(link.href).toMatch(/^data:image\/svg\+xml,/)
    })

    it('handles invalid React element gracefully', () => {
      const { result } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
        }),
      )

      const originalHref = result.current.currentHref
      result.current.setFavicon({} as any)

      expect(result.current.currentHref).toBe(originalHref)
    })
  })

  describe('restore functionality', () => {
    it('restores previous favicon when restore is called', () => {
      const existingLink = document.createElement('link')
      existingLink.rel = 'icon'
      existingLink.href = 'https://original.com/favicon.ico'
      document.head.appendChild(existingLink)

      const { result } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
        }),
      )

      expect(result.current.currentHref).toBe('https://example.com/favicon.ico')

      act(() => {
        result.current.restore()
      })

      expect(result.current.currentHref).toBe('https://original.com/favicon.ico')
      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      expect(link.href).toBe('https://original.com/favicon.ico')
    })

    it('handles restore when no previous favicon exists', () => {
      const { result } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
        }),
      )

      act(() => {
        result.current.restore()
      })

      // When no previous favicon exists, restore does nothing
      expect(result.current.currentHref).toBe('https://example.com/favicon.ico')
    })
  })

  describe('restoreOnUnmount functionality', () => {
    it('restores original favicon when restoreOnUnmount is true and component unmounts', () => {
      const existingLink = document.createElement('link')
      existingLink.rel = 'icon'
      existingLink.href = 'https://original.com/favicon.ico'
      document.head.appendChild(existingLink)

      const { unmount } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
          options: { restoreOnUnmount: true },
        }),
      )

      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      expect(link.href).toBe('https://example.com/favicon.ico')

      unmount()

      expect(link.href).toBe('https://original.com/favicon.ico')
    })

    it('does not restore favicon when restoreOnUnmount is false and component unmounts', () => {
      const existingLink = document.createElement('link')
      existingLink.rel = 'icon'
      existingLink.href = 'https://original.com/favicon.ico'
      document.head.appendChild(existingLink)

      const { unmount } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
          options: { restoreOnUnmount: false },
        }),
      )

      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      expect(link.href).toBe('https://example.com/favicon.ico')

      unmount()

      expect(link.href).toBe('https://example.com/favicon.ico')
    })

    it('restores favicon even when icon changes multiple times', () => {
      const existingLink = document.createElement('link')
      existingLink.rel = 'icon'
      existingLink.href = 'https://original.com/favicon.ico'
      document.head.appendChild(existingLink)

      const { rerender, unmount } = renderHook(
        ({ icon }) =>
          useFavIcon({
            icon,
            options: { restoreOnUnmount: true },
          }),
        { initialProps: { icon: 'https://first.com/favicon.ico' } },
      )

      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      expect(link.href).toBe('https://first.com/favicon.ico')

      rerender({ icon: 'https://second.com/favicon.ico' })
      expect(link.href).toBe('https://second.com/favicon.ico')

      rerender({ icon: 'https://third.com/favicon.ico' })
      expect(link.href).toBe('https://third.com/favicon.ico')

      unmount()

      expect(link.href).toBe('https://original.com/favicon.ico')
    })
  })

  describe('SSR handling', () => {
    it('does nothing in SSR environment', () => {
      vi.spyOn(isSSRModule, 'isSSR', 'get').mockReturnValue(true)

      const { result } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
        }),
      )

      expect(document.querySelector('link[rel~="icon"]')).toBeNull()
      expect(result.current.currentHref).toBe(null)
    })

    it('setFavicon does nothing in SSR environment', () => {
      vi.spyOn(isSSRModule, 'isSSR', 'get').mockReturnValue(true)

      const { result } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
        }),
      )

      result.current.setFavicon('https://new.com/favicon.ico')

      expect(document.querySelector('link[rel~="icon"]')).toBeNull()
      expect(result.current.currentHref).toBe(null)
    })
  })

  describe('edge cases', () => {
    it('handles null icon gracefully', () => {
      const { result } = renderHook(() =>
        useFavIcon({
          icon: null as any,
        }),
      )

      expect(result.current.currentHref).toBe(null)
    })

    it('handles undefined icon gracefully', () => {
      const { result } = renderHook(() =>
        useFavIcon({
          icon: undefined as any,
        }),
      )

      expect(result.current.currentHref).toBe(null)
    })

    it('handles empty string icon', () => {
      const { result } = renderHook(() =>
        useFavIcon({
          icon: '',
        }),
      )

      // Empty string is falsy, so it doesn't set the favicon
      expect(result.current.currentHref).toBe(null)
    })

    it('handles undefined options gracefully', () => {
      const { result } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
          options: undefined,
        }),
      )

      expect(result.current.currentHref).toBe('https://example.com/favicon.ico')
    })

    it('handles options with undefined restoreOnUnmount', () => {
      const existingLink = document.createElement('link')
      existingLink.rel = 'icon'
      existingLink.href = 'https://original.com/favicon.ico'
      document.head.appendChild(existingLink)

      const { unmount } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
          options: { restoreOnUnmount: undefined as any },
        }),
      )

      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      expect(link.href).toBe('https://example.com/favicon.ico')

      unmount()

      expect(link.href).toBe('https://example.com/favicon.ico')
    })

    it('handles very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(10000) + '/favicon.ico'

      const { result } = renderHook(() =>
        useFavIcon({
          icon: longUrl,
        }),
      )

      expect(result.current.currentHref).toBe(longUrl)
    })

    it('handles URLs with special characters', () => {
      const specialUrl = 'https://example.com/🚀/favicon.ico?test=émoji&special=spéciál'

      const { result } = renderHook(() =>
        useFavIcon({
          icon: specialUrl,
        }),
      )

      expect(result.current.currentHref).toBe(specialUrl)
    })

    it('handles rapid icon changes', () => {
      const { rerender, result } = renderHook(
        ({ icon }) =>
          useFavIcon({
            icon,
          }),
        { initialProps: { icon: 'https://example.com/1.ico' } },
      )

      for (let i = 2; i <= 100; i++) {
        const newIcon = `https://example.com/${i}.ico`
        rerender({ icon: newIcon })
        expect(result.current.currentHref).toBe(newIcon)
      }
    })

    it('handles invalid React elements', () => {
      const { result } = renderHook(() =>
        useFavIcon({
          icon: { type: 'div' } as any,
        }),
      )

      expect(result.current.currentHref).toBe(null)
    })

    it('handles complex React elements with nested structure', () => {
      const complexIcon = React.createElement('svg', {
        width: '32',
        height: '32',
        children: [
          React.createElement('circle', { cx: '16', cy: '16', r: '8', fill: 'red' }),
          React.createElement('rect', { x: '12', y: '12', width: '8', height: '8', fill: 'blue' }),
        ],
      })

      const { result } = renderHook(() =>
        useFavIcon({
          icon: complexIcon,
        }),
      )

      expect(result.current.currentHref).toMatch(/^data:image\/svg\+xml,/)
    })

    it('preserves original favicon when link href changes externally', () => {
      const existingLink = document.createElement('link')
      existingLink.rel = 'icon'
      existingLink.href = 'https://original.com/favicon.ico'
      document.head.appendChild(existingLink)

      const { unmount } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
          options: { restoreOnUnmount: true },
        }),
      )

      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      expect(link.href).toBe('https://example.com/favicon.ico')

      link.href = 'https://externally-changed.com/favicon.ico'

      unmount()

      expect(link.href).toBe('https://original.com/favicon.ico')
    })

    it('handles multiple instances with different restore settings', () => {
      const existingLink = document.createElement('link')
      existingLink.rel = 'icon'
      existingLink.href = 'https://original.com/favicon.ico'
      document.head.appendChild(existingLink)

      const { unmount: unmount1 } = renderHook(() =>
        useFavIcon({
          icon: 'https://first.com/favicon.ico',
          options: { restoreOnUnmount: false },
        }),
      )

      const { unmount: unmount2 } = renderHook(() =>
        useFavIcon({
          icon: 'https://second.com/favicon.ico',
          options: { restoreOnUnmount: true },
        }),
      )

      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      expect(link.href).toBe('https://second.com/favicon.ico')

      unmount1()
      expect(link.href).toBe('https://second.com/favicon.ico')

      unmount2()
      expect(link.href).toBe('https://first.com/favicon.ico')
    })

    it('handles data URI icons', () => {
      const dataUri =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      const { result } = renderHook(() =>
        useFavIcon({
          icon: dataUri,
        }),
      )

      expect(result.current.currentHref).toBe(dataUri)
    })

    it('handles blob URLs', () => {
      const blob = new Blob(['<svg></svg>'], { type: 'image/svg+xml' })
      const blobUrl = URL.createObjectURL(blob)

      const { result } = renderHook(() =>
        useFavIcon({
          icon: blobUrl,
        }),
      )

      expect(result.current.currentHref).toBe(blobUrl)

      URL.revokeObjectURL(blobUrl)
    })
  })

  describe('dependency array behavior', () => {
    it('updates when icon changes', () => {
      const { rerender, result } = renderHook(
        ({ icon }) =>
          useFavIcon({
            icon,
          }),
        { initialProps: { icon: 'https://first.com/favicon.ico' } },
      )

      expect(result.current.currentHref).toBe('https://first.com/favicon.ico')

      rerender({ icon: 'https://second.com/favicon.ico' })
      expect(result.current.currentHref).toBe('https://second.com/favicon.ico')
    })

    it('updates when restoreOnUnmount changes', () => {
      const existingLink = document.createElement('link')
      existingLink.rel = 'icon'
      existingLink.href = 'https://original.com/favicon.ico'
      document.head.appendChild(existingLink)

      const { rerender, unmount } = renderHook(
        ({ restoreOnUnmount }) =>
          useFavIcon({
            icon: 'https://test.com/favicon.ico',
            options: { restoreOnUnmount },
          }),
        { initialProps: { restoreOnUnmount: false } },
      )

      rerender({ restoreOnUnmount: true })

      unmount()

      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      expect(link.href).toBe('https://original.com/favicon.ico')
    })
  })

  describe('Next.js specific scenarios', () => {
    it('handles client-side navigation', () => {
      const { result, rerender } = renderHook(
        ({ route }) =>
          useFavIcon({
            icon: `https://example.com/${route}/favicon.ico`,
          }),
        { initialProps: { route: 'home' } },
      )

      expect(result.current.currentHref).toBe('https://example.com/home/favicon.ico')

      rerender({ route: 'about' })
      expect(result.current.currentHref).toBe('https://example.com/about/favicon.ico')

      rerender({ route: 'contact' })
      expect(result.current.currentHref).toBe('https://example.com/contact/favicon.ico')
    })

    it('handles dynamic imports and lazy loading', async () => {
      const dynamicIcon = React.createElement('svg', {
        viewBox: '0 0 32 32',
        children: 'Dynamic Icon',
      })

      const { result } = renderHook(() =>
        useFavIcon({
          icon: dynamicIcon,
        }),
      )

      expect(result.current.currentHref).toMatch(/^data:image\/svg\+xml,/)
    })
  })

  describe('React strict mode compatibility', () => {
    it('handles double effect execution in strict mode', () => {
      const { result } = renderHook(() =>
        useFavIcon({
          icon: 'https://example.com/favicon.ico',
        }),
      )

      // Simulate React strict mode double execution
      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement
      const originalHref = link.href

      // Re-run the effect
      act(() => {
        result.current.setFavicon('https://example.com/favicon.ico')
      })

      expect(link.href).toBe(originalHref)
      expect(result.current.currentHref).toBe('https://example.com/favicon.ico')
    })
  })
})
