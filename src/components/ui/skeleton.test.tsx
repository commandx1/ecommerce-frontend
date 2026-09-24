import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Skeleton } from "./skeleton"

// The `data-slot` hook is the contract call sites and tests bind to. Asserting on the animation
// class instead is what broke eight suites when this primitive moved from pulse to shimmer.
describe("Skeleton", () => {
  it("exposes a data-slot hook so tests never bind to the animation class", () => {
    const { container } = render(<Skeleton />)
    expect((container.firstElementChild as HTMLElement).dataset.slot).toBe("skeleton")
  })

  it("merges className over the defaults", () => {
    const { container } = render(<Skeleton className="h-4 w-24 bg-(--glass-tile)" />)
    const el = container.firstElementChild
    expect(el).toHaveClass("h-4", "w-24", "skeleton-shimmer", "relative", "overflow-hidden")
    // tailwind-merge drops the default fill when a caller supplies its own.
    expect(el).not.toHaveClass("bg-skeleton-base")
  })

  it("clips the sweeping band so it cannot bleed past the placeholder", () => {
    const { container } = render(<Skeleton />)
    expect(container.firstElementChild).toHaveClass("relative", "overflow-hidden")
  })

  it("forwards arbitrary div props, which the aria-hidden call sites depend on", () => {
    render(<Skeleton aria-hidden="true" data-testid="bar" style={{ width: 40 }} />)
    const el = screen.getByTestId("bar")
    expect(el).toHaveAttribute("aria-hidden", "true")
    expect(el).toHaveStyle({ width: "40px" })
  })

  it("renders no text, so it never leaks into accessible names", () => {
    const { container } = render(<Skeleton />)
    expect(container.firstElementChild?.textContent).toBe("")
  })
})
