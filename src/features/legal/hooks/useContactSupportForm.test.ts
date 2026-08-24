import { act, renderHook } from "@testing-library/react"
import type { ChangeEvent, FormEvent } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useContactSupportForm } from "./useContactSupportForm"

const mockWarning = vi.fn()
const mockSuccess = vi.fn()

vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    warning: (...args: unknown[]) => mockWarning(...args),
    success: (...args: unknown[]) => mockSuccess(...args),
  },
}))

const change = (name: string, value: string) =>
  ({ target: { name, value } }) as ChangeEvent<HTMLInputElement | HTMLTextAreaElement>

const submit = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement>

describe("useContactSupportForm", () => {
  beforeEach(() => {
    mockWarning.mockReset()
    mockSuccess.mockReset()
  })

  it("starts with an empty form", () => {
    const { result } = renderHook(() => useContactSupportForm())

    expect(result.current.formData).toEqual({
      firstName: "",
      lastName: "",
      email: "",
      topic: "",
      message: "",
    })
  })

  it("handleChange updates a field by name", () => {
    const { result } = renderHook(() => useContactSupportForm())

    act(() => {
      result.current.handleChange(change("email", "buyer@example.com"))
    })

    expect(result.current.formData.email).toBe("buyer@example.com")
  })

  it("handleTopicChange sets the topic outside of a native change event (e.g. a custom select)", () => {
    const { result } = renderHook(() => useContactSupportForm())

    act(() => {
      result.current.handleTopicChange("billing")
    })

    expect(result.current.formData.topic).toBe("billing")
  })

  it("firstName and lastName are optional - email, topic and message are required", () => {
    const { result } = renderHook(() => useContactSupportForm())

    act(() => {
      result.current.handleChange(change("email", "buyer@example.com"))
    })
    act(() => {
      result.current.handleTopicChange("billing")
    })
    act(() => {
      result.current.handleChange(change("message", "I need help with an invoice."))
    })

    act(() => {
      result.current.handleSubmit(submit())
    })

    expect(mockWarning).not.toHaveBeenCalled()
    expect(mockSuccess).toHaveBeenCalledWith("Request received", "Our legal team will contact you shortly.")
  })

  it("rejects submission when email, topic or message is missing", () => {
    const { result } = renderHook(() => useContactSupportForm())

    act(() => {
      result.current.handleChange(change("email", "buyer@example.com"))
    })
    // topic and message left blank

    act(() => {
      result.current.handleSubmit(submit())
    })

    expect(mockWarning).toHaveBeenCalledWith(
      "Missing details",
      "Please complete the required fields before submitting.",
    )
    expect(mockSuccess).not.toHaveBeenCalled()
  })

  it("resets the form after a successful submission", () => {
    const { result } = renderHook(() => useContactSupportForm())

    act(() => {
      result.current.handleChange(change("firstName", "Jane"))
    })
    act(() => {
      result.current.handleChange(change("email", "buyer@example.com"))
    })
    act(() => {
      result.current.handleTopicChange("billing")
    })
    act(() => {
      result.current.handleChange(change("message", "I need help with an invoice."))
    })

    act(() => {
      result.current.handleSubmit(submit())
    })

    expect(result.current.formData).toEqual({
      firstName: "",
      lastName: "",
      email: "",
      topic: "",
      message: "",
    })
  })
})
