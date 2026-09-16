import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { broadcastLogout, LOGOUT_EVENT_KEY, onLogoutBroadcast } from "./session-events"

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe("broadcastLogout", () => {
  it("writes the logout key with the user id", () => {
    broadcastLogout("user-1")

    const raw = localStorage.getItem(LOGOUT_EVENT_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string).userId).toBe("user-1")
  })
})

/** `StorageEvent` in jsdom does not update `localStorage` itself, so we dispatch it directly. */
const dispatchStorageEvent = (init: Partial<StorageEvent>): void => {
  const event = new StorageEvent("storage", init)
  window.dispatchEvent(event)
}

describe("onLogoutBroadcast", () => {
  it("fires the handler for a dispatched storage event with the right key and payload", () => {
    const handler = vi.fn()
    const unbind = onLogoutBroadcast(handler)

    dispatchStorageEvent({ key: LOGOUT_EVENT_KEY, newValue: JSON.stringify({ userId: "user-1", at: Date.now() }) })

    expect(handler).toHaveBeenCalledWith("user-1")
    unbind()
  })

  it("ignores events for other keys", () => {
    const handler = vi.fn()
    const unbind = onLogoutBroadcast(handler)

    dispatchStorageEvent({ key: "some-other-key", newValue: JSON.stringify({ userId: "user-1" }) })

    expect(handler).not.toHaveBeenCalled()
    unbind()
  })

  it("ignores events with a null newValue", () => {
    const handler = vi.fn()
    const unbind = onLogoutBroadcast(handler)

    dispatchStorageEvent({ key: LOGOUT_EVENT_KEY, newValue: null })

    expect(handler).not.toHaveBeenCalled()
    unbind()
  })

  it("ignores malformed JSON", () => {
    const handler = vi.fn()
    const unbind = onLogoutBroadcast(handler)

    dispatchStorageEvent({ key: LOGOUT_EVENT_KEY, newValue: "not-json" })

    expect(handler).not.toHaveBeenCalled()
    unbind()
  })

  it("ignores a payload without a string userId", () => {
    const handler = vi.fn()
    const unbind = onLogoutBroadcast(handler)

    dispatchStorageEvent({ key: LOGOUT_EVENT_KEY, newValue: JSON.stringify({ at: Date.now() }) })

    expect(handler).not.toHaveBeenCalled()
    unbind()
  })

  it("cleanup stops delivery", () => {
    const handler = vi.fn()
    const unbind = onLogoutBroadcast(handler)
    unbind()

    dispatchStorageEvent({ key: LOGOUT_EVENT_KEY, newValue: JSON.stringify({ userId: "user-1" }) })

    expect(handler).not.toHaveBeenCalled()
  })
})
