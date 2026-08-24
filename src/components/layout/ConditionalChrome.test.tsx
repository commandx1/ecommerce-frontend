import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import ConditionalFooter from "./ConditionalFooter"
import ConditionalNavbar from "./ConditionalNavbar"

beforeEach(() => {
  vi.restoreAllMocks()
})

const PUBLIC_ROUTES = ["/", "/products", "/cart", "/help-center", "/legal"]
const CHROME_FREE_ROUTES = [
  "/buyer-dashboard",
  "/buyer-dashboard/orders",
  "/vendor-dashboard",
  "/login",
  "/register",
  "/verify-email",
  "/verify-2fa",
  "/forgot-password",
  "/reset-password",
]

describe("ConditionalNavbar", () => {
  it.each(PUBLIC_ROUTES)("renders the storefront navbar on %s", (route) => {
    render(<ConditionalNavbar />, { route })

    expect(screen.getByRole("banner")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Cart" })).toBeInTheDocument()
  })

  it.each(CHROME_FREE_ROUTES)("renders nothing on %s", (route) => {
    render(<ConditionalNavbar />, { route })

    expect(screen.queryByRole("banner")).not.toBeInTheDocument()
  })

  it("uses the server-provided auth state before hydration completes", () => {
    render(
      <ConditionalNavbar
        initialAuthState={{
          user: { id: "u-1", name: "Serhat", surname: "Belen", email: "serhat@example.com" },
          isAuthenticated: true,
        }}
      />,
      { route: "/" },
    )

    expect(screen.getByRole("banner")).toBeInTheDocument()
  })
})

describe("ConditionalFooter", () => {
  it.each(PUBLIC_ROUTES)("renders the storefront footer on %s", (route) => {
    render(<ConditionalFooter />, { route })

    expect(screen.getByRole("contentinfo")).toBeInTheDocument()
  })

  it.each(CHROME_FREE_ROUTES)("renders nothing on %s", (route) => {
    render(<ConditionalFooter />, { route })

    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument()
  })
})
