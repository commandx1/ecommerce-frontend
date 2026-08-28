import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen } from "@/test/render"
import TicketSubmissionForm from "./TicketSubmissionForm"

// Radix `Select` in jsdom is genuinely slow: these cases run in ~450ms in isolation but blow past
// the 5s default under the full suite's parallel worker load - an ~11x stretch, measured 27 Aug
// 2026. Infra note #11 had been writing this off as "false flaky from other agents running tests",
// but it reproduces with nothing else running: the suite's own workers are the load. The work is
// real, so the budget matches it instead of the test being retried or deleted.
// If a case here ever exceeds this, that is a genuine slowdown worth investigating.
vi.setConfig({ testTimeout: 20_000 })

installRadixPointerPolyfills()

const mockToastWarning = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    warning: (...args: unknown[]) => mockToastWarning(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const pickFromSelect = async (user: ReturnType<typeof userEvent.setup>, label: RegExp, option: RegExp) => {
  await user.click(screen.getByRole("combobox", { name: label }))
  await user.click(await screen.findByRole("option", { name: option }))
}

const fillTicket = async (user: ReturnType<typeof userEvent.setup>) => {
  await pickFromSelect(user, /Ticket Priority/, /High - Business impacting/)
  await pickFromSelect(user, /Issue Category/, /Shipping Problem/)
  await user.type(screen.getByLabelText("Ticket Title *"), "Order never arrived")
  await user.type(screen.getByLabelText("Detailed Description *"), "The courier marked it delivered.")
}

describe("TicketSubmissionForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockToastWarning.mockClear()
    mockToastSuccess.mockClear()
  })

  it("marks the four required fields and leaves the order number optional", () => {
    render(<TicketSubmissionForm />)

    expect(screen.getByLabelText("Ticket Title *")).toBeInTheDocument()
    expect(screen.getByLabelText("Detailed Description *")).toBeInTheDocument()
    expect(screen.getByLabelText("Order Number (if applicable)")).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: /Ticket Priority/ })).toBeInTheDocument()
  })

  it("refuses to submit without a priority and category", async () => {
    const user = userEvent.setup()
    render(<TicketSubmissionForm />)

    await user.type(screen.getByLabelText("Ticket Title *"), "Order never arrived")
    await user.type(screen.getByLabelText("Detailed Description *"), "The courier marked it delivered.")
    await user.click(screen.getByRole("button", { name: /Submit Ticket/ }))

    expect(mockToastWarning).toHaveBeenCalledWith("Missing details", expect.any(String))
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it("resets every field once the ticket is accepted", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<TicketSubmissionForm />)

    await fillTicket(user)
    await user.click(screen.getByRole("button", { name: /Submit Ticket/ }))

    expect(mockToastSuccess).toHaveBeenCalledWith("Ticket submitted", expect.any(String))
    expect(screen.getByLabelText("Ticket Title *")).toHaveValue("")
    expect(screen.getByLabelText("Detailed Description *")).toHaveValue("")
  })

  // Deferred: no support-ticket backend endpoint exists yet (BACKEND-HANDOFF.md §2, K6).
  // Backend implements the endpoint, then this verifies the ticket is actually POSTed.
  it.todo("submitting a valid ticket POSTs it to the support-ticket endpoint")

  it("toggles the urgent callback request", async () => {
    const user = userEvent.setup()
    render(<TicketSubmissionForm />)

    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).not.toBeChecked()
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  // Deferred: the rich-text toolbar is a dead control for now (product decision: "şimdilik
  // boşverelim"). When wired up, this verifies each button actually formats the description.
  it.todo("clicking a formatting toolbar button applies that formatting to the description")
})
