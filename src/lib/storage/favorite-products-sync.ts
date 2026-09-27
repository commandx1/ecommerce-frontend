/**
 * Cross-tab sync for favorite-product changes, same browser only (a different device syncs by
 * re-hydrating from the backend instead - see `favoriteProductsStore.hydrate({ force: true })`).
 *
 * Prefers `BroadcastChannel` (no storage round-trip, no payload size limit); falls back to the
 * `storage` event on a small `localStorage` key holding only a version marker (`at`), the
 * broadcasting tab's user id, and its (random, meaningless outside this module) tab id - never
 * the favorite ids themselves, so no favorites data ever sits in `localStorage`.
 */

const CHANNEL_NAME = "favorite-products-sync"
const STORAGE_KEY = "favorite-products-sync"

// Identifies this tab, not this user - included so this same tab can ignore its own broadcasts.
// Unlike the `storage` event (which the spec excludes from the writing document), `BroadcastChannel`
// delivers to every OTHER *channel object* with the same name, including a second one opened by
// this same tab (`useAuthHydration`'s listener); without this filter, a local toggle would
// immediately re-hydrate itself against a GET issued before its own write reached the backend,
// undoing the optimistic update.
const TAB_ID = Math.random().toString(36).slice(2)

interface FavoritesSyncMessage {
  userId: string
  at: number
  sourceTabId: string
}

function hasBroadcastChannel(): boolean {
  return typeof BroadcastChannel !== "undefined"
}

function isFavoritesSyncMessage(value: unknown): value is FavoritesSyncMessage {
  return typeof value === "object" && value !== null && typeof (value as { userId?: unknown }).userId === "string"
}

/** Tells every other same-browser tab that `userId`'s favorites changed. */
export function broadcastFavoritesChanged(userId: string): void {
  if (typeof window === "undefined") return
  const message: FavoritesSyncMessage = { userId, at: Date.now(), sourceTabId: TAB_ID }

  if (hasBroadcastChannel()) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      channel.postMessage(message)
      channel.close()
      return
    } catch {
      // fall through to the storage fallback below
    }
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(message))
  } catch {
    // private window / blocked storage - other tabs simply won't hear about this change
  }
}

/** Invokes `handler` with the user id whenever another same-browser tab broadcasts a change. */
export function onFavoritesChangedElsewhere(handler: (userId: string) => void): () => void {
  if (typeof window === "undefined") return () => {}

  if (hasBroadcastChannel()) {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    const listener = (event: MessageEvent<unknown>): void => {
      if (isFavoritesSyncMessage(event.data) && event.data.sourceTabId !== TAB_ID) {
        handler(event.data.userId)
      }
    }
    channel.addEventListener("message", listener)
    return () => {
      channel.removeEventListener("message", listener)
      channel.close()
    }
  }

  const listener = (event: StorageEvent): void => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    try {
      const payload: unknown = JSON.parse(event.newValue)
      if (isFavoritesSyncMessage(payload)) {
        handler(payload.userId)
      }
    } catch {
      // malformed payload - ignore
    }
  }
  window.addEventListener("storage", listener)
  return () => window.removeEventListener("storage", listener)
}
