import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { makeNotification, makeNotificationsPage } from "@/test/factories/notification.factory"
import { render, screen, waitFor } from "@/test/render"
import NotificationsPage from "./NotificationsPage"
import type { NotificationResponse } from "./types"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

vi.mock("./components/NotificationListItem", () => ({
  default: ({
    notification,
    onToggleRead,
  }: {
    notification: NotificationResponse
    onToggleRead?: (notification: NotificationResponse) => void
  }) => (
    <li data-testid="notification-item">
      {notification.title}
      <button type="button" onClick={() => onToggleRead?.(notification)}>
        toggle
      </button>
    </li>
  ),
}))

const authenticateBuyer = () => {
  useAuthStore.setState({
    user: makeAccountUser({ id: "buyer-1", roleName: "Buyer" }),
    accessToken: "buyer-token",
    isAuthenticated: true,
  })
}

const listRequests: URL[] = []

const serveList = (build: (url: URL) => object) => {
  server.use(
    http.get("*/backend-api/notifications", ({ request }) => {
      const url = new URL(request.url)
      listRequests.push(url)
      return HttpResponse.json(build(url))
    }),
  )
}

const serveUnread = (build: (url: URL) => object) => {
  server.use(
    http.get("*/backend-api/notifications/unread", ({ request }) => {
      const url = new URL(request.url)
      listRequests.push(url)
      return HttpResponse.json(build(url))
    }),
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
  listRequests.length = 0
  authenticateBuyer()
  server.use(http.get("*/backend-api/notifications/unread/count", () => HttpResponse.json({ unreadCount: 2 })))
})

describe("NotificationsPage", () => {
  it("shows a skeleton while loading then renders the list", async () => {
    serveList(() =>
      makeNotificationsPage({}, [
        makeNotification({ id: "n-1", title: "First" }),
        makeNotification({ id: "n-2", title: "Second" }),
      ]),
    )

    render(<NotificationsPage />)

    expect(screen.getByTestId("notifications-skeleton")).toBeInTheDocument()

    expect(await screen.findAllByTestId("notification-item")).toHaveLength(2)
  })

  it("requests the unread endpoint when the Unread tab is selected", async () => {
    const user = userEvent.setup()
    serveList(() => makeNotificationsPage({}, [makeNotification({ id: "n-1" })]))
    serveUnread(() => makeNotificationsPage({}, [makeNotification({ id: "n-1", read: false })]))

    render(<NotificationsPage />)
    await screen.findAllByTestId("notification-item")
    listRequests.length = 0

    await user.click(screen.getByRole("button", { name: /Unread/ }))

    await waitFor(() => {
      expect(listRequests.some((url) => url.pathname.endsWith("/notifications/unread"))).toBe(true)
    })
  })

  it("requests the next page when pagination is used", async () => {
    const user = userEvent.setup()
    serveList((url) => {
      const page = Number(url.searchParams.get("page") ?? "0")
      return makeNotificationsPage({ totalPages: 2, totalElements: 25, page }, [makeNotification({ id: `n-${page}` })])
    })

    render(<NotificationsPage />)
    await screen.findAllByTestId("notification-item")

    await user.click(screen.getByLabelText("Go to next page"))

    await waitFor(() => {
      expect(listRequests.some((url) => url.searchParams.get("page") === "1")).toBe(true)
    })
  })

  it("marks an unread notification as read when toggled", async () => {
    const user = userEvent.setup()
    serveList(() => makeNotificationsPage({}, [makeNotification({ id: "n-1", read: false })]))
    const patched: string[] = []
    server.use(
      http.patch("*/backend-api/notifications/:id/read", ({ params }) => {
        patched.push(String(params.id))
        return HttpResponse.json(makeNotification({ id: params.id as string, read: true }))
      }),
    )

    render(<NotificationsPage />)
    await screen.findAllByTestId("notification-item")

    await user.click(screen.getByRole("button", { name: "toggle" }))

    await waitFor(() => expect(patched).toEqual(["n-1"]))
  })

  it("marks a read notification as unread when toggled", async () => {
    const user = userEvent.setup()
    serveList(() => makeNotificationsPage({}, [makeNotification({ id: "n-1", read: true })]))
    const patched: string[] = []
    server.use(
      http.patch("*/backend-api/notifications/:id/unread", ({ params }) => {
        patched.push(String(params.id))
        return HttpResponse.json(makeNotification({ id: params.id as string, read: false }))
      }),
    )

    render(<NotificationsPage />)
    await screen.findAllByTestId("notification-item")

    await user.click(screen.getByRole("button", { name: "toggle" }))

    await waitFor(() => expect(patched).toEqual(["n-1"]))
  })

  it("disables Mark all as read when there is nothing unread, enables it otherwise", async () => {
    server.use(http.get("*/backend-api/notifications/unread/count", () => HttpResponse.json({ unreadCount: 0 })))
    serveList(() => makeNotificationsPage({}, []))

    render(<NotificationsPage />)

    expect(await screen.findByRole("button", { name: "Mark all as read" })).toBeDisabled()
  })

  it("marks all as read when there are unread notifications", async () => {
    const user = userEvent.setup()
    serveList(() => makeNotificationsPage({}, [makeNotification({ id: "n-1", read: false })]))
    let called = false
    server.use(
      http.patch("*/backend-api/notifications/read-all", () => {
        called = true
        return HttpResponse.json({ updatedCount: 2 })
      }),
    )

    render(<NotificationsPage />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Mark all as read" })).toBeEnabled()
    })

    await user.click(screen.getByRole("button", { name: "Mark all as read" }))

    await waitFor(() => expect(called).toBe(true))
  })

  it("shows the empty state copy for the All tab", async () => {
    serveList(() => makeNotificationsPage({}, []))

    render(<NotificationsPage />)

    expect(await screen.findByText("No notifications yet")).toBeInTheDocument()
    expect(screen.getByText("We'll let you know when something needs your attention.")).toBeInTheDocument()
  })

  it("shows the empty state copy for the Unread tab", async () => {
    const user = userEvent.setup()
    serveList(() => makeNotificationsPage({}, [makeNotification({ id: "n-1" })]))
    serveUnread(() => makeNotificationsPage({}, []))

    render(<NotificationsPage />)
    await screen.findAllByTestId("notification-item")

    await user.click(screen.getByRole("button", { name: /Unread/ }))

    expect(await screen.findByText("No unread notifications")).toBeInTheDocument()
    expect(screen.getByText("You're all caught up.")).toBeInTheDocument()
  })

  it("reports an error toast when the list fails to load", async () => {
    server.use(http.get("*/backend-api/notifications", () => new HttpResponse(null, { status: 500 })))

    render(<NotificationsPage />)

    await waitFor(() => {
      expect(toastSpies.error).toHaveBeenCalledWith("Failed to load notifications", "Please refresh the page.")
    })
  })
})
