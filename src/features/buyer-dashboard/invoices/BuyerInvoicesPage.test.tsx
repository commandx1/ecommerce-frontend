import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@/test/render"
import BuyerInvoicesPage from "./BuyerInvoicesPage"
import { buyerInvoices } from "./invoicesData"

const invoiceHeadings = () =>
  screen.getAllByText(/^Invoice #/).map((node) => node.textContent?.replace("Invoice #", "") ?? "")

describe("BuyerInvoicesPage", () => {
  it("opens on the last 30 days, which hides everything issued before April", () => {
    render(<BuyerInvoicesPage />)

    // BUG (locked, not fixed): the "today" used by the date filter is hardcoded to
    // 2026-05-01 in BuyerInvoicesPage.tsx:89, so "Last 30 days" is frozen in time.
    expect(invoiceHeadings()).toEqual(["INV-2026-0156", "INV-2026-0155"])
    expect(screen.getByText("Showing 1-2 of 2 invoices")).toBeInTheDocument()
  })

  it("widens the result set when a longer date range is picked", async () => {
    const user = userEvent.setup()
    render(<BuyerInvoicesPage />)

    await user.selectOptions(screen.getAllByRole("combobox")[0] as HTMLElement, "This Year")

    expect(invoiceHeadings().length).toBeGreaterThan(2)
    expect(screen.getByRole("button", { name: "Date: This Year" })).toBeInTheDocument()
  })

  it("pages through the results six invoices at a time", async () => {
    const user = userEvent.setup()
    render(<BuyerInvoicesPage />)

    await user.selectOptions(screen.getAllByRole("combobox")[0] as HTMLElement, "This Year")

    expect(invoiceHeadings()).toHaveLength(6)
    expect(screen.getByText(`Showing 1-6 of ${buyerInvoices.length} invoices`)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "2" }))
    expect(
      screen.getByText(`Showing 7-${buyerInvoices.length} of ${buyerInvoices.length} invoices`),
    ).toBeInTheDocument()
  })

  it("filters by status and shows a removable chip for it", async () => {
    const user = userEvent.setup()
    render(<BuyerInvoicesPage />)

    await user.selectOptions(screen.getAllByRole("combobox")[0] as HTMLElement, "This Year")
    await user.selectOptions(screen.getAllByRole("combobox")[1] as HTMLElement, "Overdue")

    expect(invoiceHeadings()).toEqual(["INV-2026-0154", "INV-2026-0149"])

    await user.click(screen.getByRole("button", { name: "Status: Overdue" }))
    expect(screen.queryByRole("button", { name: "Status: Overdue" })).not.toBeInTheDocument()
  })

  it("searches across invoice number, vendor and item summary", async () => {
    const user = userEvent.setup()
    render(<BuyerInvoicesPage />)

    await user.selectOptions(screen.getAllByRole("combobox")[0] as HTMLElement, "This Year")
    await user.type(screen.getByPlaceholderText("Search by invoice number, amount..."), "MediCore")

    expect(invoiceHeadings()).toEqual(["INV-2026-0155"])
    expect(screen.getByRole("button", { name: "Search: MediCore" })).toBeInTheDocument()
  })

  it("says so plainly when no invoice matches", async () => {
    const user = userEvent.setup()
    render(<BuyerInvoicesPage />)

    await user.type(screen.getByPlaceholderText("Search by invoice number, amount..."), "zzzz-no-match")

    expect(screen.getByText("No invoices match the selected filters.")).toBeInTheDocument()
    expect(screen.getByText("Showing 0-0 of 0 invoices")).toBeInTheDocument()
  })

  it("clears every filter at once", async () => {
    const user = userEvent.setup()
    render(<BuyerInvoicesPage />)

    await user.selectOptions(screen.getAllByRole("combobox")[0] as HTMLElement, "This Year")
    await user.type(screen.getByPlaceholderText("Search by invoice number, amount..."), "MediCore")

    await user.click(screen.getByRole("button", { name: "Clear All" }))

    expect(screen.getByText("No active filters")).toBeInTheDocument()
    expect(invoiceHeadings()).toEqual(["INV-2026-0156", "INV-2026-0155"])
  })

  it("sorts by amount when asked", async () => {
    const user = userEvent.setup()
    render(<BuyerInvoicesPage />)

    await user.selectOptions(screen.getAllByRole("combobox")[0] as HTMLElement, "This Year")
    const sortSelect = screen.getAllByRole("combobox").at(-1) as HTMLElement
    await user.selectOptions(sortSelect, "Amount (Low to High)")

    const firstCard = screen.getAllByText(/^Invoice #/)[0]?.closest("article") as HTMLElement
    const cheapest = Math.min(...buyerInvoices.map((invoice) => invoice.amount))
    expect(firstCard.textContent).toContain(
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cheapest),
    )
  })

  it("reveals the bulk action bar only once invoices are selected", async () => {
    const user = userEvent.setup()
    render(<BuyerInvoicesPage />)

    expect(screen.queryByRole("button", { name: /Download Selected/ })).not.toBeInTheDocument()

    const checkboxes = screen.getAllByRole("checkbox")
    await user.click(checkboxes[1] as HTMLElement)

    expect(screen.getByText(/invoices? selected/)).toHaveTextContent("1 invoice selected")
    expect(screen.getByRole("button", { name: /Download Selected/ })).toBeInTheDocument()
  })

  it("selects and deselects every visible invoice from the header checkbox", async () => {
    const user = userEvent.setup()
    render(<BuyerInvoicesPage />)

    const selectAll = screen.getAllByRole("checkbox")[0] as HTMLInputElement
    await user.click(selectAll)

    expect(screen.getByText(/invoices? selected/)).toHaveTextContent("2 invoices selected")

    await user.click(selectAll)
    expect(screen.queryByText(/invoices? selected/)).not.toBeInTheDocument()
  })

  it("offers Pay Now only for unpaid invoices", async () => {
    const user = userEvent.setup()
    render(<BuyerInvoicesPage />)

    await user.selectOptions(screen.getAllByRole("combobox")[1] as HTMLElement, "Paid")
    expect(screen.queryByRole("button", { name: "Pay Now" })).not.toBeInTheDocument()

    await user.selectOptions(screen.getAllByRole("combobox")[1] as HTMLElement, "Pending")
    expect(screen.getAllByRole("button", { name: "Pay Now" }).length).toBeGreaterThan(0)
  })

  it("exposes accessible labels for the per-invoice row actions", () => {
    render(<BuyerInvoicesPage />)

    const firstCard = screen.getByText("Invoice #INV-2026-0156").closest("article") as HTMLElement
    expect(within(firstCard).getByRole("button", { name: "Download PDF" })).toBeInTheDocument()
    expect(within(firstCard).getByRole("button", { name: "View Details" })).toBeInTheDocument()
    expect(within(firstCard).getByRole("button", { name: "More Actions" })).toBeInTheDocument()
  })
})
