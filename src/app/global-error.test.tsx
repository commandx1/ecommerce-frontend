import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import GlobalError from "./global-error"

// GlobalError only mounts when something throws above (or inside) the root layout - the one
// failure app/error.tsx cannot catch. It has to render its own <html>/<body> and none of the
// root layout's providers (ThemeProvider, QueryProvider, ...) are available at that point, so
// this is rendered with plain RTL `render`, not the app's provider-wrapping `@/test/render`.
describe("GlobalError", () => {
  it("carries exactly one h1, matching the root boundary's heading contract", () => {
    render(<GlobalError error={new Error("boom")} reset={vi.fn()} />)

    const h1s = screen.getAllByRole("heading", { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent("Something went wrong")
  })

  it("offers a way out: retry and a link home", async () => {
    const user = userEvent.setup()
    const reset = vi.fn()
    render(<GlobalError error={new Error("boom")} reset={reset} />)

    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(reset).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/")
  })

  it("surfaces the digest when there is one - it is the only handle on the server stack", () => {
    render(<GlobalError error={Object.assign(new Error("boom"), { digest: "abc123" })} reset={vi.fn()} />)

    expect(screen.getByText(/abc123/)).toBeInTheDocument()
  })

  it("never renders the raw message, which can leak internals to the visitor", () => {
    render(<GlobalError error={new Error("connect ECONNREFUSED 127.0.0.1:4010")} reset={vi.fn()} />)

    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument()
  })
})
