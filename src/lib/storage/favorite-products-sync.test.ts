import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { broadcastFavoritesChanged, onFavoritesChangedElsewhere } from "./favorite-products-sync"

const STORAGE_KEY = "favorite-products-sync"

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe("favorite-products-sync via BroadcastChannel", () => {
  /**
   * `broadcastFavoritesChanged` runs in this same module/JS realm as the test, i.e. the same
   * "tab" `onFavoritesChangedElsewhere` filters out (see the self-filter note in the source) - so
   * simulating an actual OTHER tab means posting on a raw channel with a different `sourceTabId`,
   * exactly like a sibling browser tab's own `broadcastFavoritesChanged` call would.
   */
  const postFromAnotherTab = (message: Record<string, unknown>): void => {
    const channel = new BroadcastChannel("favorite-products-sync")
    channel.postMessage({ sourceTabId: "other-tab", at: Date.now(), ...message })
    channel.close()
  }

  it("delivers a change posted from another tab, with the right user id", async () => {
    const handler = vi.fn()
    const unbind = onFavoritesChangedElsewhere(handler)

    postFromAnotherTab({ userId: "user-1" })

    await vi.waitFor(() => expect(handler).toHaveBeenCalledWith("user-1"))
    unbind()
  })

  it("ignores this same tab's own broadcast (BroadcastChannel delivers to every channel object, not just other tabs)", async () => {
    const handler = vi.fn()
    const unbind = onFavoritesChangedElsewhere(handler)

    broadcastFavoritesChanged("user-1")

    // Give any (wrongly delivered) self-message a chance to land before asserting it didn't.
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(handler).not.toHaveBeenCalled()
    unbind()
  })

  it("never writes favorite ids (or anything but a version marker + user id) to localStorage", () => {
    broadcastFavoritesChanged("user-1")

    // BroadcastChannel is available in this environment, so the storage fallback key is untouched.
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it("stops delivering after cleanup", async () => {
    const handler = vi.fn()
    const unbind = onFavoritesChangedElsewhere(handler)
    unbind()

    postFromAnotherTab({ userId: "user-1" })

    // Give any (unwanted) delivery a chance to land before asserting it didn't.
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(handler).not.toHaveBeenCalled()
  })
})

describe("favorite-products-sync storage fallback (no BroadcastChannel)", () => {
  beforeEach(() => {
    vi.stubGlobal("BroadcastChannel", undefined)
  })

  /** `StorageEvent` in jsdom does not update `localStorage` itself, so we dispatch it directly. */
  const dispatchStorageEvent = (init: Partial<StorageEvent>): void => {
    window.dispatchEvent(new StorageEvent("storage", init))
  }

  it("writes only a version marker, user id and source tab id, never favorite data", () => {
    broadcastFavoritesChanged("user-1")

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const payload = JSON.parse(raw as string)
    expect(payload).toEqual({ userId: "user-1", at: expect.any(Number), sourceTabId: expect.any(String) })
  })

  it("fires the handler for a dispatched storage event with the right key and payload", () => {
    const handler = vi.fn()
    const unbind = onFavoritesChangedElsewhere(handler)

    dispatchStorageEvent({ key: STORAGE_KEY, newValue: JSON.stringify({ userId: "user-1", at: Date.now() }) })

    expect(handler).toHaveBeenCalledWith("user-1")
    unbind()
  })

  it("ignores events for other keys", () => {
    const handler = vi.fn()
    const unbind = onFavoritesChangedElsewhere(handler)

    dispatchStorageEvent({ key: "some-other-key", newValue: JSON.stringify({ userId: "user-1" }) })

    expect(handler).not.toHaveBeenCalled()
    unbind()
  })

  it("ignores a null newValue", () => {
    const handler = vi.fn()
    const unbind = onFavoritesChangedElsewhere(handler)

    dispatchStorageEvent({ key: STORAGE_KEY, newValue: null })

    expect(handler).not.toHaveBeenCalled()
    unbind()
  })

  it("ignores malformed JSON", () => {
    const handler = vi.fn()
    const unbind = onFavoritesChangedElsewhere(handler)

    dispatchStorageEvent({ key: STORAGE_KEY, newValue: "not-json" })

    expect(handler).not.toHaveBeenCalled()
    unbind()
  })

  it("ignores a payload without a string userId", () => {
    const handler = vi.fn()
    const unbind = onFavoritesChangedElsewhere(handler)

    dispatchStorageEvent({ key: STORAGE_KEY, newValue: JSON.stringify({ at: Date.now() }) })

    expect(handler).not.toHaveBeenCalled()
    unbind()
  })

  it("cleanup stops delivery", () => {
    const handler = vi.fn()
    const unbind = onFavoritesChangedElsewhere(handler)
    unbind()

    dispatchStorageEvent({ key: STORAGE_KEY, newValue: JSON.stringify({ userId: "user-1" }) })

    expect(handler).not.toHaveBeenCalled()
  })
})
