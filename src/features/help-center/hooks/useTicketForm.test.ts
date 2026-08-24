import { act, renderHook } from "@testing-library/react"
import type { ChangeEvent, FormEvent } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useTicketForm } from "./useTicketForm"

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
  priority: "high",
  category: "billing",
  title: "Charged twice",
  description: "I was charged twice for the same order.",
}

function fillRequiredFields(result: { current: ReturnType<typeof useTicketForm> }) {
  for (const [name, value] of Object.entries(REQUIRED_FIELDS)) {
    act(() => {
      result.current.handleChange(change(name, value))
    })
  }
}

describe("useTicketForm", () => {
  beforeEach(() => {
    mockWarning.mockReset()
    mockSuccess.mockReset()
  })

  it("starts with an empty form", () => {
    const { result } = renderHook(() => useTicketForm())

    expect(result.current.formData).toEqual({
      priority: "",
      category: "",
      orderNumber: "",
      title: "",
      description: "",
      urgentCallback: false,
    })
  })

  it("handleChange stores the boolean checked value for the urgentCallback checkbox", () => {
    const { result } = renderHook(() => useTicketForm())

    act(() => {
      result.current.handleChange(change("urgentCallback", "on", { type: "checkbox", checked: true }))
    })

    expect(result.current.formData.urgentCallback).toBe(true)
  })

  it("rejects submission when a required field is missing", () => {
    const { result } = renderHook(() => useTicketForm())

    act(() => {
      result.current.handleChange(change("priority", "high"))
    })
    act(() => {
      result.current.handleChange(change("category", "billing"))
    })
    // title and description left blank

    act(() => {
      result.current.handleSubmit(submit())
    })

    expect(mockWarning).toHaveBeenCalledWith(
      "Missing details",
      "Please complete all required fields before submitting your ticket.",
    )
    expect(mockSuccess).not.toHaveBeenCalled()
  })

  it("orderNumber is optional and does not block submission", () => {
    const { result } = renderHook(() => useTicketForm())
    fillRequiredFields(result)

    act(() => {
      result.current.handleSubmit(submit())
    })

    expect(mockWarning).not.toHaveBeenCalled()
    expect(mockSuccess).toHaveBeenCalledWith(
      "Ticket submitted",
      "Your request has been received and will be reviewed shortly.",
    )
  })

  it("resets the form to its initial state after a successful submission", () => {
    const { result } = renderHook(() => useTicketForm())
    fillRequiredFields(result)
    act(() => {
      result.current.handleChange(change("orderNumber", "ORD-1"))
    })

    act(() => {
      result.current.handleSubmit(submit())
    })

    expect(result.current.formData).toEqual({
      priority: "",
      category: "",
      orderNumber: "",
      title: "",
      description: "",
      urgentCallback: false,
    })
  })

  it("treats a whitespace-only description as missing", () => {
    const { result } = renderHook(() => useTicketForm())
    fillRequiredFields(result)
    act(() => {
      result.current.handleChange(change("description", "   "))
    })

    act(() => {
      result.current.handleSubmit(submit())
    })

    expect(mockWarning).toHaveBeenCalled()
    expect(mockSuccess).not.toHaveBeenCalled()
  })
})
