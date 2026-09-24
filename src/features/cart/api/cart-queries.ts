import { isCancelledError, type MutationFilters, queryOptions } from "@tanstack/react-query"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
import { type Cart, type CartItem, cartAPI } from "@/lib/api/cart"
import { redirectToLogin } from "@/lib/api/client"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import { mutationKeys, queryKeys } from "@/lib/query/keys"
import { getQueryClient } from "@/lib/query/query-client"
import { useAuthStore } from "@/stores/authStore"

/**
 * Cart query-cache data shape. The API's `Cart.cartId` is always a non-null `string` (a cart
 * document exists whenever the backend returns one), but this cache also has to represent "no
 * cart yet" (guest, never fetched, 400/404, or just cleared) — the same case `cartStore.cartId`
 * already models as `string | null` today (see `CartContent`/`CartItemsPanel`/`useCartPage`,
 * which all declare `cartId: string | null`). Widening locally here, instead of touching the
 * shared `Cart` type in `lib/api/cart.ts`, keeps that ripple out of every other `Cart` consumer.
 */
export type CartData = Omit<Cart, "cartId"> & { cartId: string | null }

export const EMPTY_CART: CartData = { cartId: null, cartItems: [] }

/**
 * The backend overwrites `cart_item.auto_order` with whatever the request body carries, so a
 * write that does not mention the schedule would wipe it. Passing `undefined` means "keep
 * whatever is on the item"; pass `null` to clear it. Ported from `cartStore.ts`.
 */
export type AutoOrderWrite = AutoOrderPeriod | null | undefined

function findItem(items: CartItem[], userProductId: string): CartItem | undefined {
  return items.find((item) => item.userProduct.userProductId === userProductId)
}

function resolveAutoOrder(items: CartItem[], userProductId: string, requested: AutoOrderWrite): AutoOrderPeriod | null {
  if (requested !== undefined) {
    return requested
  }

  return findItem(items, userProductId)?.autoOrder ?? null
}

/** Mirrors the old `FETCH_DEDUP_WINDOW_MS`; shared by `cartQueryOptions`' staleTime and refreshCart's failure-side window below. */
const CART_FETCH_DEDUP_MS = 1_000

/** See `cartQueryOptions().gcTime`. */
const CART_GC_TIME = Number.POSITIVE_INFINITY

/**
 * `staleTime: CART_FETCH_DEDUP_MS` mirrors the old `FETCH_DEDUP_WINDOW_MS`: a second read inside
 * that window is served from the cache instead of firing a new GET. In-flight de-duplication
 * (concurrent callers collapsing into a single request) is native to TanStack Query and needs no
 * code here.
 */
export const cartQueryOptions = () =>
  queryOptions<CartData>({
    queryKey: queryKeys.cart.detail(),
    queryFn: async () => {
      try {
        return await cartAPI.getCart()
      } catch (error: unknown) {
        // 400/404 means no cart exists yet - treat it as empty, not an error.
        const status = extractErrorStatus(error)
        if (status === 400 || status === 404) {
          return EMPTY_CART
        }

        throw error
      }
    },
    staleTime: CART_FETCH_DEDUP_MS,
    // The old store made exactly one GET per fetch: no retry (the global default retries a 5xx
    // once after ~1s, which would delay the "Cart unavailable" error and double the request).
    retry: false,
    // Nothing observes this query yet (reads go through the cartStore projection), so the default
    // 5 min gcTime would silently drop the cart - and zero the navbar badge - after 5 idle
    // minutes. It is removed only by an explicit clear (QuerySessionBoundary on logout/switch).
    gcTime: CART_GC_TIME,
    // The old store handed out a fresh `items` array on every fetch; several consumers key
    // effects on `items` identity (useCheckoutPage, useCheckoutAutoOrder, useShippingDetails),
    // so structural sharing would change when those effects re-run.
    structuralSharing: false,
  })

export interface RefreshCartOptions {
  force?: boolean
}

/**
 * Port of the old `cartStore.fetchCart`: never throws (a failed refresh just leaves the query's
 * own `error`/`status` for the owning hook to read), and `{ force: true }` bypasses the dedup
 * window by forcing the fetch to be considered stale. In-flight de-duplication and the success-side
 * window are both native `QueryClient` behaviour off `cartQueryOptions().staleTime`.
 */
export async function refreshCart({ force = false }: RefreshCartOptions = {}): Promise<void> {
  const queryClient = getQueryClient()

  if (!force) {
    const state = queryClient.getQueryState(queryKeys.cart.detail())
    // A query that only ever errored has no successful `dataUpdatedAt`, so TanStack's own
    // staleTime freshness check can't arm a window for it - without this, a downed backend
    // would get hammered by every uncoordinated caller retrying the GET immediately. Mirrors
    // `cartStore.ts` stamping `lastFetchedAt` on a failed fetch too (cartStore.ts:110-112).
    // Auth-handled errors are exempt, same as the store (cartStore.ts:95-101): the interceptor
    // already tore the session down, and re-arming this window would leave the user staring at
    // an empty cart for up to a second right after their next login.
    if (
      state?.status === "error" &&
      !isAuthHandledError(state.error) &&
      Date.now() - state.errorUpdatedAt < CART_FETCH_DEDUP_MS
    ) {
      return
    }
  }

  await queryClient.fetchQuery({ ...cartQueryOptions(), ...(force && { staleTime: 0 }) }).catch(() => {
    // Swallowed: mirrors cartStore.fetchCart - a failed refresh must not reject the caller
    // (a write's own error already propagates on its own, independent of this refresh).
  })
}

/**
 * Names every cart write. Carried on the write's mutation as `meta.cartCommand`, so a reader of
 * the MutationCache (the legacy `cartStore` projection today, mutation hooks later) can tell which
 * write failed without the command itself having to surface - or swallow - the error.
 */
export type CartCommandName = "addItem" | "removeItem" | "updateQuantity" | "setItemAutoOrder" | "clearCart"

export interface CartMutationMeta extends Record<string, unknown> {
  cartCommand: CartCommandName
}

const CART_COMMAND_NAMES: readonly CartCommandName[] = [
  "addItem",
  "removeItem",
  "updateQuantity",
  "setItemAutoOrder",
  "clearCart",
]

export function getCartCommandName(meta: Record<string, unknown> | undefined): CartCommandName | undefined {
  const name = meta?.cartCommand
  return CART_COMMAND_NAMES.find((candidate) => candidate === name)
}

/**
 * Fallback toast description per write command, or `null` for a command that never toasts here.
 * `setItemAutoOrder` is `null`: its only caller (`useCartPage.onAutoOrderChange`) shows its own
 * "Could not update auto-reorder" toast off the rethrow instead - writing a message here too
 * would fire two toasts for one failure.
 */
const WRITE_ERROR_FALLBACK: Record<CartCommandName, string | null> = {
  addItem: "Failed to add item",
  removeItem: "Failed to remove item",
  updateQuantity: "Failed to update quantity",
  setItemAutoOrder: null,
  clearCart: "Failed to clear cart",
}

/**
 * Toast description for a failed cart write, or `undefined` when the caller must stay silent
 * (no fallback configured for `command`, or the failure was already handled elsewhere: the auth
 * interceptor's `authHandled` flag, or - `addItem` only - a bare 401 status the interceptor
 * didn't get a chance to flag). Shared by `cartStore`'s mutation-cache projection and
 * `useCartPage`'s write-error toast so both key off the exact same fallback/skip rules.
 */
export function writeErrorMessage(command: CartCommandName, error: unknown): string | undefined {
  const fallback = WRITE_ERROR_FALLBACK[command]
  if (fallback === null || isAuthHandledError(error)) {
    return undefined
  }

  // addToCart alone also treated a bare 401 status (not flagged by the interceptor) as auth.
  if (command === "addItem" && isAuthErrorStatus(extractErrorStatus(error))) {
    return undefined
  }

  return error instanceof Error ? error.message : fallback
}

/**
 * Toast description for a failed cart fetch, or `undefined` when the caller must stay silent (a
 * cancelled request, or one the auth interceptor already handled). Shared by `cartStore`'s
 * query-cache projection and `useCartPage`'s fetch-error toast.
 */
export function fetchErrorMessage(error: unknown): string | undefined {
  if (isCancelledError(error) || isAuthHandledError(error)) {
    return undefined
  }

  return error instanceof Error ? error.message : "Failed to fetch cart"
}

/**
 * Writes whose network request has already succeeded and which are now only refreshing the cache
 * (the forced GET, or `clearCart`'s local EMPTY_CART write). From that point on their "loading" is
 * represented by the cart query's own fetch status, so the cart query settling and the write no
 * longer counting as in flight happen in the same notification - exactly like the old store's
 * single `set({ items, isLoading: false })` at the end of `fetchCart`. Without this, a
 * refreshed-but-not-yet-settled mutation would keep `isLoading` true for a few extra microtasks
 * after the new items land (a one-frame "loading" flash on the cart page when the last item goes).
 */
const refreshingWrites = new WeakSet<object>()

/**
 * MutationCache filter for "a cart write whose network request is still in flight". The old
 * `cartStore.isLoading` equals: cart query `fetchStatus !== "idle"` OR any mutation matching this.
 */
export const cartWriteInFlightFilters = {
  mutationKey: mutationKeys.cart.all,
  status: "pending",
  predicate: (mutation: object) => !refreshingWrites.has(mutation),
} as const satisfies MutationFilters

/**
 * Runs one cart write through the QueryClient's MutationCache (key `mutationKeys.cart.all`), so
 * its pending/error state is observable from the cache. `write` is the network request; `settle`
 * runs after it succeeded (refresh / local cache update). The returned promise rejects with the
 * write's original error - the calling command decides whether to rethrow or swallow it.
 */
function runCartWrite(
  command: CartCommandName,
  write: () => Promise<unknown>,
  settle: () => Promise<void>,
): Promise<void> {
  const queryClient = getQueryClient()
  const meta: CartMutationMeta = { cartCommand: command }
  const mutation = queryClient.getMutationCache().build<void, unknown, void, unknown>(queryClient, {
    mutationKey: mutationKeys.cart.all,
    meta,
    mutationFn: async () => {
      await write()
      refreshingWrites.add(mutation)
      await settle()
    },
  })

  return mutation.execute(undefined)
}

const refreshAfterWrite = (): Promise<void> => refreshCart({ force: true })

/** Reads the cart snapshot a command resolves `autoOrder` / the item / `cartId` against. */
export type CartSnapshotReader = () => CartData

export interface CartCommands {
  addItem: (userProductId: string, quantity?: number, autoOrder?: AutoOrderWrite) => Promise<void>
  removeItem: (userProductId: string) => Promise<void>
  updateQuantity: (userProductId: string, quantity: number, autoOrder?: AutoOrderWrite) => Promise<void>
  setItemAutoOrder: (userProductId: string, autoOrder: AutoOrderPeriod | null, quantity?: number) => Promise<void>
  clearCart: () => Promise<void>
}

/**
 * Builds the cart commands against a snapshot reader. `cartCommands` (below) reads the query
 * cache; the legacy `cartStore` facade reads its own state, which is a synchronous projection of
 * that same cache entry - identical in the app, and it keeps tests that seed `useCartStore`
 * directly working until the store is deleted (design §7 step 7).
 */
export function createCartCommands(readCart: CartSnapshotReader): CartCommands {
  /**
   * Backend has no guest cart (`/api/cart/**` requires auth) - a guest is sent to `/login` before
   * any request goes out. `authHandled` mirrors the axios interceptor's flag so every existing
   * caller's `isAuthHandledError` check already exits silently instead of showing an error toast.
   * Ported 1:1 from `cartStore.addToCart`.
   */
  async function addItem(userProductId: string, quantity = 1, autoOrder?: AutoOrderWrite): Promise<void> {
    if (!useAuthStore.getState().isAuthenticated) {
      redirectToLogin("login-required")
      throw Object.assign(new Error("Login required"), { authHandled: true })
    }

    // Resolved synchronously at call time (the old store read `get().items` here too), not a few
    // microtasks later inside the mutation where a concurrent refresh could already have landed.
    const resolvedAutoOrder = resolveAutoOrder(readCart().cartItems, userProductId, autoOrder)

    // Any failure here (auth-handled or not) rethrows to the caller, same as `cartStore.addToCart`
    // - swallowing it left the UI showing a finished spinner and no warning while the item never
    // entered the cart. A successful write is followed by a forced refresh so the new item shows
    // up even inside the dedup window; a refresh failure does not fail this write (see refreshCart).
    await runCartWrite("addItem", () => cartAPI.addItem(userProductId, quantity, resolvedAutoOrder), refreshAfterWrite)
  }

  /** Ported 1:1 from `cartStore.removeFromCart`: every failure (auth-handled or not) is swallowed. */
  async function removeItem(userProductId: string): Promise<void> {
    try {
      await runCartWrite("removeItem", () => cartAPI.removeItem(userProductId), refreshAfterWrite)
    } catch {
      // Swallowed: mirrors cartStore.removeFromCart. The failure stays readable on the
      // MutationCache (`meta.cartCommand === "removeItem"`), which is where the cartStore
      // projection picks its `error` message up from.
    }
  }

  /** Ported 1:1 from `cartStore.updateQuantity`: qty <= 0 delegates to removeItem; every write failure is swallowed. */
  async function updateQuantity(userProductId: string, quantity: number, autoOrder?: AutoOrderWrite): Promise<void> {
    if (quantity <= 0) {
      await removeItem(userProductId)
      return
    }

    const resolvedAutoOrder = resolveAutoOrder(readCart().cartItems, userProductId, autoOrder)
    try {
      await runCartWrite(
        "updateQuantity",
        () => cartAPI.updateItemQuantity(userProductId, quantity, resolvedAutoOrder),
        refreshAfterWrite,
      )
    } catch {
      // Swallowed: mirrors cartStore.updateQuantity.
    }
  }

  /**
   * Quantity and schedule share one endpoint, so an explicit `quantity` lets the caller flush a
   * still-debounced quantity edit in the same write. Ported 1:1 from `cartStore.setItemAutoOrder`,
   * including its deliberate asymmetry with the other writes: a non-auth failure RETHROWS (the only
   * caller, `useCartPage`, shows its own "Could not update auto-reorder" toast off that rethrow),
   * while an auth-handled failure is swallowed like every other write.
   */
  async function setItemAutoOrder(
    userProductId: string,
    autoOrder: AutoOrderPeriod | null,
    quantity?: number,
  ): Promise<void> {
    const item = findItem(readCart().cartItems, userProductId)
    if (!item) {
      return
    }

    const nextQuantity = quantity ?? item.quantity
    if (nextQuantity <= 0) {
      await removeItem(userProductId)
      return
    }

    try {
      await runCartWrite(
        "setItemAutoOrder",
        () => cartAPI.updateItemQuantity(userProductId, nextQuantity, autoOrder),
        refreshAfterWrite,
      )
    } catch (error: unknown) {
      if (isAuthHandledError(error)) {
        return
      }

      throw error
    }
  }

  /**
   * Port of `cartStore.clearCart`, adapted to the design doc's §4 invalidation map: on success the
   * cache is set straight to `EMPTY_CART` and invalidated with `refetchType: "none"` (no extra GET,
   * mirrors the old "empty + lastFetchedAt=0" so the next plain refresh actually goes to the
   * network instead of serving stale pre-clear data). No-op when there is no cart yet. Every
   * failure (auth-handled or not) is swallowed, same as the store, and leaves the cache untouched
   * (the store kept `items` on a failed clear).
   */
  async function clearCart(): Promise<void> {
    const { cartId } = readCart()
    if (!cartId) {
      return
    }

    try {
      await runCartWrite(
        "clearCart",
        () => cartAPI.clearCart(cartId),
        async () => {
          const queryClient = getQueryClient()
          // Make sure the entry carries cartQueryOptions (notably its gcTime) even if it did not
          // exist yet, so this EMPTY_CART write is never garbage-collected out from under readers
          // (setQueryData alone would create it with the client default gcTime).
          queryClient.getQueryCache().build(queryClient, { queryKey: queryKeys.cart.detail(), gcTime: CART_GC_TIME })
          queryClient.setQueryData(queryKeys.cart.detail(), EMPTY_CART)
          await queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail(), refetchType: "none" })
        },
      )
    } catch {
      // Swallowed: mirrors cartStore.clearCart - the cache keeps its pre-clear data on failure.
    }
  }

  return { addItem, removeItem, updateQuantity, setItemAutoOrder, clearCart }
}

function readCachedCart(): CartData {
  return getQueryClient().getQueryData<CartData>(queryKeys.cart.detail()) ?? EMPTY_CART
}

export const cartCommands: CartCommands = createCartCommands(readCachedCart)
