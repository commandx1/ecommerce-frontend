import {
  isServer,
  type MutationCacheNotifyEvent,
  matchQuery,
  type Query,
  type QueryCacheNotifyEvent,
  type QueryClient,
} from "@tanstack/react-query"
import { create } from "zustand"
import {
  type AutoOrderWrite,
  type CartData,
  cartWriteInFlightFilters,
  createCartCommands,
  fetchErrorMessage,
  getCartCommandName,
  type RefreshCartOptions,
  refreshCart,
  writeErrorMessage,
} from "@/features/cart/api/cart-queries"
import type { CartItem } from "@/lib/api/cart"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import { queryKeys } from "@/lib/query/keys"
import { subscribeBrowserQueryClient } from "@/lib/query/query-client"

/**
 * Legacy facade over the cart query cache (Phase 2 strangler, design doc §5 / §7 step 2).
 *
 * The query-cache entry `queryKeys.cart.detail()` is the single source of truth for server cart
 * data; every action here delegates to `refreshCart` / the cart commands in
 * `features/cart/api/cart-queries.ts`. The state fields below are a strictly ONE-WAY projection:
 * they are written only by the QueryCache / MutationCache subscription at the bottom of this file
 * (plus `resetCart`), never pushed back into the cache. Public shape and observable behaviour are
 * kept identical for the existing consumers until the store is deleted (step 7).
 */
interface CartStore {
  cartId: string | null
  items: CartItem[]
  cartCount: number
  isLoading: boolean
  error: string | null
  /**
   * Informational only (kept for API shape): when the cart was last fetched - successfully or
   * not - `0` after `resetCart`/`clearCart`. It no longer drives de-duplication; the query
   * cache's `staleTime` and `refreshCart`'s failure window do.
   */
  lastFetchedAt: number
  resetCart: () => void
  fetchCart: (options?: RefreshCartOptions) => Promise<void>
  addToCart: (userProductId: string, quantity?: number, autoOrder?: AutoOrderWrite) => Promise<void>
  removeFromCart: (userProductId: string) => Promise<void>
  updateQuantity: (userProductId: string, quantity: number, autoOrder?: AutoOrderWrite) => Promise<void>
  setItemAutoOrder: (userProductId: string, autoOrder: AutoOrderPeriod | null, quantity?: number) => Promise<void>
  clearCart: () => Promise<void>
}

type CartProjection = Pick<CartStore, "cartId" | "items" | "cartCount" | "isLoading" | "error" | "lastFetchedAt">

const INITIAL_PROJECTION: CartProjection = {
  cartId: null,
  items: [],
  cartCount: 0,
  isLoading: false,
  error: null,
  lastFetchedAt: 0,
}

/**
 * The commands resolve `autoOrder`, the item for `setItemAutoOrder` and the `cartId` for
 * `clearCart` against this store's own state - exactly what the old actions read via `get()`. In
 * the app that state IS the cache entry (synchronous projection); reading it here additionally
 * keeps tests that seed `useCartStore` directly behaving as before.
 */
const storeCommands = createCartCommands(() => {
  const { cartId, items } = useCartStore.getState()
  return { cartId, cartItems: items }
})

export const useCartStore = create<CartStore>((set) => ({
  ...INITIAL_PROJECTION,

  /**
   * Resets the projection. Clearing the cache itself on logout / account switch is
   * `QuerySessionBoundary`'s job (it runs first: `clearLocalSession` clears the auth user before
   * calling this). The cart entry is additionally marked stale - the old `lastFetchedAt = 0` - so
   * the next `fetchCart` goes to the network instead of being answered by the dedup window.
   */
  resetCart: () => {
    void binding?.client.invalidateQueries({ queryKey: queryKeys.cart.detail(), refetchType: "none" })
    set({ ...INITIAL_PROJECTION })
  },

  fetchCart: async (options = {}) => {
    if (isServer) return
    await refreshCart(options)
  },

  addToCart: async (userProductId, quantity = 1, autoOrder) => {
    if (isServer) return
    await storeCommands.addItem(userProductId, quantity, autoOrder)
  },

  removeFromCart: async (userProductId) => {
    if (isServer) return
    await storeCommands.removeItem(userProductId)
  },

  updateQuantity: async (userProductId, quantity, autoOrder) => {
    if (isServer) return
    await storeCommands.updateQuantity(userProductId, quantity, autoOrder)
  },

  /**
   * Quantity and schedule share one endpoint, so an explicit `quantity` lets the caller flush a
   * still-debounced quantity edit in the same write. A non-auth failure rethrows but deliberately
   * does NOT write the shared `error` (see `writeErrorMessage` in `cart-queries.ts`): useCartPage
   * shows its own "Could not update auto-reorder" toast off the rethrow AND a generic "Cart
   * unavailable" toast whenever `error` changes - setting both would fire two toasts for one
   * failure.
   */
  setItemAutoOrder: async (userProductId, autoOrder, quantity) => {
    if (isServer) return
    await storeCommands.setItemAutoOrder(userProductId, autoOrder, quantity)
  },

  clearCart: async () => {
    if (isServer) return
    await storeCommands.clearCart()
  },
}))

// ---------------------------------------------------------------------------------------------
// Projection: QueryCache / MutationCache -> store state
// ---------------------------------------------------------------------------------------------

function projectData(data: CartData): Pick<CartProjection, "cartId" | "items" | "cartCount"> {
  return {
    cartId: data.cartId,
    items: data.cartItems,
    cartCount: data.cartItems.reduce((acc, item) => acc + item.quantity, 0),
  }
}

const CART_DETAIL_FILTER = { queryKey: queryKeys.cart.detail(), exact: true } as const

function liveCartQuery(client: QueryClient): Query | undefined {
  return client.getQueryCache().find(CART_DETAIL_FILTER)
}

/** Old `isLoading`: true while the cart GET or a cart write request is in flight. */
function computeIsLoading(client: QueryClient): boolean {
  const query = liveCartQuery(client)
  if (query !== undefined && query.state.fetchStatus !== "idle") {
    return true
  }

  return client.getMutationCache().findAll(cartWriteInFlightFilters).length > 0
}

/** Writes only the fields that actually changed, so whole-store subscribers don't re-render for nothing. */
function patch(partial: Partial<CartProjection>): void {
  const current = useCartStore.getState()
  const changed = (Object.keys(partial) as (keyof CartProjection)[]).some(
    (key) => !Object.is(current[key], partial[key]),
  )
  if (changed) {
    useCartStore.setState(partial)
  }
}

function onQueryCacheEvent(client: QueryClient, event: QueryCacheNotifyEvent): void {
  if (binding?.client !== client || !matchQuery(CART_DETAIL_FILTER, event.query)) {
    return
  }

  const live = liveCartQuery(client)

  if (event.type === "removed") {
    // Cache cleared (QuerySessionBoundary on logout / account switch) or the entry removed:
    // nothing may survive in the projection. `gcTime: Infinity` on the cart query means this is
    // never a silent idle-GC.
    if (live === undefined) {
      patch({ ...INITIAL_PROJECTION, isLoading: computeIsLoading(client) })
    }
    return
  }

  // Events from a query that is no longer the live cache entry (a cancelled / cleared fetch
  // settling late) must never reach the store - this is what keeps a logged-out account's
  // in-flight cart response from resurrecting after the session was torn down.
  if (event.query !== live) {
    return
  }

  const isLoading = computeIsLoading(client)
  if (event.type !== "updated") {
    patch({ isLoading })
    return
  }

  const { action } = event
  const { state } = live
  switch (action.type) {
    case "fetch":
      // Old fetchCart: `set({ isLoading: true, error: null })` when a request actually went out.
      patch({ isLoading, error: null })
      return
    case "success":
      patch({
        ...projectData(state.data as CartData),
        // A manual `setQueryData` is only ever clearCart's EMPTY_CART write, which the old store
        // paired with `lastFetchedAt: 0`.
        lastFetchedAt: action.manual ? 0 : state.dataUpdatedAt,
        isLoading,
      })
      return
    case "error": {
      const message = fetchErrorMessage(action.error)
      patch({ isLoading, ...(message !== undefined && { error: message, lastFetchedAt: state.errorUpdatedAt }) })
      return
    }
    case "setState":
      // Cancel-with-revert restores the pre-fetch state; re-project it only when it has data.
      patch({ isLoading, ...(state.data !== undefined && projectData(state.data as CartData)) })
      return
    default:
      patch({ isLoading })
  }
}

function onMutationCacheEvent(client: QueryClient, event: MutationCacheNotifyEvent): void {
  if (binding?.client !== client) {
    return
  }

  const command = getCartCommandName(event.mutation?.meta)
  if (command === undefined) {
    return
  }

  const isLoading = computeIsLoading(client)
  // A write removed from the cache (cleared on logout) keeps running, but its outcome must not
  // touch the projection any more.
  const isLive = event.mutation !== undefined && client.getMutationCache().getAll().includes(event.mutation)
  if (event.type !== "updated" || !isLive) {
    patch({ isLoading })
    return
  }

  const { action } = event
  if (action.type === "pending") {
    // Old write actions: `set({ isLoading: true, error: null })` as their first statement.
    patch({ isLoading, error: null })
    return
  }

  if (action.type === "error") {
    const message = writeErrorMessage(command, action.error)
    patch({ isLoading, ...(message !== undefined && { error: message }) })
    return
  }

  patch({ isLoading })
}

/** Seeds the projection from whatever the newly bound client already holds. */
function syncFromCache(client: QueryClient): void {
  const query = liveCartQuery(client)
  const isLoading = computeIsLoading(client)
  if (query?.state.data !== undefined) {
    patch({ ...projectData(query.state.data as CartData), lastFetchedAt: query.state.dataUpdatedAt, isLoading })
  } else if (isLoading) {
    patch({ isLoading })
  }
}

let binding: { client: QueryClient; unsubscribe: () => void } | null = null

/**
 * Follows the browser QueryClient singleton: subscribes to the current client's caches and drops
 * the previous client's subscription whenever it is created or replaced (tests swap it via
 * `__setBrowserQueryClient`), so a stale client can never write into the store.
 */
function bindProjection(client: QueryClient | undefined): void {
  if (binding?.client === client) {
    return
  }

  binding?.unsubscribe()
  binding = null
  if (!client) {
    return
  }

  const unsubscribeQueries = client.getQueryCache().subscribe((event) => onQueryCacheEvent(client, event))
  const unsubscribeMutations = client.getMutationCache().subscribe((event) => onMutationCacheEvent(client, event))
  binding = {
    client,
    unsubscribe: () => {
      unsubscribeQueries()
      unsubscribeMutations()
    },
  }
  syncFromCache(client)
}

// Server: never touch the query client (getQueryClient() is per-request there, and no store
// action runs during SSR). Browser: bind now and follow every later client change.
if (!isServer) {
  subscribeBrowserQueryClient(bindProjection)
}

export type { CartItem }
