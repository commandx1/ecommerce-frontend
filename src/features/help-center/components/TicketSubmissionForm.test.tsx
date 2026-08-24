import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen } from "@/test/render"
import TicketSubmissionForm from "./TicketSubmissionForm"

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

  /**
   * BULGU (TEST-FINDINGS K6): `useTicketForm` never contacts the backend. The buyer is told
   * "Your request has been received", but nothing was sent. Locking today's behaviour.
   */
  it("submits the ticket nowhere — no request is made (current behaviour)", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    render(<TicketSubmissionForm />)

    await fillTicket(user)
    await user.click(screen.getByRole("button", { name: /Submit Ticket/ }))

    expect(mockToastSuccess).toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("toggles the urgent callback request", async () => {
    const user = userEvent.setup()
    render(<TicketSubmissionForm />)

    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).not.toBeChecked()
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  // The rich-text toolbar above the description renders buttons with no handlers.
  it("renders an inert formatting toolbar above the description (current behaviour)", () => {
    render(<TicketSubmissionForm />)

    const description = screen.getByLabelText("Detailed Description *")
    const toolbar = description.closest("div")!.parentElement!
    expect(toolbar.querySelectorAll("button").length).toBeGreaterThanOrEqual(4)
  })
})
