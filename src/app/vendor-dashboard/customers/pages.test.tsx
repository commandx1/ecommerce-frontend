import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { notFoundMock } from "@/test/mocks/next-navigation"
import { render, screen } from "@/test/render"
import CustomerProfilePage from "./[customerId]/page"
import VendorCustomersAllPage from "./all/page"
import { VENDOR_CUSTOMERS } from "./data"
import VendorCustomersPage from "./page"

vi.mock("../components/CustomerAnalyticsChart", () => ({ default: () => <div data-testid="customer-analytics" /> }))
vi.mock("./components/CustomerSegmentsCard", () => ({ default: () => <div data-testid="customer-segments" /> }))
vi.mock("./components/CustomerRevenueTrend", () => ({ default: () => <div data-testid="customer-revenue-trend" /> }))

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
