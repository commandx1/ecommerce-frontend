import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import Skeleton from "./skeleton"

describe("Skeleton", () => {
  it("renders a pulse placeholder and merges className", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />)
    const el = container.firstElementChild
    expect(el).toHaveClass("animate-pulse", "bg-surface-muted", "h-4", "w-24")
    expect(el?.textContent).toBe("")
  })
})
