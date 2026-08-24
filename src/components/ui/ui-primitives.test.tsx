import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@/test/render"
import AsyncSubmitButton from "./AsyncSubmitButton"
import { Collapse, CollapseContent, CollapseTrigger } from "./collapse"
import { HorizontalTimeline } from "./horizontal-timeline"
import Modal from "./Modal"
import QuantityStepper from "./QuantityStepper"

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("QuantityStepper", () => {
  it("shows the value and steps it through the two handlers", async () => {
    const user = userEvent.setup()
    const onDecrease = vi.fn()
    const onIncrease = vi.fn()
    render(<QuantityStepper value={4} onDecrease={onDecrease} onIncrease={onIncrease} />)

    expect(screen.getByText("4")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Increase quantity" }))
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }))

    expect(onIncrease).toHaveBeenCalledTimes(1)
    expect(onDecrease).toHaveBeenCalledTimes(1)
  })

  it("accepts caller-supplied labels for both controls", () => {
    render(
      <QuantityStepper
        value={1}
        onDecrease={vi.fn()}
        onIncrease={vi.fn()}
        decreaseLabel="Remove one box"
        increaseLabel="Add one box"
      />,
    )

    expect(screen.getByRole("button", { name: "Remove one box" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add one box" })).toBeInTheDocument()
  })

  it("fires nothing while disabled", async () => {
    const user = userEvent.setup()
    const onIncrease = vi.fn()
    render(<QuantityStepper value={1} onDecrease={vi.fn()} onIncrease={onIncrease} disabled />)

    await user.click(screen.getByRole("button", { name: "Increase quantity" }))

    expect(onIncrease).not.toHaveBeenCalled()
  })
})

describe("AsyncSubmitButton", () => {
  it("submits with the idle label", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <AsyncSubmitButton idleText="Save changes" isSubmitting={false} />
      </form>,
    )

    await user.click(screen.getByRole("button", { name: "Save changes" }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("locks itself and swaps in the working label while submitting", () => {
    render(<AsyncSubmitButton idleText="Save changes" submittingText="Saving..." isSubmitting />)

    const button = screen.getByRole("button", { name: "Saving..." })
    expect(button).toBeDisabled()
  })

  it("keeps the idle label when no submitting label is supplied", () => {
    render(<AsyncSubmitButton idleText="Save changes" isSubmitting />)

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
  })

  it("stays disabled when the caller disables it", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<AsyncSubmitButton idleText="Save" isSubmitting={false} disabled type="button" onClick={onClick} />)

    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it("hides the trailing icon while submitting", () => {
    const { rerender } = render(
      <AsyncSubmitButton idleText="Save" isSubmitting={false} icon={<span data-testid="icon" />} />,
    )
    expect(screen.getByTestId("icon")).toBeInTheDocument()

    rerender(<AsyncSubmitButton idleText="Save" isSubmitting icon={<span data-testid="icon" />} />)
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument()
  })
})

describe("Modal", () => {
  it("renders nothing while closed", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Details">
        <p>Body copy</p>
      </Modal>,
    )

    expect(screen.queryByText("Body copy")).not.toBeInTheDocument()
  })

  it("exposes an accessible dialog carrying its title", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Details">
        <p>Body copy</p>
      </Modal>,
    )

    expect(screen.getByRole("dialog", { name: "Details" })).toBeInTheDocument()
    expect(screen.getByText("Body copy")).toBeInTheDocument()
  })

  it("closes on Escape by default", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} title="Details">
        <p>Body copy</p>
      </Modal>,
    )

    await user.keyboard("{Escape}")

    expect(onClose).toHaveBeenCalled()
  })

  it("ignores Escape when the caller opts out", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} title="Details" closeOnEscape={false}>
        <p>Body copy</p>
      </Modal>,
    )

    await user.keyboard("{Escape}")

    expect(onClose).not.toHaveBeenCalled()
  })

  it("renders a footer region when one is supplied", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Details" footer={<button type="button">Confirm</button>}>
        <p>Body copy</p>
      </Modal>,
    )

    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument()
  })
})

describe("Collapse", () => {
  it("starts open and wires the trigger to the content", async () => {
    const user = userEvent.setup()
    render(
      <Collapse>
        <CollapseTrigger>Details</CollapseTrigger>
        <CollapseContent>Hidden body</CollapseContent>
      </Collapse>,
    )

    const trigger = screen.getByRole("button", { name: "Details" })
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(document.getElementById(trigger.getAttribute("aria-controls")!)).toHaveAttribute("aria-hidden", "false")

    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("honours defaultOpen=false", () => {
    render(
      <Collapse defaultOpen={false}>
        <CollapseTrigger>Details</CollapseTrigger>
        <CollapseContent>Hidden body</CollapseContent>
      </Collapse>,
    )

    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute("aria-expanded", "false")
  })

  it("reports changes without moving when controlled from outside", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <Collapse open={false} onOpenChange={onOpenChange}>
        <CollapseTrigger>Details</CollapseTrigger>
        <CollapseContent>Hidden body</CollapseContent>
      </Collapse>,
    )

    await user.click(screen.getByRole("button", { name: "Details" }))

    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute("aria-expanded", "false")
  })

  it("lets a trigger's own handler veto the toggle", async () => {
    const user = userEvent.setup()
    render(
      <Collapse>
        <CollapseTrigger onClick={(event) => event.preventDefault()}>Details</CollapseTrigger>
        <CollapseContent>Hidden body</CollapseContent>
      </Collapse>,
    )

    await user.click(screen.getByRole("button", { name: "Details" }))

    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute("aria-expanded", "true")
  })

  it("refuses to render its parts outside a Collapse", () => {
    expect(() => render(<CollapseTrigger>Details</CollapseTrigger>)).toThrow(
      "Collapse components must be used within <Collapse>.",
    )
  })
})

describe("HorizontalTimeline", () => {
  const steps = [
    { label: "Ordered", date: "2026-08-01", state: "done" as const },
    { label: "Shipped", date: "-", state: "active" as const, sublabel: "In transit" },
    { label: "Delivered", date: null, state: "pending" as const },
  ]

  it("renders every step with its label", () => {
    render(<HorizontalTimeline steps={steps} />)

    for (const step of steps) {
      expect(screen.getByText(step.label)).toBeInTheDocument()
    }
  })

  it("shows a real date but hides the placeholder dash", () => {
    render(<HorizontalTimeline steps={steps} />)

    expect(screen.getByText("2026-08-01")).toBeInTheDocument()
    expect(screen.queryByText("-")).not.toBeInTheDocument()
  })

  it("renders the sublabel and any extra content", () => {
    render(<HorizontalTimeline steps={[{ label: "Shipped", state: "error", extra: <span data-testid="extra" /> }]} />)

    expect(screen.getByTestId("extra")).toBeInTheDocument()
  })

  it("renders the same steps in the vertical orientation", () => {
    render(<HorizontalTimeline steps={steps} orientation="vertical" />)

    expect(screen.getByText("In transit")).toBeInTheDocument()
    expect(screen.getByText("Delivered")).toBeInTheDocument()
  })
})
