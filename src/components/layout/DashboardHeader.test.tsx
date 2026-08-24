import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { makeAccountUser, makeCart, makeCartItem } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import DashboardHeader, { type DashboardHeaderNavItem } from "./DashboardHeader"
import { DashboardMobileSidebarProvider, useDashboardMobileSidebar } from "./DashboardMobileSidebarContext"

const navItems: DashboardHeaderNavItem[] = [
  { href: "/buyer-dashboard", label: "Dashboard" },
  { href: "/buyer-dashboard/orders", label: "Orders", matchMode: "startsWith" },
]

function DrawerState() {
  const { isOpen } = useDashboardMobileSidebar()
  return <span data-testid="drawer-state">{isOpen ? "open" : "closed"}</span>
}

const renderHeader = (props: Partial<React.ComponentProps<typeof DashboardHeader>> = {}, route = "/buyer-dashboard") =>
  render(
    <DashboardMobileSidebarProvider>
      <DrawerState />
      <DashboardHeader navItems={navItems} {...props} />
    </DashboardMobileSidebarProvider>,
    { route },
  )

const signIn = (overrides: Partial<ReturnType<typeof makeAccountUser>> = {}) => {
  useAuthStore.setState({
    user: makeAccountUser(overrides),
    accessToken: "access-token",
    isAuthenticated: true,
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("DashboardHeader", () => {
  it("renders the nav items and marks the current route", () => {
    signIn()
    renderHeader({}, "/buyer-dashboard/orders/ord-1")

    // Only styling distinguishes the active tab — no `aria-current` is emitted.
    expect(screen.getByRole("link", { name: "Orders" }).className).toContain("text-brand")
    expect(screen.getByRole("link", { name: "Dashboard" }).className).toContain("border-transparent")
  })

  it("shows the signed-in user's full name", () => {
    signIn({ name: "Serhat", surname: "Belen" })
    renderHeader()

    expect(screen.getByText("Serhat Belen")).toBeInTheDocument()
  })

  it("falls back to the configured account label when nobody is signed in", () => {
    renderHeader({ accountFallbackName: "Vendor Account" })

    expect(screen.getByText("Vendor Account")).toBeInTheDocument()
  })

  it("hides the cart unless the header is configured to show it", () => {
    signIn()
    renderHeader({ showCart: false })

    expect(screen.queryByRole("link", { name: /Cart/ })).not.toBeInTheDocument()
  })

  it("shows the live cart count when the cart is enabled", async () => {
    signIn()
    server.use(
      http.get("*/backend-api/cart", () =>
        HttpResponse.json(makeCart({ cartItems: [makeCartItem({ id: "ci-1", quantity: 4 })] })),
      ),
    )

    renderHeader({ showCart: true })

    expect(screen.getByRole("link", { name: /Cart/ })).toHaveAttribute("href", "/cart")
    await waitFor(() => expect(useCartStore.getState().cartCount).toBe(4))
    expect(await screen.findByText("4")).toBeInTheDocument()
  })

  it("toggles the mobile sidebar drawer", async () => {
    const user = userEvent.setup()
    signIn()
    renderHeader()

    expect(screen.getByTestId("drawer-state")).toHaveTextContent("closed")

    await user.click(screen.getByRole("button", { name: "Open menu" }))
    expect(screen.getByTestId("drawer-state")).toHaveTextContent("open")
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true")

    await user.click(screen.getByRole("button", { name: "Close menu" }))
    expect(screen.getByTestId("drawer-state")).toHaveTextContent("closed")
  })

  it("signs the user out and sends them to the storefront", async () => {
    const user = userEvent.setup()
    signIn()
    const { router } = renderHeader()

    await user.click(screen.getByRole("button", { name: /Serhat/ }))
    await user.click(await screen.findByRole("button", { name: /Sign Out/ }))

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false))
    expect(router.push).toHaveBeenCalledWith("/")
    expect(router.refresh).toHaveBeenCalled()
  })
})
