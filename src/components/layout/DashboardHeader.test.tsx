import { render as rtlRender } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { cartCommands } from "@/features/cart/api/cart-queries"
import { queryKeys } from "@/lib/query/keys"
import QuerySessionBoundary from "@/lib/query/QuerySessionBoundary"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeCart, makeCartItem, makeCartUserProduct } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import DashboardHeader from "./DashboardHeader"
import { DashboardMobileSidebarProvider, useDashboardMobileSidebar } from "./DashboardMobileSidebarContext"

function DrawerState() {
  const { isOpen } = useDashboardMobileSidebar()
  return <span data-testid="drawer-state">{isOpen ? "open" : "closed"}</span>
}

const renderHeader = (props: Partial<React.ComponentProps<typeof DashboardHeader>> = {}, route = "/buyer-dashboard") =>
  render(
    <DashboardMobileSidebarProvider>
      <DrawerState />
      <DashboardHeader {...props} />
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
    let getCartCount = 0
    server.use(
      http.get("*/backend-api/cart", () => {
        getCartCount += 1
        return HttpResponse.json(makeCart({ cartItems: [makeCartItem({ id: "ci-1", quantity: 4 })] }))
      }),
    )

    const { queryClient } = renderHeader({ showCart: true })

    expect(screen.getByRole("link", { name: /Cart/ })).toHaveAttribute("href", "/cart")
    await waitFor(() =>
      expect(queryClient.getQueryData(queryKeys.cart.detail())).toMatchObject({ cartId: expect.any(String) }),
    )
    expect(await screen.findByText("4")).toBeInTheDocument()
    // The mount effect (refreshCart) is the single fetch owner here: exactly one GET.
    expect(getCartCount).toBe(1)
  })

  it("updates the badge after an add goes through cartCommands.addItem", async () => {
    signIn()
    let cart = makeCart({ cartItems: [] })
    server.use(
      http.get("*/backend-api/cart", () => HttpResponse.json(cart)),
      http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 200 })),
    )

    renderHeader({ showCart: true })
    await waitFor(() => expect(screen.getByRole("link", { name: /Cart/ })).toBeInTheDocument())
    expect(screen.queryByText("2")).not.toBeInTheDocument()

    cart = makeCart({
      cartItems: [makeCartItem({ quantity: 2, userProduct: makeCartUserProduct({ userProductId: "up-1" }) })],
    })
    await cartCommands.addItem("up-1", 2)

    expect(await screen.findByText("2")).toBeInTheDocument()
  })

  it("empties the badge once the cache is cleared on logout (QuerySessionBoundary)", async () => {
    signIn()
    server.use(
      http.get("*/backend-api/cart", () => HttpResponse.json(makeCart({ cartItems: [makeCartItem({ quantity: 3 })] }))),
      http.post("*/backend-api/auth/logout", () => new HttpResponse(null, { status: 200 })),
    )

    const { queryClient } = renderHeader({ showCart: true })
    rtlRender(<QuerySessionBoundary queryClient={queryClient}>boundary</QuerySessionBoundary>)

    expect(await screen.findByText("3")).toBeInTheDocument()

    await useAuthStore.getState().logout()

    await waitFor(() => expect(screen.queryByText("3")).not.toBeInTheDocument())
  })

  it("hides the search box unless the header is configured to show it", () => {
    signIn()
    renderHeader()

    expect(screen.queryByPlaceholderText("Search products, brands, or suppliers...")).not.toBeInTheDocument()
  })

  it("shows the search box when showSearch is enabled", () => {
    signIn()
    renderHeader({ showSearch: true })

    expect(screen.getAllByPlaceholderText("Search products, brands, or suppliers...").length).toBeGreaterThan(0)
  })

  it("renders the notification bell slot", () => {
    signIn()
    renderHeader({ notificationBell: <button type="button">bell-slot</button> })

    expect(screen.getByRole("button", { name: "bell-slot" })).toBeInTheDocument()
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
