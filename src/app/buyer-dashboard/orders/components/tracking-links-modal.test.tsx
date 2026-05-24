import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import TrackingLinksModal from "./tracking-links-modal"

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe("TrackingLinksModal", () => {
  it("does not render when links are null", () => {
    render(<TrackingLinksModal links={null} onClose={vi.fn()} />)
    expect(screen.queryByText("Tracking links")).not.toBeInTheDocument()
  })

  it("renders tracking links and calls onClose from close controls", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <TrackingLinksModal
        onClose={onClose}
        links={[
          {
            trackingUrl: "https://carrier.example/track/12345678901234567890123456789012345678901234567890",
            status: "IN_TRANSIT",
            updatedDate: "2026-05-20T11:00:00Z",
          },
          {
            trackingUrl: "https://carrier.example/track/short",
          },
        ]}
      />,
    )

    expect(screen.getByText("Tracking links (2)")).toBeInTheDocument()
    expect(screen.getByText("Link 1")).toBeInTheDocument()
    expect(screen.getByText(/IN_TRANSIT/)).toBeInTheDocument()
    expect(screen.getByText("https://carrier.example/track/12345678901234567890...")).toBeInTheDocument()

    const openButtons = screen.getAllByRole("link", { name: /Open/i })
    expect(openButtons).toHaveLength(2)
    expect(openButtons[0]).toHaveAttribute("href", expect.stringContaining("https://carrier.example/track/"))

    await user.click(screen.getByRole("button", { name: "Close" }))
    await user.click(screen.getByRole("button", { name: "Close tracking modal" }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
