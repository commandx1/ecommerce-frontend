import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen } from "@/test/render"
import ContactForm from "./ContactForm"

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

  /**
   * BULGU (TEST-FINDINGS K6): `useContactForm` performs no network call at all — a completed
   * support request is validated, toasted as "Message sent" and then thrown away. This test
   * locks that behaviour: no request leaves the page. MSW is configured with
   * `onUnhandledRequest: "error"`, so any future fetch would fail this suite loudly.
   */
  it("sends the message nowhere — no request is made (current behaviour)", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    render(<ContactForm />)

    await fillRequiredFields(user)
    await user.click(screen.getByRole("button", { name: /Send Message/ }))

    expect(mockToastSuccess).toHaveBeenCalledWith("Message sent", expect.any(String))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  // The attachment dropzone is decorative: there is no file input behind "browse".
  it("offers an attachment dropzone with no file input behind it (current behaviour)", () => {
    render(<ContactForm />)

    expect(screen.getByRole("button", { name: "browse" })).toBeInTheDocument()
    expect(document.querySelector('input[type="file"]')).toBeNull()
  })
})
