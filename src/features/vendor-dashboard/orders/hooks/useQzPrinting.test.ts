import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useQzPrinting } from "./useQzPrinting"

const qzMocks = vi.hoisted(() => ({
  getQzConnectionStatus: vi.fn(),
  printShippingLabel: vi.fn(),
}))
vi.mock("@/lib/qz/printLabel", () => qzMocks)

// A stable reference, reused across renders: `useQzPrinting`'s effect is keyed on this object
// (design §S8 - the QZ connection re-checks only when the labels modal opens, not on mount), so
// a fresh literal on every render - which `renderHook(() => useQzPrinting({...}))` would produce -
// would re-trigger it every render and loop forever, the same way it would if the page passed a
// non-memoized object as `labelModalLinks` on every render.
const LABEL_MODAL_LINKS = { shipping: ["https://labels.example/1.pdf"], tracking: [] }

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useQzPrinting", () => {
  it("selects the first reported printer by default once QZ connects", async () => {
    qzMocks.getQzConnectionStatus.mockResolvedValue({
      status: "connected",
      printers: ["Fake Printer", "Second Printer"],
      message: "",
    })

    const { result } = renderHook(() => useQzPrinting(LABEL_MODAL_LINKS))

    await waitFor(() => expect(result.current.isQzReady).toBe(true))
    expect(result.current.printers).toEqual(["Fake Printer", "Second Printer"])
    expect(result.current.selectedPrinter).toBe("Fake Printer")
  })

  /**
   * Covers the selection -> print wiring at the hook level too, one layer below
   * `VendorOrdersPage.test.tsx`'s "selects a different printer before printing" RTL test.
   */
  it("prints with whichever printer is currently selected, not just the default", async () => {
    qzMocks.getQzConnectionStatus.mockResolvedValue({
      status: "connected",
      printers: ["Fake Printer", "Second Printer"],
      message: "",
    })

    const { result } = renderHook(() => useQzPrinting(LABEL_MODAL_LINKS))
    await waitFor(() => expect(result.current.selectedPrinter).toBe("Fake Printer"))

    act(() => result.current.setSelectedPrinter("Second Printer"))
    expect(result.current.selectedPrinter).toBe("Second Printer")

    act(() => result.current.handlePrintLabel("https://labels.example/1.pdf"))

    expect(qzMocks.printShippingLabel).toHaveBeenCalledWith("https://labels.example/1.pdf", {
      printer: "Second Printer",
      copies: 1,
      colorType: "color",
    })
  })
})
