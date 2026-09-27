/**
 * Cross-tab sync for favorite-product changes, same browser only (a different device syncs by
 * re-hydrating from the backend instead - see `favoriteProductsStore.hydrate({ force: true })`).
 *
 * Prefers `BroadcastChannel` (no storage round-trip, no payload size limit); falls back to the
 * `storage` event on a small `localStorage` key holding only a version marker (`at`) and the
 * broadcasting tab's user id - never the favorite ids themselves, so no favorites data ever sits
 * in `localStorage`.
 */

const CHANNEL_NAME = "favorite-products-sync"
const STORAGE_KEY = "favorite-products-sync"

interface FavoritesSyncMessage {
  userId: string
  at: number
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
  const message: FavoritesSyncMessage = { userId, at: Date.now() }

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
      if (isFavoritesSyncMessage(event.data)) {
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
