import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { makeAccountUser } from "@/test/factories"
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

    await user.click(screen.getByText("Account & Lists"))

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

  it("hides the cart badge while the cart is empty and shows the count once it is not", async () => {
    render(<Navbar />, { route: "/" })

    const cartLink = screen.getByRole("link", { name: "Cart" })
    expect(cartLink.textContent).toBe("Cart")

    useCartStore.setState({ cartCount: 3 })

    await waitFor(() => expect(screen.getByRole("link", { name: "Cart" }).textContent).toContain("3"))
  })

  it("links every primary nav entry", () => {
    render(<Navbar />, { route: "/" })

    // The same links are rendered twice: once in the desktop bar and once in the mobile drawer.
    for (const link of screen.getAllByRole("link", { name: "Top Deals" })) {
      expect(link).toHaveAttribute("href", "/top-deals")
    }
    expect(screen.getAllByRole("link", { name: "Vendors" })[0]).toHaveAttribute("href", "/vendors")
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
