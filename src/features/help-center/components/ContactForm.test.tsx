import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen } from "@/test/render"
import ContactForm from "./ContactForm"

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

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("First Name *"), "Serhat")
  await user.type(screen.getByLabelText("Last Name *"), "Belen")
  await user.type(screen.getByLabelText("Email Address *"), "serhat@example.com")
  await user.click(screen.getByRole("combobox", { name: /Subject/ }))
  await user.click(await screen.findByRole("option", { name: "Order Issues" }))
  await user.type(screen.getByLabelText("Message *"), "My order never arrived.")
}

describe("ContactForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockToastWarning.mockClear()
    mockToastSuccess.mockClear()
  })

  it("labels every input so it can be reached by its visible label", () => {
    render(<ContactForm />)

    expect(screen.getByLabelText("First Name *")).toBeInTheDocument()
    expect(screen.getByLabelText("Phone Number")).toBeInTheDocument()
    expect(screen.getByLabelText("Practice/Company Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Message *")).toBeInTheDocument()
  })

  it("types the email field so the browser can validate it", () => {
    render(<ContactForm />)

    expect(screen.getByLabelText("Email Address *")).toHaveAttribute("type", "email")
    expect(screen.getByLabelText("Phone Number")).toHaveAttribute("type", "tel")
  })

  it("refuses to send while a required field is blank", async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    await user.type(screen.getByLabelText("First Name *"), "Serhat")
    await user.click(screen.getByRole("button", { name: /Send Message/ }))

    expect(mockToastWarning).toHaveBeenCalledWith("Missing details", expect.any(String))
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it("treats a whitespace-only message as missing", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<ContactForm />)

    await fillRequiredFields(user)
    await user.clear(screen.getByLabelText("Message *"))
    await user.type(screen.getByLabelText("Message *"), "    ")
    await user.click(screen.getByRole("button", { name: /Send Message/ }))

    expect(mockToastWarning).toHaveBeenCalled()
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it("clears the form after a successful submit", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<ContactForm />)

    await fillRequiredFields(user)
    await user.click(screen.getByRole("button", { name: /Send Message/ }))

    expect(mockToastSuccess).toHaveBeenCalledWith("Message sent", expect.any(String))
    expect(screen.getByLabelText("First Name *")).toHaveValue("")
    expect(screen.getByLabelText("Message *")).toHaveValue("")
  })

  it("keeps the newsletter opt-in unchecked by default and toggles it", async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    const checkbox = screen.getByLabelText(/Subscribe to our newsletter/)
    expect(checkbox).not.toBeChecked()
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  // Deferred: no contact-request backend endpoint exists yet (BACKEND-HANDOFF.md §2, K6).
  // Backend implements the endpoint, then this verifies the message is actually POSTed.
  it.todo("submitting a valid contact request POSTs it to the support endpoint")

  // Deferred: file attachments need the same backend endpoint as the rest of the form
  // (BACKEND-HANDOFF.md §2, K6). Once wired up, this verifies "browse" opens a real file picker.
  it.todo("the attachment dropzone lets the user pick and attach a file")
})
