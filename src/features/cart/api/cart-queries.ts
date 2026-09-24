import { isCancelledError, queryOptions } from "@tanstack/react-query"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
import { type Cart, type CartItem, cartAPI } from "@/lib/api/cart"
import { redirectToLogin } from "@/lib/api/client"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import { mutationKeys, queryKeys } from "@/lib/query/keys"
import { getQueryClient } from "@/lib/query/query-client"
import { useAuthStore } from "@/stores/authStore"

/**
 * Cart query-cache data shape. The API's `Cart.cartId` is always a string (the backend only
 * returns a cart that exists), but the cache also has to represent "no cart yet" (guest, 400/404,
 * or just cleared). Widened locally instead of touching the shared `Cart` type.
 */
export type CartData = Omit<Cart, "cartId"> & { cartId: string | null }

export const EMPTY_CART: CartData = { cartId: null, cartItems: [] }

/**
 * The backend overwrites `cart_item.auto_order` with whatever the request body carries, so a
 * write that does not mention the schedule would wipe it. `undefined` means "keep whatever is on
 * the item"; `null` clears it.
 */
type AutoOrderWrite = AutoOrderPeriod | null | undefined

/** A second plain refresh inside this window is answered from the cache (success or failure). */
const CART_FETCH_DEDUP_MS = 1_000

export const cartQueryOptions = () =>
  queryOptions<CartData>({
    queryKey: queryKeys.cart.detail(),
    queryFn: async () => {
      try {
        return await cartAPI.getCart()
      } catch (error: unknown) {
        // 400/404 means no cart exists yet - an empty cart, not an error.
        const status = extractErrorStatus(error)
        if (status === 400 || status === 404) {
          return EMPTY_CART
        }

        throw error
      }
    },
    staleTime: CART_FETCH_DEDUP_MS,
    // Exactly one GET per refresh: a retried 5xx would delay the "Cart unavailable" toast.
    retry: false,
    // Session state, not a disposable cache: routes without a cart reader (no header) must not
    // GC it and zero the badge. Only QuerySessionBoundary removes it (logout / account switch).
    gcTime: Number.POSITIVE_INFINITY,
    // Consumers key effects on `cartItems` identity (useCheckoutPage, useCheckoutAutoOrder,
    // useShippingDetails): every fetch hands out a fresh array, as the pre-query store did.
    structuralSharing: false,
  })

/**
 * Loads the cart; never throws (a failure stays on the query's own `error` for the owning hook).
 * `{ force: true }` bypasses the dedup window. In-flight collapsing and the success-side window
 * are native (`staleTime`); the failure-side window is not, so it is checked here: a downed
 * backend must not be hammered by every uncoordinated caller. Auth-handled failures are exempt -
 * the session is already gone and the next login must fetch immediately.
 */
export async function refreshCart({ force = false }: { force?: boolean } = {}): Promise<void> {
  const queryClient = getQueryClient()

  if (!force) {
    const state = queryClient.getQueryState(queryKeys.cart.detail())
    if (
      state?.status === "error" &&
      !isAuthHandledError(state.error) &&
      Date.now() - state.errorUpdatedAt < CART_FETCH_DEDUP_MS
    ) {
      return
    }
  }

  await queryClient.fetchQuery({ ...cartQueryOptions(), ...(force && { staleTime: 0 }) }).catch(() => {
    // Swallowed by contract - see above.
  })
}

/**
 * Fallback toast description per write, or `null` for a write that never toasts through the
 * cache: `setItemAutoOrder` rethrows and its caller shows a specific toast instead.
 */
const WRITE_ERROR_FALLBACK = {
  addItem: "Failed to add item",
  removeItem: "Failed to remove item",
  updateQuantity: "Failed to update quantity",
  setItemAutoOrder: null,
  clearCart: "Failed to clear cart",
} as const satisfies Record<string, string | null>

type CartCommandName = keyof typeof WRITE_ERROR_FALLBACK

/** Reads the write name every cart mutation carries as `meta.cartCommand`. */
export function getCartCommandName(meta: Record<string, unknown> | undefined): CartCommandName | undefined {
  const name = meta?.cartCommand
  return typeof name === "string" && Object.hasOwn(WRITE_ERROR_FALLBACK, name) ? (name as CartCommandName) : undefined
}

/**
 * Toast description for a failed cart write, or `undefined` when it must stay silent (no
 * fallback for `command`, or already handled by the auth interceptor - plus, for `addItem`
 * only, a bare 401 the interceptor did not flag).
 */
export function writeErrorMessage(command: CartCommandName, error: unknown): string | undefined {
  const fallback = WRITE_ERROR_FALLBACK[command]
  if (fallback === null || isAuthHandledError(error)) {
    return undefined
  }

  if (command === "addItem" && isAuthErrorStatus(extractErrorStatus(error))) {
    return undefined
  }

  return error instanceof Error ? error.message : fallback
}

/** Toast description for a failed cart fetch, or `undefined` when it must stay silent. */
export function fetchErrorMessage(error: unknown): string | undefined {
  if (isCancelledError(error) || isAuthHandledError(error)) {
    return undefined
  }

  return error instanceof Error ? error.message : "Failed to fetch cart"
}

/**
 * Runs one cart write request as a mutation in the shared MutationCache, so the UI can observe it
 * (`useIsMutating({ mutationKey: mutationKeys.cart.all })`, error events by `meta.cartCommand`)
 * while the commands stay plain async functions callable from debounced callbacks and effects.
 * Only the request itself is the mutation: the follow-up refresh shows up as the cart query's own
 * fetch: "write in flight" hands over to "cart fetching" before the next render, never both at once.
 * Rejects with the write's error; the calling command decides whether to rethrow or swallow it.
 */
async function runCartWrite(command: CartCommandName, write: () => Promise<unknown>): Promise<void> {
  const queryClient = getQueryClient()
  await queryClient
    .getMutationCache()
    .build(queryClient, { mutationKey: mutationKeys.cart.all, meta: { cartCommand: command }, mutationFn: write })
    .execute(undefined)
}

/** A write succeeded: re-read the cart even inside the dedup window. Never throws. */
const refreshAfterWrite = (): Promise<void> => refreshCart({ force: true })

function readCachedCart(): CartData {
  return getQueryClient().getQueryData<CartData>(queryKeys.cart.detail()) ?? EMPTY_CART
}

function findItem(userProductId: string): CartItem | undefined {
  return readCachedCart().cartItems.find((item) => item.userProduct.userProductId === userProductId)
}

function autoOrderFromCart(cart: CartData, userProductId: string): AutoOrderPeriod | null {
  return cart.cartItems.find((item) => item.userProduct.userProductId === userProductId)?.autoOrder ?? null
}

/**
 * An explicit `requested` value is returned as-is, synchronously - no cache lookup. Otherwise the
 * schedule already on the cached item must be read. Whatever is cached is used AS IS, stale or
 * not: staleness doesn't matter for this read, only whether a cart exists in the cache at all, so
 * this deliberately does not go through `refreshCart()`/its 1s dedup window - the real `GET /cart`
 * is multiple seconds, and every write on the hottest path (add/update quantity without an
 * explicit schedule) would otherwise pay that latency the instant the 1s window lapses, which is
 * effectively always. Only a genuinely cold cache - nothing fetched yet, a write racing ahead of
 * the cart's first load (design doc §10.4) - awaits an ensure-fetch, and that fetch is
 * best-effort: on failure this falls back to `null`, exactly like a cold cache did before the
 * fix, rather than ever rejecting the write. Returns a plain value (not a promise) on the common,
 * already-cached path so callers can skip `await` entirely there - an `await` defers by a
 * microtask tick even for an already-resolved value, which would otherwise delay every write's
 * mutation from registering as "in flight" for no reason.
 */
function resolveAutoOrder(
  userProductId: string,
  requested: AutoOrderWrite,
): AutoOrderPeriod | null | Promise<AutoOrderPeriod | null> {
  if (requested !== undefined) {
    return requested
  }

  const queryClient = getQueryClient()
  const cached = queryClient.getQueryData<CartData>(queryKeys.cart.detail())
  if (cached !== undefined) {
    return autoOrderFromCart(cached, userProductId)
  }

  return queryClient
    .ensureQueryData(cartQueryOptions())
    .then((cart) => autoOrderFromCart(cart, userProductId))
    .catch(() => null)
}

/**
 * The backend has no guest cart, so a guest is sent to `/login` before any request goes out; the
 * `authHandled` flag makes every caller's `isAuthHandledError` check exit silently. Every other
 * failure rethrows too - callers own their "failed to add" toast.
 */
async function addItem(userProductId: string, quantity = 1, autoOrder?: AutoOrderWrite): Promise<void> {
  if (!useAuthStore.getState().isAuthenticated) {
    redirectToLogin("login-required")
    throw Object.assign(new Error("Login required"), { authHandled: true })
  }

  const resolving = resolveAutoOrder(userProductId, autoOrder)
  const resolvedAutoOrder = resolving instanceof Promise ? await resolving : resolving
  await runCartWrite("addItem", () => cartAPI.addItem(userProductId, quantity, resolvedAutoOrder))
  await refreshAfterWrite()
}

/** Every failure is swallowed (the cart page toasts it off the MutationCache). */
async function removeItem(userProductId: string): Promise<void> {
  try {
    await runCartWrite("removeItem", () => cartAPI.removeItem(userProductId))
  } catch {
    return
  }

  await refreshAfterWrite()
}

/** `quantity <= 0` removes the line. Every failure is swallowed, like `removeItem`. */
async function updateQuantity(userProductId: string, quantity: number, autoOrder?: AutoOrderWrite): Promise<void> {
  if (quantity <= 0) {
    await removeItem(userProductId)
    return
  }

  const resolving = resolveAutoOrder(userProductId, autoOrder)
  const resolvedAutoOrder = resolving instanceof Promise ? await resolving : resolving
  try {
    await runCartWrite("updateQuantity", () => cartAPI.updateItemQuantity(userProductId, quantity, resolvedAutoOrder))
  } catch {
    return
  }

  await refreshAfterWrite()
}

/**
 * Quantity and schedule share one endpoint, so an explicit `quantity` lets the caller flush a
 * still-debounced quantity edit in the same write. Unlike the other swallowing writes, a
 * non-auth failure RETHROWS: the caller shows its own "Could not update auto-reorder" toast.
 */
async function setItemAutoOrder(
  userProductId: string,
  autoOrder: AutoOrderPeriod | null,
  quantity?: number,
): Promise<void> {
  const item = findItem(userProductId)
  if (!item) {
    return
  }

  const nextQuantity = quantity ?? item.quantity
  if (nextQuantity <= 0) {
    await removeItem(userProductId)
    return
  }

  try {
    await runCartWrite("setItemAutoOrder", () => cartAPI.updateItemQuantity(userProductId, nextQuantity, autoOrder))
  } catch (error: unknown) {
    if (isAuthHandledError(error)) {
      return
    }

    throw error
  }

  await refreshAfterWrite()
}

/**
 * No-op without a cart. On success the entry becomes `EMPTY_CART` and is marked stale without a
 * refetch (no extra GET; the next plain refresh goes to the network). Every failure is swallowed
 * and leaves the cached cart untouched.
 */
async function clearCart(): Promise<void> {
  const { cartId } = readCachedCart()
  if (!cartId) {
    return
  }

  try {
    await runCartWrite("clearCart", () => cartAPI.clearCart(cartId))
  } catch {
    return
  }

  // The entry already exists (its cartId was just read), so it keeps cartQueryOptions' gcTime.
  const queryClient = getQueryClient()
  queryClient.setQueryData(queryKeys.cart.detail(), EMPTY_CART)
  await queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail(), refetchType: "none" })
}

/**
 * Imperative cart writes (design doc §5). Each awaits its request and then a forced refresh, so
 * `await cartCommands.x()` resolves once the new cart is in the cache.
 */
export const cartCommands = { addItem, removeItem, updateQuantity, setItemAutoOrder, clearCart }
