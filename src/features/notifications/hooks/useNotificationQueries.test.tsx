import { QueryClientProvider, type QueryObserverOptions } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { createTestQueryClient } from "@/test/render"
import { notificationsKeys } from "../lib/notifications-keys"
import { useNotificationsPage, useRecentNotifications, useUnreadNotificationCount } from "./useNotificationQueries"

function makeWrapper() {
  const queryClient = createTestQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

describe("useUnreadNotificationCount", () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false })
  })

  it("does not fetch when the user is logged out", async () => {
    const { wrapper, queryClient } = makeWrapper()
    const { result } = renderHook(() => useUnreadNotificationCount(), { wrapper })

    expect(result.current.count).toBe(0)
    const query = queryClient.getQueryCache().find({ queryKey: notificationsKeys.unreadCount() })
    expect(query?.state.fetchStatus).toBe("idle")
  })

  it("fetches the unread count when authenticated", async () => {
    server.use(http.get("*/backend-api/notifications/unread/count", () => HttpResponse.json({ unreadCount: 3 })))
    useAuthStore.setState({ isAuthenticated: true })

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUnreadNotificationCount(), { wrapper })

    await waitFor(() => expect(result.current.count).toBe(3))
    expect(result.current.isError).toBe(false)
  })

  it("polls every 60s and refetches on window focus", () => {
    useAuthStore.setState({ isAuthenticated: true })
    const { wrapper, queryClient } = makeWrapper()
    renderHook(() => useUnreadNotificationCount(), { wrapper })

    const query = queryClient.getQueryCache().find({ queryKey: notificationsKeys.unreadCount() })
    const options = query?.options as QueryObserverOptions | undefined
    expect(options?.refetchInterval).toBe(60_000)
    expect(options?.refetchOnWindowFocus).toBe(true)
  })
})

describe("useNotificationsPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: true })
  })

  it("hits the /unread endpoint when unreadOnly is true", async () => {
    let requestedUrl = ""
    server.use(
      http.get("*/backend-api/notifications/unread", ({ request }) => {
        requestedUrl = request.url
        return HttpResponse.json({
          content: [],
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
          unreadCount: 0,
        })
      }),
    )

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useNotificationsPage({ page: 0, unreadOnly: true }), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(requestedUrl).toContain("/backend-api/notifications/unread")
  })
})

describe("useRecentNotifications", () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: true })
  })

  it("does not fetch when disabled", () => {
    const { wrapper, queryClient } = makeWrapper()
    const { result } = renderHook(() => useRecentNotifications(false), { wrapper })

    expect(result.current.fetchStatus).toBe("idle")
    const query = queryClient.getQueryCache().find({
      queryKey: notificationsKeys.list({ page: 0, size: 6, unreadOnly: false }),
    })
    expect(query?.state.fetchStatus).toBe("idle")
  })
})
