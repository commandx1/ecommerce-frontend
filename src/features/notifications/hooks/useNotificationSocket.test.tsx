import { QueryClientProvider } from "@tanstack/react-query"
import { act, render, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { type ReactNode, StrictMode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { showToast } from "@/components/ui/Toast"
import type { NotificationSocketOptions } from "@/lib/realtime/stomp-client"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { getRouterMock } from "@/test/mocks/next-navigation"
import { createTestQueryClient } from "@/test/render"
import { useNotificationSocket } from "./useNotificationSocket"

interface FakeSocket {
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  isActive: ReturnType<typeof vi.fn>
  options: NotificationSocketOptions
}

/**
 * `vi.mock` factories are hoisted above the imports, so the socket registry has to be created by
 * `vi.hoisted` for the factory to legally reference it.
 */
const harness = vi.hoisted(() => {
  const sockets: {
    connect: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
    isActive: ReturnType<typeof vi.fn>
    options: unknown
  }[] = []

  const createNotificationSocket = vi.fn((options: unknown) => {
    const socket = {
      connect: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isActive: vi.fn(),
      options,
    }
    sockets.push(socket)
    return socket
  })

  return { sockets, createNotificationSocket }
})

vi.mock("@/lib/realtime/stomp-client", () => ({
  createNotificationSocket: harness.createNotificationSocket,
  resolveNotificationSocketUrl: () => "http://localhost/backend-ws",
  resolveSockJsTransports: () => ["xhr-streaming", "xhr-polling"],
}))

vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    love: vi.fn(),
    loading: vi.fn(),
  },
}))

/** Typed view over the registry; the mock factory can only speak `unknown`. */
const sockets = harness.sockets as unknown as FakeSocket[]

function makeWrapper() {
  const queryClient = createTestQueryClient()
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries")
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, invalidateQueries, wrapper }
}

/** Host for the StrictMode case; `renderHook`'s callback cannot sit above the provider. */
function SocketProbe() {
  useNotificationSocket()
  return null
}

const signIn = (accessToken: string) => {
  act(() => {
    useAuthStore.setState({ isAuthenticated: true, accessToken })
  })
}

beforeEach(() => {
  harness.sockets.length = 0
  harness.createNotificationSocket.mockClear()
  vi.mocked(showToast.info).mockClear()
  useAuthStore.setState({ isAuthenticated: false, accessToken: null })
})

describe("useNotificationSocket", () => {
  it("does not open a socket while logged out", () => {
    const { wrapper } = makeWrapper()
    renderHook(() => useNotificationSocket(), { wrapper })

    expect(harness.createNotificationSocket).not.toHaveBeenCalled()
  })

  it("does not open a socket when authenticated without an access token", () => {
    act(() => {
      useAuthStore.setState({ isAuthenticated: true, accessToken: null })
    })
    const { wrapper } = makeWrapper()
    renderHook(() => useNotificationSocket(), { wrapper })

    expect(harness.createNotificationSocket).not.toHaveBeenCalled()
  })

  it("connects once with the resolved url and transports when signed in", () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: "t1" })
    const { wrapper } = makeWrapper()
    renderHook(() => useNotificationSocket(), { wrapper })

    expect(harness.createNotificationSocket).toHaveBeenCalledTimes(1)
    expect(sockets).toHaveLength(1)
    expect(sockets[0]!.options.url).toBe("http://localhost/backend-ws")
    expect(sockets[0]!.options.transports).toEqual(["xhr-streaming", "xhr-polling"])
    expect(sockets[0]!.connect).toHaveBeenCalledTimes(1)
  })

  it("reads the token from the store at CONNECT time, not from the render closure", () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: "t1" })
    const { wrapper } = makeWrapper()
    renderHook(() => useNotificationSocket(), { wrapper })

    expect(sockets[0]!.options.getToken()).toBe("t1")

    // A silent refresh rotates the token without unmounting: the same socket must see the new one.
    act(() => {
      useAuthStore.setState({ accessToken: "refreshed" })
    })
    expect(sockets[0]!.options.getToken()).toBe("refreshed")
  })

  it("replaces the socket when the access token changes", () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: "t1" })
    const { wrapper } = makeWrapper()
    renderHook(() => useNotificationSocket(), { wrapper })

    signIn("t2")

    expect(sockets).toHaveLength(2)
    expect(sockets[0]!.disconnect).toHaveBeenCalledTimes(1)
    expect(sockets[1]!.connect).toHaveBeenCalledTimes(1)
    expect(sockets[1]!.options.getToken()).toBe("t2")
  })

  it("disconnects and stays closed on logout", () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: "t1" })
    const { wrapper } = makeWrapper()
    renderHook(() => useNotificationSocket(), { wrapper })

    act(() => {
      useAuthStore.setState({ isAuthenticated: false, accessToken: null })
    })

    expect(sockets).toHaveLength(1)
    expect(sockets[0]!.disconnect).toHaveBeenCalledTimes(1)
  })

  it("disconnects on unmount", () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: "t1" })
    const { wrapper } = makeWrapper()
    const { unmount } = renderHook(() => useNotificationSocket(), { wrapper })

    unmount()

    expect(sockets[0]!.disconnect).toHaveBeenCalledTimes(1)
  })

  describe("onMessage", () => {
    it("toasts and invalidates the notification queries for a valid push payload", () => {
      useAuthStore.setState({ isAuthenticated: true, accessToken: "t1" })
      const { wrapper, invalidateQueries } = makeWrapper()
      renderHook(() => useNotificationSocket(), { wrapper })

      act(() => {
        sockets[0]!.options.onMessage({
          notificationId: "n-1",
          title: "Order shipped",
          message: "Order #1234 is on its way",
        })
      })

      expect(showToast.info).toHaveBeenCalledWith("Order shipped", "Order #1234 is on its way")
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["notifications"] })
    })

    it.each([
      ["an empty object", {}],
      ["a string", "boom"],
      ["null", null],
      ["a partial payload", { notificationId: "n-1", title: "No message field" }],
    ])("ignores %s", (_label, body) => {
      useAuthStore.setState({ isAuthenticated: true, accessToken: "t1" })
      const { wrapper, invalidateQueries } = makeWrapper()
      renderHook(() => useNotificationSocket(), { wrapper })

      act(() => {
        sockets[0]!.options.onMessage(body)
      })

      expect(showToast.info).not.toHaveBeenCalled()
      expect(invalidateQueries).not.toHaveBeenCalled()
    })

    const VALID_ORDER_ID = "11111111-1111-1111-1111-111111111111"

    it("makes the toast clickable, using the same href resolver as the notifications menu, when the push carries a resolvable orderId", () => {
      useAuthStore.setState({
        isAuthenticated: true,
        accessToken: "t1",
        user: makeAccountUser({ roleName: "Vendor" }),
      })
      const { wrapper } = makeWrapper()
      renderHook(() => useNotificationSocket(), { wrapper })

      act(() => {
        sockets[0]!.options.onMessage({
          notificationId: "n-1",
          type: "CUSTOMER_ORDER_SHIPPED",
          orderId: VALID_ORDER_ID,
          title: "Order shipped",
          message: "Order is on its way",
        })
      })

      expect(showToast.info).toHaveBeenCalledWith("Order shipped", "Order is on its way", {
        onClick: expect.any(Function),
      })
    })

    it("navigates to the order and marks the notification read when the toast's onClick runs", async () => {
      let markReadId: string | null = null
      server.use(
        http.patch("*/backend-api/notifications/:id/read", ({ params }) => {
          markReadId = params.id as string
          return HttpResponse.json({})
        }),
      )
      useAuthStore.setState({
        isAuthenticated: true,
        accessToken: "t1",
        user: makeAccountUser({ roleName: "Vendor" }),
      })
      const { wrapper } = makeWrapper()
      renderHook(() => useNotificationSocket(), { wrapper })

      act(() => {
        sockets[0]!.options.onMessage({
          notificationId: "n-1",
          type: "CUSTOMER_ORDER_SHIPPED",
          orderId: VALID_ORDER_ID,
          title: "Order shipped",
          message: "Order is on its way",
        })
      })

      const [, , { onClick }] = vi.mocked(showToast.info).mock.calls.at(-1) as [string, string, { onClick: () => void }]

      act(() => {
        onClick()
      })

      expect(getRouterMock().push).toHaveBeenCalledWith(`/vendor-dashboard/orders?orderId=${VALID_ORDER_ID}`)
      await waitFor(() => expect(markReadId).toBe("n-1"))
    })

    it("does not make the toast clickable when the push has no resolvable orderId", () => {
      useAuthStore.setState({ isAuthenticated: true, accessToken: "t1", user: makeAccountUser() })
      const { wrapper } = makeWrapper()
      renderHook(() => useNotificationSocket(), { wrapper })

      act(() => {
        sockets[0]!.options.onMessage({
          notificationId: "n-1",
          type: "SOME_UNKNOWN_TYPE",
          orderId: null,
          title: "Heads up",
          message: "Nothing to open here",
        })
      })

      expect(showToast.info).toHaveBeenCalledWith("Heads up", "Nothing to open here")
    })
  })

  describe("after an auth rejection", () => {
    it("does not retry with the token the server refused", () => {
      useAuthStore.setState({ isAuthenticated: true, accessToken: "t1" })
      const { wrapper } = makeWrapper()
      const { rerender } = renderHook(() => useNotificationSocket(), { wrapper })

      act(() => {
        sockets[0]!.options.onAuthError?.("Unauthorized")
      })
      rerender()

      expect(sockets).toHaveLength(1)

      // Rotating away and back to the refused token must not resurrect it either.
      signIn("t2")
      expect(sockets).toHaveLength(2)
      signIn("t1")
      expect(sockets).toHaveLength(2)
      expect(sockets[1]!.disconnect).toHaveBeenCalledTimes(1)
    })

    it("opens a new socket once a genuinely new token arrives", () => {
      useAuthStore.setState({ isAuthenticated: true, accessToken: "t1" })
      const { wrapper } = makeWrapper()
      renderHook(() => useNotificationSocket(), { wrapper })

      act(() => {
        sockets[0]!.options.onAuthError?.("Unauthorized")
      })
      signIn("t3")

      expect(sockets).toHaveLength(2)
      expect(sockets[1]!.connect).toHaveBeenCalledTimes(1)
      expect(sockets[1]!.options.getToken()).toBe("t3")
    })
  })

  /**
   * `<StrictMode>` has to be the outermost element handed to the root: React 19 only runs the
   * mount / unmount / remount effect pass when it sits there. Passing
   * `wrapper: ({ children }) => <StrictMode>{children}</StrictMode>` to `renderHook` still
   * double-*renders* but never double-*mounts* the effect, which would make this test pass
   * without ever exercising the case it is named after.
   */
  it("leaves no socket connected without a matching disconnect under StrictMode", () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: "t1" })
    const { queryClient } = makeWrapper()

    render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <SocketProbe />
        </QueryClientProvider>
      </StrictMode>,
    )

    // Guards the setup above: if the double-mount stops happening, the invariants below become
    // vacuous, so pin the socket count React's simulated remount actually produces.
    expect(sockets).toHaveLength(2)
    for (const socket of sockets) {
      expect(socket.connect).toHaveBeenCalledTimes(1)
    }
    for (const socket of sockets.slice(0, -1)) {
      expect(socket.disconnect).toHaveBeenCalledTimes(1)
    }
    const disconnected = sockets.filter((socket) => socket.disconnect.mock.calls.length > 0)
    expect(sockets).toHaveLength(disconnected.length + 1)
  })
})
