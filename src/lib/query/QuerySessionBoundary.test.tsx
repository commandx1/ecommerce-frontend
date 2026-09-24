import { QueryClient } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useAuthStore } from "@/stores/authStore"
import QuerySessionBoundary from "./QuerySessionBoundary"

const baseUser = {
  name: "Serhat",
  surname: "Belen",
  email: "serhat.belen@example.com",
  phoneNumber: "+15551234567",
  emailConfirmed: true,
  phoneNumberConfirmed: true,
  twoFactorEnabled: false,
  lockoutEnd: null,
  createdDate: "2026-01-01T00:00:00Z",
  roleName: "Buyer",
}

const userWithId = (id: string) => ({ ...baseUser, id })

function mountBoundary(client: QueryClient) {
  return render(<QuerySessionBoundary queryClient={client}>probe</QuerySessionBoundary>)
}

function seedCache(client: QueryClient): void {
  client.setQueryData(["probe"], "value")
}

describe("QuerySessionBoundary", () => {
  it("clears the cache when the user logs out (A -> null)", () => {
    const client = new QueryClient()
    useAuthStore.getState().setAuth(userWithId("user-a"), "access-1", "refresh-1")
    mountBoundary(client)
    seedCache(client)

    useAuthStore.getState().clearAuth()

    expect(client.getQueryData(["probe"])).toBeUndefined()
  })

  it("clears the cache when the signed-in identity switches (A -> B)", () => {
    const client = new QueryClient()
    useAuthStore.getState().setAuth(userWithId("user-a"), "access-1", "refresh-1")
    mountBoundary(client)
    seedCache(client)

    useAuthStore.getState().setAuth(userWithId("user-b"), "access-2", "refresh-2")

    expect(client.getQueryData(["probe"])).toBeUndefined()
  })

  it("keeps the cache on login/hydration (null -> A) - nothing to leak yet", () => {
    const client = new QueryClient()
    useAuthStore.getState().clearAuth()
    mountBoundary(client)
    seedCache(client)

    useAuthStore.getState().setAuth(userWithId("user-a"), "access-1", "refresh-1")

    expect(client.getQueryData(["probe"])).toBe("value")
  })

  it("keeps the cache when the same user is re-set (e.g. a token refresh)", () => {
    const client = new QueryClient()
    useAuthStore.getState().setAuth(userWithId("user-a"), "access-1", "refresh-1")
    mountBoundary(client)
    seedCache(client)

    useAuthStore.getState().setAuth(userWithId("user-a"), "access-2", "refresh-2")

    expect(client.getQueryData(["probe"])).toBe("value")
  })

  it("unsubscribes on unmount, so a later identity change on an unmounted boundary is a no-op", () => {
    const client = new QueryClient()
    useAuthStore.getState().setAuth(userWithId("user-a"), "access-1", "refresh-1")
    const { unmount } = mountBoundary(client)
    seedCache(client)
    unmount()

    useAuthStore.getState().setAuth(userWithId("user-b"), "access-2", "refresh-2")

    expect(client.getQueryData(["probe"])).toBe("value")
  })
})
