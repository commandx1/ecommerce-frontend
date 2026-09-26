import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/render"
import DashboardContentSkeleton from "./DashboardContentSkeleton"

// Shared content-only fallback for both dashboard-root loading.tsx files. Neutral by design - a
// dashboard-root loading.tsx is the fallback for every nested route under it, so there is no one
// real page shape to mirror. Same a11y contract as src/app/categories/loading.test.tsx.
describe("DashboardContentSkeleton", () => {
  it("carries exactly one h1, taken from the label prop", () => {
    render(<DashboardContentSkeleton label="Loading Buyer Dashboard Content" />)

    const h1s = screen.getAllByRole("heading", { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent("Loading Buyer Dashboard Content")
  })

  it("marks the placeholder region as busy so assistive tech is not left guessing", () => {
    const { container } = render(<DashboardContentSkeleton label="Loading" />)

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })

  it("renders skeleton blocks through the shared primitive, not ad-hoc markup", () => {
    const { container } = render(<DashboardContentSkeleton label="Loading" />)

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it("does not render the dashboard header or sidebar chrome - the layout already owns those", () => {
    const { container } = render(<DashboardContentSkeleton label="Loading" />)

    expect(container.querySelector("header")).not.toBeInTheDocument()
    expect(container.querySelector("aside")).not.toBeInTheDocument()
  })
})
