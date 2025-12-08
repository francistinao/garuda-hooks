# garuda-hooks

A production-ready, TypeScript-first collection of React and Next.js hooks. Built with SSR safety, strict typing, and consistent APIs in mind.

## Author

Francis Tin-ao

## Features

- TypeScript-first with strict mode, no `any`
- SSR-safe defaults for browser APIs
- Consistent return patterns (tuple or object) across hooks
- ESM + CJS output with generated types
- Tested with Vitest + React Testing Library
- Tree-shakeable per-hook entry points

## Installation

```bash
npm install garuda-hooks
# or
yarn add garuda-hooks
# or
pnpm add garuda-hooks
```

## Quick Start

```tsx
import { useLocalStorage } from 'garuda-hooks'

function Example() {
  const [value, setValue, remove] = useLocalStorage('key', 'hello')
  return (
    <div>
      <p>{value}</p>
      <button onClick={() => setValue('world')}>Set</button>
      <button onClick={remove}>Remove</button>
    </div>
  )
}
```

## Hook Categories (Planned)

- Storage: `useLocalStorage`, `useSessionStorage`
- Timing: `useDebounce`, `useDebouncedValue`, `useThrottle`, `useInterval`, `useTimeout`
- DOM: `useClickOutside`, `useHover`, `useIntersectionObserver`, `useEventListener`
- Browser: `useMediaQuery`, `useClipboard`, `useNetwork`, `useWindowSize`, `useElementSize`, `useIdle`
- State: `useToggle`, `useDisclosure`, `usePrevious`, `useCounter`, `useList`, `useMap`, `useSet`
- Next.js: `useHydrated`, `useIsServer`, `useIsomorphicLayoutEffect`
- Input: `useHotkeys`, `useLongPress`
- Specialized: `useFullscreen`, `useGeolocation`, `useOrientation`, `useColorScheme`, `useDocumentTitle`, `useFavicon`, `useHash`, `useScrollLock`, `useMouse`

## Core Principles

- SSR Safety: guard all browser APIs; return sensible defaults on the server.
- TypeScript First: strict typing, exported types, inference-friendly signatures.
- Consistent APIs: predictable return shapes per hook category.
- Cleanup Guarantees: listeners, timers, observers cleaned up on unmount.
- Options Objects: extensible options instead of positional params.

## Project Structure

```
src/
  hooks/
    state/       # useToggle, useDisclosure, usePrevious, ...
    storage/     # useLocalStorage, useSessionStorage
    dom/         # useClickOutside, useHover, useIntersectionObserver
    timing/      # useDebounce, useThrottle, useInterval, useTimeout
    browser/     # useMediaQuery, useClipboard, useNetwork
    nextjs/      # useHydrated, useIsServer
    index.ts     # category barrels
  utils/         # isServer, noop, types
  index.ts       # root barrel and per-hook exports
__tests__/       # mirrors src structure
docs/            # guides
```

## Scripts

- `lint` — ESLint over src and tests
- `format` / `format:write` — Prettier check / write
- `typecheck` — `tsc --noEmit`
- `test` — Vitest run
- `build` — Rollup (ESM/CJS + types)

## Development

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

## Testing

- Vitest + @testing-library/react
- Mock browser APIs where needed (localStorage, matchMedia, IntersectionObserver)
- `npm run test -- --watch` for watch mode

## License

MIT

