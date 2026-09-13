import userEvent from "@testing-library/user-event"
import { Package, Settings, ShoppingCart } from "lucide-react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@/test/render"
import { DashboardMobileSidebarProvider, useDashboardMobileSidebar } from "./DashboardMobileSidebarContext"
import DashboardSidebar, { type DashboardSidebarGroup } from "./DashboardSidebar"

/** Small helper that can open the drawer from outside the sidebar, like DashboardHeader does. */
function MobileOpener() {
  const { open } = useDashboardMobileSidebar()
  return (
    <button type="button" onClick={open}>
      open drawer
    </button>
  )
}

const buyerGroups: DashboardSidebarGroup[] = [
  {
    title: "Buying",
    items: [
      { href: "/buyer-dashboard", label: "Overview", icon: Package },
      { href: "/buyer-dashboard/orders", label: "Orders", icon: ShoppingCart, matchMode: "startsWith" },
    ],
  },
  {
    title: "Account",
    items: [{ href: "/buyer-dashboard/settings", label: "Settings", icon: Settings }],
  },
]

const vendorGroups: DashboardSidebarGroup[] = [
  {
    title: "Selling",
    items: [
      { href: "/vendor-dashboard", label: "Overview", icon: Package },
      {
        href: "/vendor-dashboard/products",
        label: "Products",
        icon: ShoppingCart,
        badge: { label: "3", tone: "info" },
      },
    ],
    subgroups: [
      {
        title: "Insights",
        items: [{ href: "/vendor-dashboard/analytics", label: "Analytics", icon: Package }],
      },
    ],
  },
]

const defaultBrand = { label: "Buyer Panel", icon: Package }

const renderSidebar = (props: Partial<React.ComponentProps<typeof DashboardSidebar>> = {}, route = "/") =>
  render(
    <DashboardMobileSidebarProvider>
      <DashboardSidebar groups={buyerGroups} brand={defaultBrand} {...props} />
    </DashboardMobileSidebarProvider>,
    { route },
  )

describe("DashboardSidebar", () => {
  it("renders the buyer's navigation groups", () => {
    renderSidebar({}, "/buyer-dashboard")

    expect(screen.getByRole("heading", { name: "Buying" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/buyer-dashboard")
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/buyer-dashboard/orders")
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument()
  })

  it("renders vendor groups, subgroups and badges", () => {
    renderSidebar({ groups: vendorGroups }, "/vendor-dashboard")

    expect(screen.getByRole("heading", { name: "Selling" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Insights" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Products/ })).toHaveTextContent("3")
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument()
  })

  it("highlights the exact-match route only on that route", () => {
    renderSidebar({}, "/buyer-dashboard/orders")

    // BUG (locked, not fixed): the active item is signalled with colour classes only —
    // there is no `aria-current="page"`, so screen readers cannot tell where the user is.
    expect(screen.queryByRole("link", { current: "page" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Orders" }).className).toContain("text-brand")
    expect(screen.getByRole("link", { name: "Overview" }).className).not.toContain("bg-brand/10")
  })

  it("keeps a startsWith item active on nested routes", () => {
    renderSidebar({}, "/buyer-dashboard/orders/ord-1")

    expect(screen.getByRole("link", { name: "Orders" }).className).toContain("bg-brand/10")
  })

  it("renders quick actions as links or plain buttons and honours `disabled`", () => {
    renderSidebar({
      quickActions: [
        { label: "New order", icon: Package, href: "/products" },
        { label: "Coming soon", icon: Settings, disabled: true },
      ],
    })

    expect(screen.getByRole("link", { name: "New order" })).toHaveAttribute("href", "/products")
    expect(screen.getByRole("button", { name: "Coming soon" })).toBeDisabled()
  })

  it("exposes the mobile drawer as a dialog and closes it from the overlay", async () => {
    const user = userEvent.setup()
    render(
      <DashboardMobileSidebarProvider>
        <MobileOpener />
        <DashboardSidebar groups={buyerGroups} brand={defaultBrand} />
      </DashboardMobileSidebarProvider>,
    )

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "false")

    await user.click(screen.getByRole("button", { name: "open drawer" }))
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true")
    expect(document.body.style.overflow).toBe("hidden")

    await user.click(screen.getByRole("button", { name: "Close menu overlay" }))
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "false")
  })

  it("closes the mobile drawer when a nav link is followed", async () => {
    const user = userEvent.setup()
    render(
      <DashboardMobileSidebarProvider>
        <MobileOpener />
        <DashboardSidebar groups={buyerGroups} brand={defaultBrand} />
      </DashboardMobileSidebarProvider>,
    )

    await user.click(screen.getByRole("button", { name: "open drawer" }))
    await user.click(screen.getByRole("link", { name: "Orders" }))

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "false")
  })

  it("renders the brand label and footer items", () => {
    renderSidebar({
      footerItems: [{ href: "/buyer-dashboard/settings", label: "Account", icon: Settings }],
    })

    expect(screen.getByText("Buyer Panel")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute("href", "/buyer-dashboard/settings")
  })

  it("renders the signed-in user at the bottom as a link to the account page", () => {
    renderSidebar(
      { account: { name: "Serhat Belen", email: "serhat@example.com", href: "/buyer-dashboard/settings" } },
      "/buyer-dashboard/settings",
    )

    const link = screen.getByRole("link", { name: /Serhat Belen/ })
    expect(link).toHaveAttribute("href", "/buyer-dashboard/settings")
    expect(link).toHaveTextContent("serhat@example.com")
    expect(link.className).toContain("bg-brand/10")
    expect(screen.getByText("SB")).toHaveAttribute("aria-hidden", "true")
  })

  it("stays expanded on mobile when matchMedia is unavailable", () => {
    renderSidebar()

    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "expanded")
    expect(screen.getByText("Orders").className).not.toContain("md:sr-only")
  })

  describe("desktop hover behaviour", () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it("collapses to an icon rail on desktop and expands on hover", () => {
      if (typeof window.PointerEvent === "undefined") {
        class PointerEventPolyfill extends MouseEvent {
          pointerType: string
          constructor(type: string, init?: PointerEventInit) {
            super(type, init)
            this.pointerType = init?.pointerType ?? ""
          }
        }
        // @ts-expect-error - jsdom lacks PointerEvent, polyfill for this test only
        window.PointerEvent = PointerEventPolyfill
      }

      const mql = {
        matches: true,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
      vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mql))

      renderSidebar()

      expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "collapsed")
      expect(screen.getByText("Orders").className).toContain("md:sr-only")
      expect(screen.getByRole("link", { name: "Orders" })).toBeInTheDocument()

      const panel = screen.getByTestId("dashboard-sidebar-panel")
      fireEvent(panel, new PointerEvent("pointerover", { pointerType: "mouse", bubbles: true }))

      expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "expanded")
      expect(screen.getByText("Orders").className).not.toContain("md:sr-only")

      fireEvent(panel, new PointerEvent("pointerout", { pointerType: "mouse", bubbles: true }))

      expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "collapsed")
    })

    it("offers a toggle on touch-only desktop widths and closes again after navigating", () => {
      const mqlFor = (query: string) => ({
        matches: query.includes("min-width"),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })
      vi.stubGlobal("matchMedia", vi.fn().mockImplementation(mqlFor))

      renderSidebar()

      expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "collapsed")

      // fireEvent.click (not userEvent) so no synthetic mouse pointer events fire - a touch tap has none
      fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }))
      expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "expanded")
      expect(screen.getByRole("button", { name: "Collapse sidebar" })).toHaveAttribute("aria-expanded", "true")

      fireEvent.click(screen.getByRole("link", { name: "Orders" }))
      expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "collapsed")
    })

    it("hides the toggle when the device can hover", () => {
      const mql = {
        matches: true,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
      vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mql))

      renderSidebar()

      expect(screen.queryByRole("button", { name: /sidebar/i })).not.toBeInTheDocument()
    })

    it("expands when a link inside receives keyboard focus", async () => {
      const mql = {
        matches: true,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
      vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mql))

      const user = userEvent.setup()
      renderSidebar()

      expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "collapsed")

      let dialog = screen.getByRole("dialog")
      for (let i = 0; i < 10 && dialog.getAttribute("data-state") !== "expanded"; i++) {
        await user.tab()
        dialog = screen.getByRole("dialog")
      }

      expect(dialog).toHaveAttribute("data-state", "expanded")
    })
  })
})
