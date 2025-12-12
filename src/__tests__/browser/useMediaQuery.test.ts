import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMediaQuery } from '../../hooks/browser/useMediaQuery'

// Helper to mock matchMedia
const createMatchMediaMock = (initial: boolean) => {
  let matches = initial
  let listener: ((event: MediaQueryListEvent) => void) | null = null
  const media: MediaQueryList = {
    matches,
    media: '(min-width: 600px)',
    onchange: null,
    addEventListener: (_type: unknown, cb: unknown) => {
      listener = cb as (event: MediaQueryListEvent) => void
    },
    removeEventListener: () => {
      listener = null
    },
    addListener: () => {
      // deprecated; no-op
    },
    removeListener: () => {
      // deprecated; no-op
    },
    dispatchEvent: () => false,
  }
  return {
    media,
    trigger: (next: boolean) => {
      matches = next
      if (listener) {
        listener({ matches: next, media: media.media } as MediaQueryListEvent)
      }
    },
  }
}

describe('useMediaQuery', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    vi.restoreAllMocks()
    if (!globalThis.window) {
      globalThis.window = {} as Window & typeof globalThis
    }
    window.matchMedia = originalMatchMedia
  })

  it('returns defaultMatch when matchMedia is missing (SSR-like)', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia

    const { result } = renderHook(() => useMediaQuery('(min-width: 600px)', { defaultMatch: true }))
    expect(result.current.matches).toBe(true)
  })

  it('uses ssrMatchMedia override when matchMedia is missing', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia

    const { result } = renderHook(() =>
      useMediaQuery('(min-width: 600px)', {
        defaultMatch: true,
        ssrMatchMedia: () => ({ matches: false }),
      }),
    )
    expect(result.current.matches).toBe(false)
  })

  it('initializes with match value when initializeWithValue is true', () => {
    const mock = createMatchMediaMock(true)
    window.matchMedia = vi.fn().mockReturnValue(mock.media)

    const { result } = renderHook(() =>
      useMediaQuery('(min-width: 600px)', { initializeWithValue: true }),
    )
    expect(result.current.matches).toBe(true)
  })

  it('falls back to defaultMatch when matchMedia is missing', () => {
    // @ts-expect-error allow reassignment for tests
    window.matchMedia = undefined

    const { result } = renderHook(() =>
      useMediaQuery('(min-width: 600px)', { defaultMatch: false }),
    )
    expect(result.current.matches).toBe(false)
  })

  it('updates when media query changes', () => {
    const mock = createMatchMediaMock(false)
    window.matchMedia = vi.fn().mockReturnValue(mock.media)

    const { result } = renderHook(() =>
      useMediaQuery('(min-width: 600px)', { initializeWithValue: true }),
    )

    expect(result.current.matches).toBe(false)

    act(() => {
      mock.trigger(true)
    })
    expect(result.current.matches).toBe(true)
  })

  it('cleans up listener on unmount', () => {
    const removeSpy = vi.fn()
    const mock: MediaQueryList = {
      matches: false,
      media: '(min-width: 600px)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: removeSpy,
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }
    window.matchMedia = vi.fn().mockReturnValue(mock)

    const { unmount } = renderHook(() =>
      useMediaQuery('(min-width: 600px)', { initializeWithValue: true }),
    )

    unmount()
    expect(removeSpy).toHaveBeenCalled()
  })

  it('handles empty query gracefully', () => {
    const mock = createMatchMediaMock(true)
    window.matchMedia = vi.fn().mockReturnValue(mock.media)

    const { result } = renderHook(() =>
      useMediaQuery('', { defaultMatch: false, initializeWithValue: true }),
    )
    // Because query is empty, matchMedia still returns matches=true from mock
    expect(result.current.matches).toBe(true)
  })

  it('respects initializeWithValue=false then updates on change', () => {
    const mock = createMatchMediaMock(false)
    window.matchMedia = vi.fn().mockReturnValue(mock.media)

    const { result } = renderHook(() =>
      useMediaQuery('(min-width: 600px)', {
        defaultMatch: true,
        initializeWithValue: false,
      }),
    )

    // initial should follow defaultMatch
    expect(result.current.matches).toBe(true)

    act(() => {
      mock.trigger(false)
    })
    expect(result.current.matches).toBe(false)
  })

  it('recomputes when query changes', () => {
    const mockSmall = createMatchMediaMock(false)
    const mockLarge = createMatchMediaMock(true)
    window.matchMedia = vi.fn((q: string) =>
      q === '(max-width: 500px)' ? mockSmall.media : mockLarge.media,
    )

    const { result, rerender } = renderHook(
      ({ q }) => useMediaQuery(q, { initializeWithValue: true }),
      { initialProps: { q: '(max-width: 500px)' } },
    )

    expect(result.current.matches).toBe(false)

    act(() => {
      rerender({ q: '(min-width: 600px)' })
    })

    act(() => {
      mockLarge.trigger(true)
    })
    expect(result.current.matches).toBe(true)
  })
})
