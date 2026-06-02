import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import TrackingLinksModal from "./tracking-links-modal"

const mockUseBuyerOrdersTrackingModalState = vi.fn()
const mockUseBuyerOrdersTrackingModalActions = vi.fn()

vi.mock("../context/buyer-orders-context", () => ({
  useBuyerOrdersTrackingModalState: () => mockUseBuyerOrdersTrackingModalState(),
  useBuyerOrdersTrackingModalActions: () => mockUseBuyerOrdersTrackingModalActions(),
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

function createStateValue(overrides?: Partial<ReturnType<typeof mockUseBuyerOrdersTrackingModalState>>) {
  return {
    trackingModalLinks: null,
    ...overrides,
  }
}

beforeEach(() => {
  mockUseBuyerOrdersTrackingModalState.mockReset()
  mockUseBuyerOrdersTrackingModalActions.mockReset()
})

describe("TrackingLinksModal", () => {
  it("does not render when links are null", () => {
    mockUseBuyerOrdersTrackingModalState.mockReturnValue(createStateValue({ trackingModalLinks: null }))
    mockUseBuyerOrdersTrackingModalActions.mockReturnValue({ setTrackingModalLinks: vi.fn() })

    render(<TrackingLinksModal />)
    expect(screen.queryByText("Tracking links")).not.toBeInTheDocument()
  })

  it("renders tracking links and calls close action from close controls", async () => {
    const user = userEvent.setup()
    const setTrackingModalLinks = vi.fn()
    mockUseBuyerOrdersTrackingModalState.mockReturnValue(
      createStateValue({
        trackingModalLinks: [
          {
            trackingUrl: "https://carrier.example/track/12345678901234567890123456789012345678901234567890",
            status: "IN_TRANSIT",
            updatedDate: "2026-05-20T11:00:00Z",
          },
          {
            trackingUrl: "https://carrier.example/track/short",
          },
        ],
      }),
    )
    mockUseBuyerOrdersTrackingModalActions.mockReturnValue({ setTrackingModalLinks })

    render(<TrackingLinksModal />)

    expect(screen.getByText("Tracking links (2)")).toBeInTheDocument()
    expect(screen.getByText("Link 1")).toBeInTheDocument()
    expect(screen.getByText(/IN_TRANSIT/)).toBeInTheDocument()
    expect(screen.getByText("https://carrier.example/track/12345678901234567890...")).toBeInTheDocument()

    const openButtons = screen.getAllByRole("link", { name: /Open/i })
    expect(openButtons).toHaveLength(2)
    expect(openButtons[0]).toHaveAttribute("href", expect.stringContaining("https://carrier.example/track/"))
    expect(screen.queryByRole("link", { name: /Download/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Close" }))
    await user.click(screen.getByRole("button", { name: "Close tracking modal" }))
    expect(setTrackingModalLinks).toHaveBeenNthCalledWith(1, null)
    expect(setTrackingModalLinks).toHaveBeenNthCalledWith(2, null)
  })

  it("calls close action when overlay is clicked", async () => {
    const user = userEvent.setup()
    const setTrackingModalLinks = vi.fn()
    mockUseBuyerOrdersTrackingModalState.mockReturnValue(
      createStateValue({
        trackingModalLinks: [{ trackingUrl: "https://carrier.example/track/short" }],
      }),
    )
    mockUseBuyerOrdersTrackingModalActions.mockReturnValue({ setTrackingModalLinks })

    render(<TrackingLinksModal />)

    const overlay = document.querySelector('[data-slot="dialog-overlay"]')
    expect(overlay).not.toBeNull()

    await user.click(overlay as HTMLElement)
    await waitFor(() => {
      expect(setTrackingModalLinks).toHaveBeenCalledWith(null)
    })
  })

  it("calls close action when Escape is pressed", async () => {
    const user = userEvent.setup()
    const setTrackingModalLinks = vi.fn()
    mockUseBuyerOrdersTrackingModalState.mockReturnValue(
      createStateValue({
        trackingModalLinks: [{ trackingUrl: "https://carrier.example/track/short" }],
      }),
    )
    mockUseBuyerOrdersTrackingModalActions.mockReturnValue({ setTrackingModalLinks })

    render(<TrackingLinksModal />)

    await user.keyboard("{Escape}")
    await waitFor(() => {
      expect(setTrackingModalLinks).toHaveBeenCalledWith(null)
    })
  })

  it("updates rendered content when links value changes", () => {
    const setTrackingModalLinks = vi.fn()

    mockUseBuyerOrdersTrackingModalState.mockReturnValue(
      createStateValue({
        trackingModalLinks: [{ trackingUrl: "https://carrier.example/track/old", status: "OLD_STATUS" }],
      }),
    )
    mockUseBuyerOrdersTrackingModalActions.mockReturnValue({ setTrackingModalLinks })

    const { rerender } = render(<TrackingLinksModal />)

    expect(screen.getByText("Tracking links (1)")).toBeInTheDocument()
    expect(screen.getByText(/OLD_STATUS/)).toBeInTheDocument()
    expect(screen.getByText("https://carrier.example/track/old")).toBeInTheDocument()

    mockUseBuyerOrdersTrackingModalState.mockReturnValue(
      createStateValue({
        trackingModalLinks: [
          { trackingUrl: "https://carrier.example/track/new-1", status: "NEW_STATUS" },
          { trackingUrl: "https://carrier.example/track/new-2" },
        ],
      }),
    )

    rerender(<TrackingLinksModal />)

    expect(screen.getByText("Tracking links (2)")).toBeInTheDocument()
    expect(screen.getByText(/NEW_STATUS/)).toBeInTheDocument()
    expect(screen.getByText("https://carrier.example/track/new-1")).toBeInTheDocument()
    expect(screen.queryByText(/OLD_STATUS/)).not.toBeInTheDocument()
    expect(screen.queryByText("https://carrier.example/track/old")).not.toBeInTheDocument()
  })

  it("renders a custom title when links are opened as shipping labels", () => {
    mockUseBuyerOrdersTrackingModalState.mockReturnValue(
      createStateValue({
        trackingModalLinks: {
          title: "Shipping labels",
          links: [{ trackingUrl: "https://carrier.example/label.pdf" }],
        },
      }),
    )
    mockUseBuyerOrdersTrackingModalActions.mockReturnValue({ setTrackingModalLinks: vi.fn() })

    render(<TrackingLinksModal />)

    expect(screen.getByText("Shipping labels (1)")).toBeInTheDocument()
    const downloadLink = screen.getByRole("link", { name: /Download/i })
    expect(downloadLink).toHaveAttribute("download", "shipping-label-1.pdf")
    expect(downloadLink).toHaveAttribute(
      "href",
      `/api/shipping-label/download?filename=shipping-label-1.pdf&url=${encodeURIComponent("https://carrier.example/label.pdf")}`,
    )
    expect(screen.getByRole("link", { name: /Open/i })).toHaveAttribute("href", "https://carrier.example/label.pdf")
  })

  it("keeps focus inside modal when tabbing and exposes accessible close button", async () => {
    const user = userEvent.setup()
    mockUseBuyerOrdersTrackingModalState.mockReturnValue(
      createStateValue({
        trackingModalLinks: [
          { trackingUrl: "https://carrier.example/track/a11y-1" },
          { trackingUrl: "https://carrier.example/track/a11y-2" },
        ],
      }),
    )
    mockUseBuyerOrdersTrackingModalActions.mockReturnValue({ setTrackingModalLinks: vi.fn() })

    render(<TrackingLinksModal />)

    const dialog = screen.getByRole("dialog")
    const iconCloseButton = screen.getByRole("button", { name: "Close tracking modal" })

    expect(iconCloseButton).toBeInTheDocument()
    iconCloseButton.focus()
    expect(dialog.contains(document.activeElement)).toBe(true)

    await user.tab()
    expect(dialog.contains(document.activeElement)).toBe(true)

    await user.tab()
    expect(dialog.contains(document.activeElement)).toBe(true)
  })
})
