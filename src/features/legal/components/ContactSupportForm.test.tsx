import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen } from "@/test/render"
import ContactSupportForm from "./ContactSupportForm"

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

const submit = () => screen.getByRole("button", { name: "Submit Request" })

const fillRequired = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Email Address"), "serhat@example.com")
  await user.click(screen.getByRole("combobox", { name: "Legal Topic" }))
  await user.click((await screen.findAllByRole("option"))[0])
  await user.type(screen.getByLabelText("Message"), "Question about the DPA.")
}

describe("ContactSupportForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockToastWarning.mockClear()
    mockToastSuccess.mockClear()
  })

  it("binds every label to its control", () => {
    render(<ContactSupportForm />)

    expect(screen.getByLabelText("First Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Email Address")).toHaveAttribute("type", "email")
    expect(screen.getByLabelText("Message")).toBeInTheDocument()
  })

  it("starts with no topic selected and shows the placeholder", () => {
    render(<ContactSupportForm />)

    expect(screen.getByRole("combobox", { name: "Legal Topic" })).toHaveTextContent("Select a topic")
  })

  it("refuses to submit without email, topic and message", async () => {
    const user = userEvent.setup()
    render(<ContactSupportForm />)

    await user.type(screen.getByLabelText("First Name"), "Serhat")
    await user.click(submit())

    expect(mockToastWarning).toHaveBeenCalledWith("Missing details", expect.any(String))
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it("treats a whitespace-only message as missing", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<ContactSupportForm />)

    await fillRequired(user)
    await user.clear(screen.getByLabelText("Message"))
    await user.type(screen.getByLabelText("Message"), "   ")
    await user.click(submit())

    expect(mockToastWarning).toHaveBeenCalled()
  })

  it("clears the form after a valid request", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<ContactSupportForm />)

    await fillRequired(user)
    await user.click(submit())

    expect(mockToastSuccess).toHaveBeenCalledWith("Request received", expect.any(String))
    expect(screen.getByLabelText("Email Address")).toHaveValue("")
    expect(screen.getByLabelText("Message")).toHaveValue("")
    expect(screen.getByRole("combobox", { name: "Legal Topic" })).toHaveTextContent("Select a topic")
  })

  /**
   * BULGU (TEST-FINDINGS K6): `useContactSupportForm` contacts nothing. The visitor is told
   * "Our legal team will contact you shortly" while the request is discarded.
   */
  it("submits the consultation request nowhere (current behaviour)", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    render(<ContactSupportForm />)

    await fillRequired(user)
    await user.click(submit())

    expect(mockToastSuccess).toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
