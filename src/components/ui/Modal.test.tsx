import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import Modal, { ModalTitle } from "./Modal"

describe("Modal", () => {
  it("default behaviour: renders a visually hidden DialogTitle from `title` and shows the body", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Confirm cancellation">
        <p>Body content</p>
      </Modal>,
    )

    const heading = screen.getByRole("heading", { name: "Confirm cancellation" })
    expect(heading).toHaveClass("sr-only")
    expect(screen.getByText("Body content")).toBeInTheDocument()
  })

  it("default behaviour: falls back to the default title when none is given, unchanged from before", () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <p>Body content</p>
      </Modal>,
    )

    expect(screen.getByRole("heading", { name: "Dialog" })).toBeInTheDocument()
  })

  it("default behaviour: is not rendered at all while closed", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Hidden">
        <p>Body content</p>
      </Modal>,
    )

    expect(screen.queryByText("Body content")).not.toBeInTheDocument()
  })

  it("default behaviour: Escape still calls onClose", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} title="Confirm">
        <p>Body content</p>
      </Modal>,
    )

    await user.keyboard("{Escape}")
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("customTitle: skips Modal's own hidden title and renders exactly one heading from the caller's markup", () => {
    render(
      <Modal isOpen onClose={vi.fn()} customTitle>
        <div className="flex items-center justify-between">
          <ModalTitle asChild>
            <h2 className="text-lg font-semibold text-brand">Labels &amp; tracking</h2>
          </ModalTitle>
        </div>
      </Modal>,
    )

    expect(screen.getAllByRole("heading")).toHaveLength(1)
    const heading = screen.getByRole("heading", { name: "Labels & tracking" })
    expect(heading.tagName).toBe("H2")
    expect(heading).not.toHaveClass("sr-only")
    expect(heading).toHaveClass("text-lg", "font-semibold", "text-brand")
  })

  it("customTitle: the caller's own close control still closes the dialog", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} customTitle>
        <div>
          <ModalTitle asChild>
            <h2>Uber Delivery Result</h2>
          </ModalTitle>
          <button type="button" aria-label="Close Uber delivery result" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>,
    )

    await user.click(screen.getByRole("button", { name: "Close Uber delivery result" }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("default behaviour: traps focus (Radix locks pointer events on the rest of the page), unchanged from before", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Confirm">
        <p>Body content</p>
      </Modal>,
    )

    expect(document.body.style.pointerEvents).toBe("none")
  })

  it("trapFocus=false: does not lock pointer events on the rest of the page, for dialogs hosting a nested Radix popover (e.g. a Select)", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Confirm" trapFocus={false}>
        <p>Body content</p>
      </Modal>,
    )

    expect(document.body.style.pointerEvents).not.toBe("none")
  })
})
