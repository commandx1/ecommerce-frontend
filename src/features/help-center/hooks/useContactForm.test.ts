import { act, renderHook } from "@testing-library/react"
import type { ChangeEvent, FormEvent } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useContactForm } from "./useContactForm"

const mockWarning = vi.fn()
const mockSuccess = vi.fn()

vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    warning: (...args: unknown[]) => mockWarning(...args),
    success: (...args: unknown[]) => mockSuccess(...args),
  },
}))

const change = (name: string, value: string, extra: Partial<HTMLInputElement> = {}) =>
  ({ target: { name, value, type: "text", checked: false, ...extra } }) as ChangeEvent<HTMLInputElement>

const submit = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement>

const REQUIRED_FIELDS = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  subject: "Order question",
  message: "Where is my order?",
}

function fillRequiredFields(result: { current: ReturnType<typeof useContactForm> }) {
  for (const [name, value] of Object.entries(REQUIRED_FIELDS)) {
    act(() => {
      result.current.handleChange(change(name, value))
    })
  }
}

describe("useContactForm", () => {
  beforeEach(() => {
    mockWarning.mockReset()
    mockSuccess.mockReset()
  })

  it("starts with an empty form", () => {
    const { result } = renderHook(() => useContactForm())

    expect(result.current.formData).toEqual({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      subject: "",
      message: "",
      subscribe: false,
    })
  })

  it("handleChange updates a text field by name", () => {
    const { result } = renderHook(() => useContactForm())

    act(() => {
      result.current.handleChange(change("email", "jane@example.com"))
    })

    expect(result.current.formData.email).toBe("jane@example.com")
  })

  it("handleChange stores the boolean checked value for checkbox inputs", () => {
    const { result } = renderHook(() => useContactForm())

    act(() => {
      result.current.handleChange(change("subscribe", "on", { type: "checkbox", checked: true }))
    })

    expect(result.current.formData.subscribe).toBe(true)
  })

  it("rejects submission when a required field is blank or whitespace-only, without resetting the form", () => {
    const { result } = renderHook(() => useContactForm())
    fillRequiredFields(result)

    act(() => {
      result.current.handleChange(change("subject", "   "))
    })

    act(() => {
      result.current.handleSubmit(submit())
    })

    expect(mockWarning).toHaveBeenCalledWith(
      "Missing details",
      "Please complete all required fields before sending your message.",
    )
    expect(mockSuccess).not.toHaveBeenCalled()
    expect(result.current.formData.subject).toBe("   ")
  })

  it("submits successfully once every required field is filled and resets the form", () => {
    const { result } = renderHook(() => useContactForm())
    fillRequiredFields(result)

    act(() => {
      result.current.handleSubmit(submit())
    })

    expect(mockSuccess).toHaveBeenCalledWith(
      "Message sent",
      "Our support team will reach out within 2 hours during business hours.",
    )
    expect(result.current.formData).toEqual({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      subject: "",
      message: "",
      subscribe: false,
    })
  })

  it("optional fields (phone, company) are not required for submission", () => {
    const { result } = renderHook(() => useContactForm())
    fillRequiredFields(result)

    act(() => {
      result.current.handleSubmit(submit())
    })

    expect(mockWarning).not.toHaveBeenCalled()
    expect(mockSuccess).toHaveBeenCalledTimes(1)
  })

  it("calls preventDefault on submit", () => {
    const { result } = renderHook(() => useContactForm())
    fillRequiredFields(result)
    const event = submit()

    act(() => {
      result.current.handleSubmit(event)
    })

    expect(event.preventDefault).toHaveBeenCalled()
  })
})
