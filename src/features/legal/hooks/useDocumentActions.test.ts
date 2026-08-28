import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDocumentActions } from "./useDocumentActions"

const mockInfo = vi.fn()

vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    info: (...args: unknown[]) => mockInfo(...args),
  },
}))

describe("useDocumentActions", () => {
  beforeEach(() => {
    mockInfo.mockReset()
    vi.spyOn(window, "print").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("handlePrint calls window.print()", () => {
    const { result } = renderHook(() => useDocumentActions())

    act(() => {
      result.current.handlePrint()
    })

    expect(window.print).toHaveBeenCalledTimes(1)
  })

  // Deferred: PDF export is a dead control for now (product decision: "şimdilik boşverelim").
  // When wired up, this verifies handleDownload actually produces/saves a PDF file.
  it.todo("handleDownload downloads a PDF file of the document")

  it("both actions are independent and can be triggered repeatedly", () => {
    const { result } = renderHook(() => useDocumentActions())

    act(() => {
      result.current.handleDownload()
      result.current.handleDownload()
      result.current.handlePrint()
    })

    expect(mockInfo).toHaveBeenCalledTimes(2)
    expect(window.print).toHaveBeenCalledTimes(1)
  })
})
