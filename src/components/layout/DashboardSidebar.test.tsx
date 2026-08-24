import userEvent from "@testing-library/user-event"
import { Package, Settings, ShoppingCart } from "lucide-react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
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

const renderSidebar = (props: Partial<React.ComponentProps<typeof DashboardSidebar>> = {}, route = "/") =>
  render(
    <DashboardMobileSidebarProvider>
      <DashboardSidebar groups={buyerGroups} {...props} />
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

  it("hides the collapse control unless collapsing is actually possible", () => {
    renderSidebar()

    expect(screen.queryByRole("button", { name: /sidebar/i })).not.toBeInTheDocument()
  })

  it("collapses and expands, persisting the choice under the storage key", async () => {
    const user = userEvent.setup()
    window.localStorage.removeItem("test-sidebar")
    renderSidebar({ collapseStorageKey: "test-sidebar" })

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }))

    expect(window.localStorage.getItem("test-sidebar")).toBe("true")
    expect(await screen.findByRole("button", { name: "Expand sidebar" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Expand sidebar" }))
    expect(window.localStorage.getItem("test-sidebar")).toBe("false")
  })

  it("restores a previously stored collapsed state", async () => {
    window.localStorage.setItem("test-sidebar-restore", "true")
    renderSidebar({ collapseStorageKey: "test-sidebar-restore" })

    expect(await screen.findByRole("button", { name: "Expand sidebar" })).toBeInTheDocument()
  })

  it("delegates collapsing to the parent when controlled", async () => {
    const user = userEvent.setup()
    const onToggleCollapse = vi.fn()
    renderSidebar({ isCollapsed: true, onToggleCollapse })

    await user.click(screen.getByRole("button", { name: "Expand sidebar" }))

    expect(onToggleCollapse).toHaveBeenCalledTimes(1)
    expect(window.localStorage.getItem("test-sidebar")).not.toBe("controlled")
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
        <DashboardSidebar groups={buyerGroups} />
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
        <DashboardSidebar groups={buyerGroups} />
      </DashboardMobileSidebarProvider>,
    )

    await user.click(screen.getByRole("button", { name: "open drawer" }))
    await user.click(screen.getByRole("link", { name: "Orders" }))

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "false")
  })
})
