import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { VENDOR_CUSTOMERS } from "@/features/vendor-dashboard/customers/lib/customers-data"
import { notFoundMock } from "@/test/mocks/next-navigation"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, within } from "@/test/render"
import CustomerProfilePage from "./[customerId]/page"
import VendorCustomersAllPage from "./all/page"
import VendorCustomersPage from "./page"

installRadixPointerPolyfills()

vi.mock("@/features/vendor-dashboard/overview/components/CustomerAnalyticsChart", () => ({
  default: () => <div data-testid="customer-analytics" />,
}))
vi.mock("@/features/vendor-dashboard/customers/components/CustomerSegmentsCard", () => ({
  default: () => <div data-testid="customer-segments" />,
}))
vi.mock("@/features/vendor-dashboard/customers/components/CustomerRevenueTrend", () => ({
  default: () => <div data-testid="customer-revenue-trend" />,
}))

describe("VendorCustomersPage", () => {
  it("derives the KPI tiles from the customer list", () => {
    render(<VendorCustomersPage />)

    const activeCustomers = VENDOR_CUSTOMERS.filter((customer) => customer.health !== "Dormant").length
    const newCustomers = VENDOR_CUSTOMERS.filter((customer) => customer.segment === "New").length

    expect(screen.getByText("Active Customers").nextElementSibling).toHaveTextContent(String(activeCustomers))
    expect(screen.getByText("New Customers (30d)").nextElementSibling).toHaveTextContent(String(newCustomers))
  })

  it("links through to the full customer directory", () => {
    render(<VendorCustomersPage />)

    expect(screen.getByRole("link", { name: "View All" })).toHaveAttribute("href", "/vendor-dashboard/customers/all")
  })
})

describe("VendorCustomersAllPage", () => {
  it("pages the directory ten accounts at a time", () => {
    render(<VendorCustomersAllPage />, { route: "/vendor-dashboard/customers/all" })

    expect(screen.getByText(`Showing 1-10 of ${VENDOR_CUSTOMERS.length}`)).toBeInTheDocument()
    expect(screen.getByText(`Page 1 / ${Math.ceil(VENDOR_CUSTOMERS.length / 10)}`)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Prev/ })).toBeDisabled()
  })

  it("reads its filters from the URL rather than local state", () => {
    render(<VendorCustomersAllPage />, {
      route: "/vendor-dashboard/customers/all",
      searchParams: "q=Sarah",
    })

    expect(screen.getByText("1 matched accounts")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Customer, clinic or email")).toHaveValue("Sarah")
  })

  it("filters by segment from the URL", () => {
    render(<VendorCustomersAllPage />, {
      route: "/vendor-dashboard/customers/all",
      searchParams: "segment=New",
    })

    const expected = VENDOR_CUSTOMERS.filter((customer) => customer.segment === "New").length
    expect(screen.getByText(`${expected} matched accounts`)).toBeInTheDocument()
  })

  it("pushes the typed query into the URL and resets to page 1", async () => {
    const user = userEvent.setup()
    const { router } = render(<VendorCustomersAllPage />, {
      route: "/vendor-dashboard/customers/all",
      searchParams: "page=2",
    })

    await user.type(screen.getByPlaceholderText("Customer, clinic or email"), "S")

    expect(router.replace).toHaveBeenLastCalledWith("/vendor-dashboard/customers/all?page=1&q=S", { scroll: false })
  })

  it("clamps an out-of-range page number instead of showing an empty table", () => {
    render(<VendorCustomersAllPage />, {
      route: "/vendor-dashboard/customers/all",
      searchParams: "page=999",
    })

    const lastPage = Math.ceil(VENDOR_CUSTOMERS.length / 10)
    expect(screen.getByText(`Page ${lastPage} / ${lastPage}`)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled()
  })

  it("shows zero results for a query nothing matches", () => {
    render(<VendorCustomersAllPage />, {
      route: "/vendor-dashboard/customers/all",
      searchParams: "q=zzzz-no-such-customer",
    })

    expect(screen.getByText("0 matched accounts")).toBeInTheDocument()
    expect(screen.getByText("Showing 0-0 of 0")).toBeInTheDocument()
  })

  it("labels every filter select so it has an accessible name", () => {
    render(<VendorCustomersAllPage />, { route: "/vendor-dashboard/customers/all" })

    expect(screen.getByRole("combobox", { name: "Segment" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Status" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Sort By" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Sort Direction" })).toBeInTheDocument()
  })

  const rowNames = () =>
    screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[0]?.textContent)

  it("sorts the visible page by the selected sort key, descending by default", () => {
    render(<VendorCustomersAllPage />, { route: "/vendor-dashboard/customers/all", searchParams: "sort=orders" })

    const expectedFirstPage = [...VENDOR_CUSTOMERS].sort((a, b) => b.orders - a.orders).slice(0, 10)
    expect(rowNames()).toEqual(expectedFirstPage.map((c) => expect.stringContaining(c.name)))
  })

  it("reverses the sort order when the sort direction is set to ascending", () => {
    render(<VendorCustomersAllPage />, {
      route: "/vendor-dashboard/customers/all",
      searchParams: "sort=orders&dir=asc",
    })

    const expectedFirstPage = [...VENDOR_CUSTOMERS].sort((a, b) => a.orders - b.orders).slice(0, 10)
    expect(rowNames()).toEqual(expectedFirstPage.map((c) => expect.stringContaining(c.name)))
  })

  it("sorts by total spend by default when no sort param is present", () => {
    render(<VendorCustomersAllPage />, { route: "/vendor-dashboard/customers/all" })

    const expectedFirstPage = [...VENDOR_CUSTOMERS].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 10)
    expect(rowNames()).toEqual(expectedFirstPage.map((c) => expect.stringContaining(c.name)))
  })

  it("combines a segment filter and a status filter (AND, not OR)", () => {
    render(<VendorCustomersAllPage />, {
      route: "/vendor-dashboard/customers/all",
      searchParams: "segment=High+Value&status=Healthy",
    })

    const expected = VENDOR_CUSTOMERS.filter(
      (customer) => customer.segment === "High Value" && customer.health === "Healthy",
    ).length
    expect(screen.getByText(`${expected} matched accounts`)).toBeInTheDocument()
  })

  it("changing the sort select pushes the sort param into the URL and resets to page 1", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { router } = render(<VendorCustomersAllPage />, {
      route: "/vendor-dashboard/customers/all",
      searchParams: "page=2",
    })

    await user.click(screen.getByRole("combobox", { name: "Sort By" }))
    await user.click(await screen.findByRole("option", { name: "Orders" }))

    expect(router.replace).toHaveBeenLastCalledWith("/vendor-dashboard/customers/all?page=1&sort=orders", {
      scroll: false,
    })
  })
})

describe("CustomerProfilePage", () => {
  it("renders the profile for a known customer", async () => {
    const page = await CustomerProfilePage({ params: Promise.resolve({ customerId: "dr-sarah-johnson" }) })
    render(page)

    expect(screen.getByRole("heading", { name: "Dr. Sarah Johnson" })).toBeInTheDocument()
    expect(screen.getByText("Johnson Dental Studio")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Back to all customers/ })).toHaveAttribute(
      "href",
      "/vendor-dashboard/customers/all",
    )
  })

  it("404s on an unknown customer id instead of rendering an empty profile", async () => {
    await expect(CustomerProfilePage({ params: Promise.resolve({ customerId: "nobody" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    )
    expect(notFoundMock).toHaveBeenCalled()
  })
})
