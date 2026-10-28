"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * True once the component is rendering on the client after hydration.
 *
 * The cart and orders stores are persisted in localStorage, which the server
 * cannot read. Rendering their contents during SSR would produce markup that
 * differs from the first client render (a hydration mismatch). The classic
 * workaround — `useState(false)` + `useEffect(() => setMounted(true))` — works
 * but triggers an extra render and the `react-hooks/set-state-in-effect` lint
 * rule. `useSyncExternalStore` expresses the same idea without the effect:
 * the server snapshot is `false`, the client snapshot is `true`.
 */
export default function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
