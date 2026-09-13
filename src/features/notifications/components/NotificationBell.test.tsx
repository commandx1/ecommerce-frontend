import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeNotification, makeNotificationsPage, makeUnreadCountResponse } from "@/test/factories"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, waitFor, within } from "@/test/render"
import { resetAllStores } from "@/test/store-reset"
import NotificationBell from "./NotificationBell"

installRadixPointerPolyfills()

const signIn = (overrides: Partial<ReturnType<typeof makeAccountUser>> = {}) => {
  useAuthStore.setState({
    isAuthenticated: true,
    accessToken: "t",
    user: makeAccountUser(overrides),
  })
}

beforeEach(() => {
  resetAllStores()
  vi.restoreAllMocks()
})

describe("NotificationBell", () => {
  it("shows no badge and a plain aria-label when there are no unread notifications", () => {
    signIn()
    server.use(
      http.get("*/backend-api/notifications/unread/count", () => HttpResponse.json(makeUnreadCountResponse(0))),
    )

    render(<NotificationBell />)

    const trigger = screen.getByRole("button", { name: "Notifications" })
    expect(within(trigger).queryByText(/\d/)).not.toBeInTheDocument()
  })

  it("shows the unread count and an announcing aria-label", async () => {
    signIn()
    server.use(
      http.get("*/backend-api/notifications/unread/count", () => HttpResponse.json(makeUnreadCountResponse(3))),
    )

    render(<NotificationBell />)

    expect(await screen.findByText("3")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Notifications, 3 unread" })).toBeInTheDocument()
  })

  it("caps the badge at 99+", async () => {
    signIn()
    server.use(
      http.get("*/backend-api/notifications/unread/count", () => HttpResponse.json(makeUnreadCountResponse(150))),
    )

    render(<NotificationBell />)

    expect(await screen.findByText("99+")).toBeInTheDocument()
  })

  it("requests the recent list with size=6 and renders the rows when the popover opens", async () => {
    const user = userEvent.setup()
    signIn()
    let requestedUrl: string | null = null
    server.use(
      http.get("*/backend-api/notifications", ({ request }) => {
        requestedUrl = request.url
        return HttpResponse.json(makeNotificationsPage({}, [makeNotification({ id: "n-1", title: "Order shipped" })]))
      }),
    )

    render(<NotificationBell />)

    await user.click(screen.getByRole("button", { name: "Notifications" }))

    expect(await screen.findByText("Order shipped")).toBeInTheDocument()
    expect(requestedUrl).toContain("size=6")
  })

  it("marks all as read and removes the badge once the count refetch reports zero", async () => {
    const user = userEvent.setup()
    signIn()
    let markAllCalled = false
    server.use(
      http.get("*/backend-api/notifications/unread/count", () => HttpResponse.json(makeUnreadCountResponse(2))),
      http.get("*/backend-api/notifications", () =>
        HttpResponse.json(makeNotificationsPage({}, [makeNotification({ id: "n-1", read: false })])),
      ),
      http.patch("*/backend-api/notifications/read-all", () => {
        markAllCalled = true
        return HttpResponse.json({ updatedCount: 2 })
      }),
    )

    render(<NotificationBell />)

    expect(await screen.findByText("2")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Notifications/ }))
    await screen.findByTestId("notification-item")

    server.use(
      http.get("*/backend-api/notifications/unread/count", () => HttpResponse.json(makeUnreadCountResponse(0))),
    )

    await user.click(screen.getByRole("button", { name: "Mark all as read" }))

    await waitFor(() => expect(markAllCalled).toBe(true))
    await waitFor(() => expect(screen.queryByText("2")).not.toBeInTheDocument())
  })

  it("marks an unread row as read and closes the popover when clicked", async () => {
    const user = userEvent.setup()
    signIn()
    let markReadId: string | null = null
    server.use(
      http.get("*/backend-api/notifications", () =>
        HttpResponse.json(
          makeNotificationsPage({}, [makeNotification({ id: "n-1", read: false, title: "Unread item" })]),
        ),
      ),
      http.patch("*/backend-api/notifications/:id/read", ({ params }) => {
        markReadId = params.id as string
        return HttpResponse.json(makeNotification({ id: params.id as string, read: true }))
      }),
    )

    render(<NotificationBell />)
    await user.click(screen.getByRole("button", { name: /Notifications/ }))

    await user.click(await screen.findByText("Unread item"))

    await waitFor(() => expect(markReadId).toBe("n-1"))
    await waitFor(() => expect(screen.queryByTestId("notification-item")).not.toBeInTheDocument())
  })

  it("does not PATCH when clicking a row that is already read", async () => {
    const user = userEvent.setup()
    signIn()
    let markReadCalled = false
    server.use(
      http.get("*/backend-api/notifications", () =>
        HttpResponse.json(makeNotificationsPage({}, [makeNotification({ id: "n-1", read: true, title: "Read item" })])),
      ),
      http.patch("*/backend-api/notifications/:id/read", () => {
        markReadCalled = true
        return HttpResponse.json(makeNotification({ id: "n-1", read: true }))
      }),
    )

    render(<NotificationBell />)
    await user.click(screen.getByRole("button", { name: /Notifications/ }))

    await user.click(await screen.findByText("Read item"))

    await waitFor(() => expect(screen.queryByTestId("notification-item")).not.toBeInTheDocument())
    expect(markReadCalled).toBe(false)
  })

  it("links to the vendor notifications page for a vendor", async () => {
    const user = userEvent.setup()
    signIn({ roleName: "Vendor" })

    render(<NotificationBell />)
    await user.click(screen.getByRole("button", { name: /Notifications/ }))

    expect(await screen.findByRole("link", { name: "View all notifications" })).toHaveAttribute(
      "href",
      "/vendor-dashboard/notifications",
    )
  })

  it("links to the buyer notifications page for a non-vendor", async () => {
    const user = userEvent.setup()
    signIn({ roleName: "BUYER" })

    render(<NotificationBell />)
    await user.click(screen.getByRole("button", { name: /Notifications/ }))

    expect(await screen.findByRole("link", { name: "View all notifications" })).toHaveAttribute(
      "href",
      "/buyer-dashboard/notifications",
    )
  })
})
