import { render as rtlRender } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { cartCommands, refreshCart } from "@/features/cart/api/cart-queries"
import QuerySessionBoundary from "@/lib/query/QuerySessionBoundary"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { seedCart } from "@/test/cart"
import { makeAccountUser, makeCart, makeCartItem, makeCartUserProduct } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import Footer from "./Footer"
import Navbar from "./Navbar"

const signIn = (overrides = {}) => useAuthStore.getState().setAuth(makeAccountUser(overrides), "token-1", "refresh-1")

describe("Navbar", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("offers the sign-in affordance to an anonymous visitor", async () => {
    const user = userEvent.setup()
    const { router } = render(<Navbar />, { route: "/" })

    await user.click(screen.getAllByRole("button", { name: "Sign In" })[0])

    expect(router.push).toHaveBeenCalledWith("/login")
    expect(screen.queryByText("My Account")).not.toBeInTheDocument()
  })

  it("swaps in the account menu once the store reports a session", async () => {
    signIn()
    render(<Navbar />, { route: "/" })

    expect(await screen.findByText("My Account")).toBeInTheDocument()
    expect(screen.getByText("Serhat Belen")).toBeInTheDocument()
  })

  it("routes a buyer to the buyer dashboard from the account menu", async () => {
    const user = userEvent.setup()
    signIn({ roleName: "BUYER" })
    const { router } = render(<Navbar />, { route: "/" })

    await user.click(await screen.findByText("My Account"))
    await user.click(screen.getAllByRole("button", { name: /Dashboard/ })[0])

    expect(router.push).toHaveBeenCalledWith("/buyer-dashboard")
  })

  it("routes a vendor to the vendor dashboard from the account menu", async () => {
    const user = userEvent.setup()
    signIn({ roleName: "Vendor" })
    const { router } = render(<Navbar />, { route: "/" })

    await user.click(await screen.findByText("My Account"))
    await user.click(screen.getAllByRole("button", { name: /Dashboard/ })[0])

    expect(router.push).toHaveBeenCalledWith("/vendor-dashboard")
  })

  it("signs out, refreshes the server data and returns to the storefront", async () => {
    const user = userEvent.setup()
    signIn()
    server.use(http.post("*/backend-api/auth/logout", () => new HttpResponse(null, { status: 200 })))
    const { router } = render(<Navbar />, { route: "/" })

    await user.click(await screen.findByText("My Account"))
    await user.click(screen.getAllByRole("button", { name: /Sign Out/ })[0])

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"))
    expect(router.refresh).toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("hides the cart badge while the cart is empty and shows the count from the cache once it is not", async () => {
    const { queryClient } = render(<Navbar />, { route: "/" })

    const cartLink = screen.getByRole("link", { name: "Cart" })
    expect(cartLink.textContent).toBe("Cart")

    seedCart(queryClient, makeCart({ cartItems: [makeCartItem({ quantity: 3 })] }))

    await waitFor(() => expect(screen.getByRole("link", { name: "Cart" }).textContent).toContain("3"))
  })

  it("reads a count an owner already fetched from the backend (msw cart), without fetching itself", async () => {
    let getCartCount = 0
    server.use(
      http.get("*/backend-api/cart", () => {
        getCartCount += 1
        return HttpResponse.json(makeCart({ cartItems: [makeCartItem({ quantity: 5 })] }))
      }),
    )
    signIn()
    // Renders first, so the singleton browser client this test's `refreshCart` call below writes
    // into is the same one Navbar reads from (`render` installs a fresh client as that singleton).
    render(<Navbar />, { route: "/" })

    // Simulates an owner (DashboardHeader mount / useAuthHydration) having already populated the
    // cache before Navbar's own render commits its badge.
    await refreshCart()
    expect(getCartCount).toBe(1)

    expect(await screen.findByRole("link", { name: "Cart" })).toHaveTextContent("5")
    // Mounting the badge reader must not cause a second GET /cart.
    expect(getCartCount).toBe(1)
  })

  it("updates the badge after an add goes through cartCommands.addItem", async () => {
    signIn()
    let cart = makeCart({ cartItems: [] })
    server.use(
      http.get("*/backend-api/cart", () => HttpResponse.json(cart)),
      http.post("*/backend-api/cart/items", () => new HttpResponse(null, { status: 200 })),
    )
    const { queryClient } = render(<Navbar />, { route: "/" })
    seedCart(queryClient, cart)

    const cartLink = screen.getByRole("link", { name: "Cart" })
    expect(cartLink.textContent).toBe("Cart")

    cart = makeCart({
      cartItems: [makeCartItem({ quantity: 2, userProduct: makeCartUserProduct({ userProductId: "up-1" }) })],
    })
    await cartCommands.addItem("up-1", 2)

    await waitFor(() => expect(screen.getByRole("link", { name: "Cart" }).textContent).toContain("2"))
  })

  it("empties the badge once the cache is cleared on logout (QuerySessionBoundary)", async () => {
    signIn()
    const { queryClient } = render(<Navbar />, { route: "/" })
    rtlRender(<QuerySessionBoundary queryClient={queryClient}>boundary</QuerySessionBoundary>)

    seedCart(queryClient, makeCart({ cartItems: [makeCartItem({ quantity: 3 })] }))
    await waitFor(() => expect(screen.getByRole("link", { name: "Cart" }).textContent).toContain("3"))

    server.use(http.post("*/backend-api/auth/logout", () => new HttpResponse(null, { status: 200 })))
    await useAuthStore.getState().logout()

    await waitFor(() => expect(screen.getByRole("link", { name: "Cart" }).textContent).toBe("Cart"))
  })

  it("links every primary nav entry", () => {
    render(<Navbar />, { route: "/" })

    // Desktop bar links; the mobile menu's copies are only mounted while that menu is open.
    for (const link of screen.getAllByRole("link", { name: "Vendors" })) {
      expect(link).toHaveAttribute("href", "/vendors")
    }
  })

  // Four of the five entries here (Top Deals, Equipment, Lab Services, Resources) pointed at
  // routes that do not exist, so most of the site's main navigation 404'd on click. They were
  // removed rather than repointed; each is to come back WITH its page. `internal-links.test.ts`
  // guards the whole codebase against the class, this guards the navigation itself.
  it.each(["Top Deals", "Equipment", "Lab Services", "Resources"])(
    "does not offer %s, which has no page behind it",
    (label) => {
      render(<Navbar />, { route: "/" })

      expect(screen.queryByRole("link", { name: label })).not.toBeInTheDocument()
    },
  )

  it("links All Categories to the category directory", () => {
    render(<Navbar />, { route: "/" })

    // Desktop bar link; the mobile menu's copy is only mounted while that menu is open.
    for (const link of screen.getAllByRole("link", { name: /all categories/i })) {
      expect(link).toHaveAttribute("href", "/categories")
    }
  })

  it("toggles the mobile menu and reports its state", async () => {
    const user = userEvent.setup()
    render(<Navbar />, { route: "/" })

    const toggle = screen.getByRole("button", { name: "Open menu" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")

    await user.click(toggle)

    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true")
  })
})

describe("Footer", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("groups the site links under their headings", () => {
    render(<Footer />)

    expect(screen.getByRole("link", { name: "Help Center" })).toHaveAttribute("href", "/help-center")
    expect(screen.getByRole("link", { name: "Legal" })).toHaveAttribute("href", "/legal")
    expect(screen.getByRole("link", { name: "Lab Services" })).toHaveAttribute("href", "/lab-services")
  })

  it("labels every social link for screen readers", () => {
    render(<Footer />)

    for (const label of ["Facebook", "X", "LinkedIn", "Instagram"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument()
    }
  })
})
