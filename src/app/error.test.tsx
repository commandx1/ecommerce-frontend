import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import RootError from "./error"

// The app shipped with no error boundary at all, so a throw in any Server Component left the
// visitor with header + footer and an empty content region. These lock in what replaced that.
describe("RootError", () => {
  it("carries exactly one h1, so the app-wide heading contract survives a failure", () => {
    render(<RootError error={new Error("boom")} reset={vi.fn()} />)

    const h1s = screen.getAllByRole("heading", { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent("Something went wrong")
  })

  it("offers a way out: retry and a link home", async () => {
    const user = userEvent.setup()
    const reset = vi.fn()
    render(<RootError error={new Error("boom")} reset={reset} />)

    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(reset).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/")
  })

  it("surfaces the digest when there is one - it is the only handle on the server stack", () => {
    render(<RootError error={Object.assign(new Error("boom"), { digest: "abc123" })} reset={vi.fn()} />)

    expect(screen.getByText(/abc123/)).toBeInTheDocument()
  })

  it("does not invent a reference when the error has no digest", () => {
    render(<RootError error={new Error("boom")} reset={vi.fn()} />)

    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument()
  })

  it("never renders the raw message, which can leak internals to the visitor", () => {
    render(<RootError error={new Error("connect ECONNREFUSED 127.0.0.1:4010")} reset={vi.fn()} />)

    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument()
  })
})
