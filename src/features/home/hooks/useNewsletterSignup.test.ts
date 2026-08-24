import { act, renderHook } from "@testing-library/react"
import type { ChangeEvent, FormEvent } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useNewsletterSignup } from "./useNewsletterSignup"

const mockWarning = vi.fn()
const mockSuccess = vi.fn()

vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    warning: (...args: unknown[]) => mockWarning(...args),
    success: (...args: unknown[]) => mockSuccess(...args),
  },
}))

const changeEvent = (value: string) => ({ target: { value } }) as ChangeEvent<HTMLInputElement>
const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement>

describe("useNewsletterSignup", () => {
  beforeEach(() => {
    mockWarning.mockReset()
    mockSuccess.mockReset()
  })

  it("starts with an empty, non-submitting state", () => {
    const { result } = renderHook(() => useNewsletterSignup())

    expect(result.current.email).toBe("")
    expect(result.current.isSubmitting).toBe(false)
  })

  it("handleChange updates the email field", () => {
    const { result } = renderHook(() => useNewsletterSignup())

    act(() => {
      result.current.handleChange(changeEvent("buyer@example.com"))
    })

    expect(result.current.email).toBe("buyer@example.com")
  })

  it("rejects submission of an empty email with a warning toast and does not mark submitting", async () => {
    const { result } = renderHook(() => useNewsletterSignup())

    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(mockWarning).toHaveBeenCalledWith("Email required", "Please enter your email address.")
    expect(mockSuccess).not.toHaveBeenCalled()
    expect(result.current.isSubmitting).toBe(false)
  })

  it("submits a non-empty email, shows a success toast, and clears the field", async () => {
    const { result } = renderHook(() => useNewsletterSignup())

    act(() => {
      result.current.handleChange(changeEvent("buyer@example.com"))
    })

    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(mockSuccess).toHaveBeenCalledWith("Subscription confirmed", "You are now subscribed to the newsletter.")
    expect(result.current.email).toBe("")
    expect(result.current.isSubmitting).toBe(false)
  })

  it("preventDefault is called on submit so the page never reloads", async () => {
    const { result } = renderHook(() => useNewsletterSignup())
    const event = submitEvent()

    act(() => {
      result.current.handleChange(changeEvent("buyer@example.com"))
    })
    await act(async () => {
      await result.current.handleSubmit(event)
    })

    expect(event.preventDefault).toHaveBeenCalled()
  })

  it("supports resubmitting after a successful submission clears the form", async () => {
    const { result } = renderHook(() => useNewsletterSignup())

    act(() => {
      result.current.handleChange(changeEvent("first@example.com"))
    })
    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })
    expect(result.current.email).toBe("")

    act(() => {
      result.current.handleChange(changeEvent("second@example.com"))
    })
    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(mockSuccess).toHaveBeenCalledTimes(2)
    expect(result.current.email).toBe("")
  })
})
