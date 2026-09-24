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
  afterEach(() => {
    window.localStorage.clear()
  })

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

    expect(screen.getByTestId("dashboard-sidebar")).not.toHaveAttribute("aria-modal")

    await user.click(screen.getByRole("button", { name: "open drawer" }))
    expect(screen.getByTestId("dashboard-sidebar")).toHaveAttribute("aria-modal", "true")
    expect(document.body.style.overflow).toBe("hidden")

    await user.click(screen.getByRole("button", { name: "Close menu overlay" }))
    expect(screen.getByTestId("dashboard-sidebar")).not.toHaveAttribute("aria-modal")
  })

  it("is only a dialog while the mobile drawer is open, and is always named", async () => {
    // axe `aria-dialog-name` (serious) fired on 19 dashboard routes: this carried an unnamed
    // `role="dialog"`. Permanent side navigation is not a dialog - it is always on screen and
    // traps nothing - so the role belongs to the mobile drawer only. Keeping it unconditionally
    // also meant `getByRole("dialog")` matched the sidebar on every dashboard page that opens a
    // real modal.
    const user = userEvent.setup()
    render(
      <DashboardMobileSidebarProvider>
        <MobileOpener />
        <DashboardSidebar groups={buyerGroups} brand={defaultBrand} />
      </DashboardMobileSidebarProvider>,
    )

    const sidebar = screen.getByTestId("dashboard-sidebar")
    expect(sidebar).toHaveAttribute("aria-label", "Dashboard menu")
    expect(sidebar).not.toHaveAttribute("role")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "open drawer" }))
    expect(screen.getByTestId("dashboard-sidebar")).toHaveAttribute("role", "dialog")
    // Named even as a dialog, which is the violation axe reported.
    expect(screen.getByRole("dialog", { name: "Dashboard menu" })).toBeInTheDocument()
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

    expect(screen.getByTestId("dashboard-sidebar")).not.toHaveAttribute("aria-modal")
  })

  it("renders the brand label", () => {
    renderSidebar()

    expect(screen.getByText("Buyer Panel")).toBeInTheDocument()
  })

  it("stays expanded on mobile when matchMedia is unavailable", () => {
    renderSidebar()

    expect(screen.getByTestId("dashboard-sidebar")).toHaveAttribute("data-state", "expanded")
    expect(screen.getByText("Orders").className).not.toContain("md:sr-only")
  })

  describe("desktop toggle behaviour", () => {
    afterEach(() => {
      vi.unstubAllGlobals()
      window.localStorage.clear()
    })

    /** min-width:768 and min-width:1024 both match - a wide (lg+) desktop viewport. */
    const stubWideDesktop = () => {
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
    }

    it("starts collapsed on lg+ desktop and toggles open/closed on click", () => {
      stubWideDesktop()
      renderSidebar()

      expect(screen.getByTestId("dashboard-sidebar")).toHaveAttribute("data-state", "collapsed")

      fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }))
      expect(screen.getByTestId("dashboard-sidebar")).toHaveAttribute("data-state", "expanded")
      expect(screen.getByRole("button", { name: "Collapse sidebar" })).toHaveAttribute("aria-expanded", "true")

      fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }))
      expect(screen.getByTestId("dashboard-sidebar")).toHaveAttribute("data-state", "collapsed")
    })

    it("does not expand on hover", () => {
      stubWideDesktop()
      renderSidebar()

      const panel = screen.getByTestId("dashboard-sidebar-panel")
      fireEvent.pointerEnter(panel, { pointerType: "mouse" })

      expect(screen.getByTestId("dashboard-sidebar")).toHaveAttribute("data-state", "collapsed")
    })

    it("stays expanded after following a nav link", () => {
      stubWideDesktop()
      renderSidebar()

      fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }))
      expect(screen.getByTestId("dashboard-sidebar")).toHaveAttribute("data-state", "expanded")

      fireEvent.click(screen.getByRole("link", { name: "Orders" }))
      expect(screen.getByTestId("dashboard-sidebar")).toHaveAttribute("data-state", "expanded")
    })

    it("persists the open preference across renders", () => {
      stubWideDesktop()
      const { unmount } = renderSidebar()

      fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }))
      expect(window.localStorage.getItem("dashboard-sidebar-pinned")).toBe("1")
      unmount()

      renderSidebar()
      expect(screen.getByTestId("dashboard-sidebar")).toHaveAttribute("data-state", "expanded")
    })

    it("stays the icon rail with no toggle on md-only widths, even with a stored preference", () => {
      window.localStorage.setItem("dashboard-sidebar-pinned", "1")
      const mqlFor = (query: string) => ({
        matches: query.includes("768"),
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

      expect(screen.getByTestId("dashboard-sidebar")).toHaveAttribute("data-state", "collapsed")
      expect(screen.queryByRole("button", { name: /sidebar/i })).not.toBeInTheDocument()
    })
  })
})
