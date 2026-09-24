import { queryOptions } from "@tanstack/react-query"
import { extractErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
import { type Cart, type CartItem, cartAPI } from "@/lib/api/cart"
import { redirectToLogin } from "@/lib/api/client"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import { queryKeys } from "@/lib/query/keys"
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
type AutoOrderWrite = AutoOrderPeriod | null | undefined

function findItem(items: CartItem[], userProductId: string): CartItem | undefined {
  return items.find((item) => item.userProduct.userProductId === userProductId)
}

function resolveAutoOrder(items: CartItem[], userProductId: string, requested: AutoOrderWrite): AutoOrderPeriod | null {
  if (requested !== undefined) {
    return requested
  }

  return findItem(items, userProductId)?.autoOrder ?? null
}

function currentCartItems(): CartItem[] {
  return getQueryClient().getQueryData<CartData>(queryKeys.cart.detail())?.cartItems ?? []
}

/** Mirrors the old `FETCH_DEDUP_WINDOW_MS`; shared by `cartQueryOptions`' staleTime and refreshCart's failure-side window below. */
const CART_FETCH_DEDUP_MS = 1_000

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

  // Any failure here (auth-handled or not) rethrows to the caller, same as `cartStore.addToCart`
  // - swallowing it left the UI showing a finished spinner and no warning while the item never
  // entered the cart. A successful write is followed by a forced refresh so the new item shows
  // up even inside the dedup window; a refresh failure does not fail this write (see refreshCart).
  await cartAPI.addItem(userProductId, quantity, resolveAutoOrder(currentCartItems(), userProductId, autoOrder))
  await refreshCart({ force: true })
}

/** Ported 1:1 from `cartStore.removeFromCart`: every failure (auth-handled or not) is swallowed. */
async function removeItem(userProductId: string): Promise<void> {
  try {
    await cartAPI.removeItem(userProductId)
    await refreshCart({ force: true })
  } catch {
    // Swallowed: mirrors cartStore.removeFromCart - the caller's own toast (if any) is driven by
    // a future mutation hook's onError, not by this command rethrowing.
  }
}

/** Ported 1:1 from `cartStore.updateQuantity`: qty <= 0 delegates to removeItem; every write failure is swallowed. */
async function updateQuantity(userProductId: string, quantity: number, autoOrder?: AutoOrderWrite): Promise<void> {
  if (quantity <= 0) {
    await removeItem(userProductId)
    return
  }

  try {
    await cartAPI.updateItemQuantity(
      userProductId,
      quantity,
      resolveAutoOrder(currentCartItems(), userProductId, autoOrder),
    )
    await refreshCart({ force: true })
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
  const item = findItem(currentCartItems(), userProductId)
  if (!item) {
    return
  }

  const nextQuantity = quantity ?? item.quantity
  if (nextQuantity <= 0) {
    await removeItem(userProductId)
    return
  }

  try {
    await cartAPI.updateItemQuantity(userProductId, nextQuantity, autoOrder)
    await refreshCart({ force: true })
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
  const queryClient = getQueryClient()
  const cartId = queryClient.getQueryData<CartData>(queryKeys.cart.detail())?.cartId
  if (!cartId) {
    return
  }

  try {
    await cartAPI.clearCart(cartId)
    queryClient.setQueryData(queryKeys.cart.detail(), EMPTY_CART)
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail(), refetchType: "none" })
  } catch {
    // Swallowed: mirrors cartStore.clearCart - the cache keeps its pre-clear data on failure.
  }
}

export const cartCommands = {
  addItem,
  updateQuantity,
  removeItem,
  setItemAutoOrder,
  clearCart,
}
