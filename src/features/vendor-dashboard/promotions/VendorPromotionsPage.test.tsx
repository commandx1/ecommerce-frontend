import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, within } from "@/test/render"
import { PROMOTION_CAMPAIGNS } from "./lib/mock-data"
import VendorPromotionsPage from "./VendorPromotionsPage"

installRadixPointerPolyfills()

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

/** The campaign table is the only <table> on the page; drop the header row to iterate data rows. */
const tableRows = () => screen.getAllByRole("row").slice(1)
/** The name cell also holds the objective as a second line, so read only the name's own element. */
const rowNames = () =>
  tableRows().map((row) => {
    const nameCell = within(row).getAllByRole("cell")[0]
    return nameCell?.querySelector(".font-medium")?.textContent ?? ""
  })

const nonArchived = PROMOTION_CAMPAIGNS.filter((c) => c.status !== "Archived")
/** The table's default sort is revenue descending; this is the order rows actually render in. */
const defaultOrder = () => [...nonArchived].sort((a, b) => b.revenue - a.revenue)
const firstOfStatus = (status: (typeof nonArchived)[number]["status"]) =>
  defaultOrder().find((c) => c.status === status)

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("VendorPromotionsPage", () => {
  describe("KPI snapshot", () => {
    it("counts only Active campaigns for the Active Campaigns metric", () => {
      render(<VendorPromotionsPage />)

      const activeCount = nonArchived.filter((c) => c.status === "Active").length
      expect(screen.getByText("Active Campaigns").parentElement?.nextElementSibling).toHaveTextContent(
        String(activeCount),
      )
    })

    it("sums spend and revenue across non-archived campaigns only", () => {
      render(<VendorPromotionsPage />)

      const spend = nonArchived.reduce((sum, c) => sum + c.spend, 0)
      const revenue = nonArchived.reduce((sum, c) => sum + c.revenue, 0)
      const kpiSection = screen.getByText("Active Campaigns").closest("section") as HTMLElement
      expect(within(kpiSection).getByText("Spend").parentElement?.nextElementSibling).toHaveTextContent(
        new RegExp(`\\$${spend.toLocaleString("en-US")}`),
      )
      expect(within(kpiSection).getByText("Attributed Revenue").parentElement?.nextElementSibling).toHaveTextContent(
        new RegExp(`\\$${revenue.toLocaleString("en-US")}`),
      )
    })
  })

  describe("channel mix and featured campaigns", () => {
    it("shows a revenue figure for every channel option", () => {
      render(<VendorPromotionsPage />)

      for (const channel of ["Email", "Paid Search", "Social", "Marketplace", "On-site"]) {
        expect(screen.getAllByText(channel).length).toBeGreaterThan(0)
      }
    })

    it("highlights a top performer, an underperformer and an ending-soon campaign", () => {
      render(<VendorPromotionsPage />)

      expect(screen.getByText("Top Performer")).toBeInTheDocument()
      expect(screen.getByText("Needs Optimization")).toBeInTheDocument()
      expect(screen.getByText("Ending Soon")).toBeInTheDocument()
      // Every featured slot has a real campaign in the seed data, not the "no match" fallback.
      expect(screen.queryByText("No matching campaign yet.")).not.toBeInTheDocument()
    })
  })

  describe("table and filters", () => {
    it("hides archived campaigns by default", () => {
      render(<VendorPromotionsPage />)

      const archived = PROMOTION_CAMPAIGNS.find((c) => c.status === "Archived")
      expect(screen.queryByText(archived?.name ?? "")).not.toBeInTheDocument()
    })

    it("shows archived campaigns when the Status filter is set to Archived", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<VendorPromotionsPage />)

      await user.click(screen.getByRole("combobox", { name: "Status" }))
      await user.click(await screen.findByRole("option", { name: "Archived" }))

      const archived = PROMOTION_CAMPAIGNS.find((c) => c.status === "Archived")
      expect(await screen.findByText(archived?.name ?? "")).toBeInTheDocument()
    })

    it("filters rows by a search term matching the campaign name", async () => {
      const user = userEvent.setup()
      render(<VendorPromotionsPage />)

      await user.type(screen.getByPlaceholderText("Search campaign or objective"), "Spring Restock")

      expect(rowNames()).toEqual(["Spring Restock Boost"])
    })

    it("filters rows by a search term matching the objective", async () => {
      const user = userEvent.setup()
      render(<VendorPromotionsPage />)

      await user.type(screen.getByPlaceholderText("Search campaign or objective"), "retention")

      const expected = nonArchived.filter((c) => c.objective === "Retention").map((c) => c.name)
      expect(rowNames()).toEqual(expected)
    })

    it("filters rows by channel", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<VendorPromotionsPage />)

      await user.click(screen.getByRole("combobox", { name: "Channel" }))
      await user.click(await screen.findByRole("option", { name: "Email" }))

      const expected = nonArchived.filter((c) => c.channel === "Email").map((c) => c.name)
      expect(rowNames()).toEqual(expected)
    })

    it("sorts by revenue descending by default", () => {
      render(<VendorPromotionsPage />)

      const expected = [...nonArchived].sort((a, b) => b.revenue - a.revenue).map((c) => c.name)
      expect(rowNames()).toEqual(expected)
    })

    it("re-sorts the table when the Sort By key changes", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<VendorPromotionsPage />)

      await user.click(screen.getByRole("combobox", { name: "Sort By" }))
      await user.click(await screen.findByRole("option", { name: "Spend" }))

      const expected = [...nonArchived].sort((a, b) => b.spend - a.spend).map((c) => c.name)
      expect(rowNames()).toEqual(expected)
    })

    it("reverses the sort when the direction is switched to ascending", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<VendorPromotionsPage />)

      await user.click(screen.getByRole("combobox", { name: "Sort Direction" }))
      await user.click(await screen.findByRole("option", { name: "Asc" }))

      const expected = [...nonArchived].sort((a, b) => a.revenue - b.revenue).map((c) => c.name)
      expect(rowNames()).toEqual(expected)
    })

    it("switches the active period button without crashing (display-only toggle)", async () => {
      const user = userEvent.setup()
      render(<VendorPromotionsPage />)

      const sevenDay = screen.getByRole("button", { name: "7D" })
      await user.click(sevenDay)

      expect(sevenDay).toHaveClass("bg-brand")
    })
  })

  describe("creating a campaign", () => {
    it("rejects an empty name/budget with an error toast and does not add a row", async () => {
      const user = userEvent.setup()
      render(<VendorPromotionsPage />)

      await user.click(screen.getByRole("button", { name: /Create Campaign/ }))
      const dialog = await screen.findByRole("dialog")
      await user.click(within(dialog).getByRole("button", { name: "Create" }))

      expect(toastSpies.error).toHaveBeenCalledWith("Invalid form", "Please enter campaign name and a valid budget.")
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("rejects an end date before the start date", async () => {
      const user = userEvent.setup()
      render(<VendorPromotionsPage />)

      await user.click(screen.getByRole("button", { name: /Create Campaign/ }))
      const dialog = await screen.findByRole("dialog")
      await user.type(within(dialog).getByPlaceholderText("e.g. Summer Instruments Lift"), "Bad Dates Campaign")
      await user.type(within(dialog).getByLabelText("Budget (USD)"), "500")
      const [startInput, endInput] = within(dialog).getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/)
      await user.clear(endInput as HTMLElement)
      await user.type(endInput as HTMLElement, "2020-01-01")
      await user.clear(startInput as HTMLElement)
      await user.type(startInput as HTMLElement, "2020-06-01")
      await user.click(within(dialog).getByRole("button", { name: "Create" }))

      expect(toastSpies.error).toHaveBeenCalledWith("Invalid date range", "End date must be after start date.")
    })

    it("adds a new Draft campaign to the table on a valid submission", async () => {
      const user = userEvent.setup()
      render(<VendorPromotionsPage />)

      await user.click(screen.getByRole("button", { name: /Create Campaign/ }))
      const dialog = await screen.findByRole("dialog")
      await user.type(within(dialog).getByPlaceholderText("e.g. Summer Instruments Lift"), "Fresh Launch Campaign")
      await user.type(within(dialog).getByLabelText("Budget (USD)"), "1500")
      await user.click(within(dialog).getByRole("button", { name: "Create" }))

      expect(toastSpies.success).toHaveBeenCalledWith(
        "Campaign created",
        "Fresh Launch Campaign has been added as Draft.",
      )
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      // New campaigns start at 0 revenue, so under the default revenue-desc sort they land
      // wherever a zero-revenue row sorts, not necessarily first - only presence is asserted.
      expect(rowNames()).toContain("Fresh Launch Campaign")
    })
  })

  describe("editing a campaign", () => {
    it("pre-fills the form with the campaign's current values", async () => {
      const user = userEvent.setup()
      render(<VendorPromotionsPage />)

      await user.click(screen.getAllByRole("button", { name: "Edit" })[0] as HTMLElement)
      const dialog = await screen.findByRole("dialog")

      expect(within(dialog).getByPlaceholderText("e.g. Summer Instruments Lift")).toHaveValue(defaultOrder()[0]?.name)
      expect(within(dialog).getByLabelText("Budget (USD)")).toHaveValue(defaultOrder()[0]?.budget)
    })

    it("saves changes and updates the row", async () => {
      const user = userEvent.setup()
      render(<VendorPromotionsPage />)

      await user.click(screen.getAllByRole("button", { name: "Edit" })[0] as HTMLElement)
      const dialog = await screen.findByRole("dialog")
      const nameInput = within(dialog).getByPlaceholderText("e.g. Summer Instruments Lift")
      await user.clear(nameInput)
      await user.type(nameInput, "Renamed Campaign")
      await user.click(within(dialog).getByRole("button", { name: "Save Changes" }))

      expect(toastSpies.success).toHaveBeenCalledWith("Campaign updated", "Changes were saved successfully.")
      expect(screen.getByText("Renamed Campaign")).toBeInTheDocument()
    })
  })

  it("duplicates a campaign as a new Draft with a 'Copy •' prefix", async () => {
    const user = userEvent.setup()
    render(<VendorPromotionsPage />)

    const firstCampaignName = defaultOrder()[0]?.name ?? ""
    await user.click(screen.getAllByRole("button", { name: "Duplicate" })[0] as HTMLElement)

    expect(toastSpies.info).toHaveBeenCalledWith(
      "Campaign duplicated",
      `Copy • ${firstCampaignName} is ready for edits.`,
    )
    expect(screen.getByText(`Copy • ${firstCampaignName}`)).toBeInTheDocument()
  })

  describe("pausing and resuming", () => {
    it("pauses an Active campaign", async () => {
      const user = userEvent.setup()
      render(<VendorPromotionsPage />)

      const active = firstOfStatus("Active")
      await user.click(screen.getAllByRole("button", { name: "Pause" })[0] as HTMLElement)

      expect(toastSpies.success).toHaveBeenCalledWith("Campaign paused", `${active?.name} is now paused.`)
    })

    it("resumes a Paused campaign", async () => {
      const user = userEvent.setup()
      render(<VendorPromotionsPage />)

      const paused = firstOfStatus("Paused")
      await user.click(screen.getAllByRole("button", { name: "Resume" })[0] as HTMLElement)

      expect(toastSpies.success).toHaveBeenCalledWith("Campaign resumed", `${paused?.name} is now active.`)
    })
  })

  describe("archiving a campaign", () => {
    it("asks for confirmation and does nothing on Cancel", async () => {
      const user = userEvent.setup()
      render(<VendorPromotionsPage />)

      const target = defaultOrder()[0]
      await user.click(screen.getAllByRole("button", { name: "Archive" })[0] as HTMLElement)
      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByText(`“${target?.name}” will be moved to archived campaigns.`)).toBeInTheDocument()

      await user.click(within(dialog).getByRole("button", { name: "Cancel" }))

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      expect(screen.getByText(target?.name ?? "")).toBeInTheDocument()
    })

    it("archives the campaign and removes it from the default view on Confirm", async () => {
      const user = userEvent.setup()
      render(<VendorPromotionsPage />)

      const target = defaultOrder()[0]
      await user.click(screen.getAllByRole("button", { name: "Archive" })[0] as HTMLElement)
      const dialog = await screen.findByRole("dialog")
      await user.click(within(dialog).getByRole("button", { name: "Archive" }))

      expect(toastSpies.warning).toHaveBeenCalledWith(
        "Campaign archived",
        `${target?.name} moved to archived campaigns.`,
      )
      expect(screen.queryByText(target?.name ?? "")).not.toBeInTheDocument()
    })
  })
})
