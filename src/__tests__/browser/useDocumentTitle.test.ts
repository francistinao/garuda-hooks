/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDocumentTitle } from '../../hooks/browser/useDocumentTitle'
import * as isSSRModule from '../../helpers/is-ssr'

describe('useDocumentTitle', () => {
  const originalTitle = document.title

  beforeEach(() => {
    document.title = 'Initial Title'
    vi.spyOn(isSSRModule, 'isSSR', 'get').mockReturnValue(false)
  })

  afterEach(() => {
    document.title = originalTitle
    vi.restoreAllMocks()
  })

  describe('basic functionality', () => {
    it('sets document title when provided', () => {
      renderHook(() =>
        useDocumentTitle({
          title: 'New Title',
          options: { restoreOnUnmount: false },
        }),
      )

      expect(document.title).toBe('New Title')
    })

    it('does not change title when title is undefined', () => {
      renderHook(() =>
        useDocumentTitle({
          options: { restoreOnUnmount: false },
        }),
      )

      expect(document.title).toBe('Initial Title')
    })

    it('does not change title when title is empty string', () => {
      renderHook(() =>
        useDocumentTitle({
          title: '',
          options: { restoreOnUnmount: false },
        }),
      )

      expect(document.title).toBe('Initial Title')
    })

    it('does not change title when title matches current document title', () => {
      document.title = 'Same Title'

      renderHook(() =>
        useDocumentTitle({
          title: 'Same Title',
          options: { restoreOnUnmount: false },
        }),
      )

      expect(document.title).toBe('Same Title')
    })
  })

  describe('restoreOnUnmount functionality', () => {
    it('restores original title when restoreOnUnmount is true and component unmounts', () => {
      const { unmount } = renderHook(() =>
        useDocumentTitle({
          title: 'Temporary Title',
          options: { restoreOnUnmount: true },
        }),
      )

      expect(document.title).toBe('Temporary Title')

      unmount()

      expect(document.title).toBe('Initial Title')
    })

    it('does not restore title when restoreOnUnmount is false and component unmounts', () => {
      const { unmount } = renderHook(() =>
        useDocumentTitle({
          title: 'Permanent Title',
          options: { restoreOnUnmount: false },
        }),
      )

      expect(document.title).toBe('Permanent Title')

      unmount()

      expect(document.title).toBe('Permanent Title')
    })

    it('restores title even when title changes multiple times', () => {
      const { rerender, unmount } = renderHook(
        ({ title }) =>
          useDocumentTitle({
            title,
            options: { restoreOnUnmount: true },
          }),
        { initialProps: { title: 'First Title' } },
      )

      expect(document.title).toBe('First Title')

      rerender({ title: 'Second Title' })
      expect(document.title).toBe('Second Title')

      rerender({ title: 'Third Title' })
      expect(document.title).toBe('Third Title')

      unmount()

      expect(document.title).toBe('Initial Title')
    })

    it('handles restoreOnUnmount option changes correctly', () => {
      const { rerender, unmount } = renderHook(
        ({ restoreOnUnmount }) =>
          useDocumentTitle({
            title: 'Test Title',
            options: { restoreOnUnmount },
          }),
        { initialProps: { restoreOnUnmount: false } },
      )

      expect(document.title).toBe('Test Title')

      rerender({ restoreOnUnmount: true })

      unmount()

      expect(document.title).toBe('Initial Title')
    })
  })

  describe('SSR handling', () => {
    it('does nothing in SSR environment', () => {
      vi.spyOn(isSSRModule, 'isSSR', 'get').mockReturnValue(true)

      renderHook(() =>
        useDocumentTitle({
          title: 'SSR Title',
          options: { restoreOnUnmount: true },
        }),
      )

      expect(document.title).toBe('Initial Title')
    })

    it('does not restore title on unmount in SSR environment', () => {
      vi.spyOn(isSSRModule, 'isSSR', 'get').mockReturnValue(true)

      const { unmount } = renderHook(() =>
        useDocumentTitle({
          title: 'SSR Title',
          options: { restoreOnUnmount: true },
        }),
      )

      unmount()

      expect(document.title).toBe('Initial Title')
    })
  })

  describe('edge cases', () => {
    it('handles null title gracefully', () => {
      renderHook(() =>
        useDocumentTitle({
          title: null as any,
          options: { restoreOnUnmount: false },
        }),
      )

      expect(document.title).toBe('Initial Title')
    })

    it('handles undefined options gracefully', () => {
      renderHook(() =>
        useDocumentTitle({
          title: 'Test Title',
          options: undefined as any,
        }),
      )

      expect(document.title).toBe('Test Title')
    })

    it('handles options with undefined restoreOnUnmount', () => {
      const { unmount } = renderHook(() =>
        useDocumentTitle({
          title: 'Test Title',
          options: { restoreOnUnmount: undefined as any },
        }),
      )

      expect(document.title).toBe('Test Title')

      unmount()

      expect(document.title).toBe('Test Title')
    })

    it('handles very long titles', () => {
      const longTitle = 'A'.repeat(10000)

      renderHook(() =>
        useDocumentTitle({
          title: longTitle,
          options: { restoreOnUnmount: false },
        }),
      )

      expect(document.title).toBe(longTitle)
    })

    it('handles titles with special characters', () => {
      const specialTitle = '🚀 Test Title with émojis & spéciál chäractersß 中文 العربية'

      renderHook(() =>
        useDocumentTitle({
          title: specialTitle,
          options: { restoreOnUnmount: false },
        }),
      )

      expect(document.title).toBe(specialTitle)
    })

    it('handles whitespace-only titles', () => {
      const whitespaceTitle = '   \n\t   '

      renderHook(() =>
        useDocumentTitle({
          title: whitespaceTitle,
          options: { restoreOnUnmount: false },
        }),
      )

      // JSDOM normalizes whitespace in document.title
      expect(document.title).toBe('')
    })

    it('handles rapid title changes', () => {
      const { rerender } = renderHook(
        ({ title }) =>
          useDocumentTitle({
            title,
            options: { restoreOnUnmount: true },
          }),
        { initialProps: { title: 'Title 1' } },
      )

      for (let i = 2; i <= 100; i++) {
        rerender({ title: `Title ${i}` })
        expect(document.title).toBe(`Title ${i}`)
      }
    })

    it('preserves original title when document.title changes externally', () => {
      const { unmount } = renderHook(() =>
        useDocumentTitle({
          title: 'Hook Title',
          options: { restoreOnUnmount: true },
        }),
      )

      expect(document.title).toBe('Hook Title')

      document.title = 'Externally Changed Title'

      unmount()

      expect(document.title).toBe('Initial Title')
    })

    it('handles multiple instances with different restore settings', () => {
      const { unmount: unmount1 } = renderHook(() =>
        useDocumentTitle({
          title: 'First Instance',
          options: { restoreOnUnmount: false },
        }),
      )

      const { unmount: unmount2 } = renderHook(() =>
        useDocumentTitle({
          title: 'Second Instance',
          options: { restoreOnUnmount: true },
        }),
      )

      expect(document.title).toBe('Second Instance')

      unmount1()
      expect(document.title).toBe('Second Instance')

      unmount2()
      // Second instance restores to what document.title was when it first mounted (First Instance)
      expect(document.title).toBe('First Instance')
    })
  })

  describe('dependency array behavior', () => {
    it('updates when title changes', () => {
      const { rerender } = renderHook(
        ({ title }) =>
          useDocumentTitle({
            title,
            options: { restoreOnUnmount: false },
          }),
        { initialProps: { title: 'First' } },
      )

      expect(document.title).toBe('First')

      rerender({ title: 'Second' })
      expect(document.title).toBe('Second')
    })

    it('updates when restoreOnUnmount changes', () => {
      const { rerender, unmount } = renderHook(
        ({ restoreOnUnmount }) =>
          useDocumentTitle({
            title: 'Test',
            options: { restoreOnUnmount },
          }),
        { initialProps: { restoreOnUnmount: false } },
      )

      rerender({ restoreOnUnmount: true })

      unmount()
      expect(document.title).toBe('Initial Title')
    })
  })
})
