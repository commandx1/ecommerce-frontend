import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen } from "@/test/render"
import { CheckboxField } from "./CheckboxField"
import { FormField } from "./FormField"
import { PasswordField } from "./PasswordField"
import { RadioField } from "./RadioField"
import { SelectField } from "./SelectField"
import { TextAreaField } from "./TextAreaField"
import { TextField } from "./TextField"

installRadixPointerPolyfills()

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("FormField", () => {
  it("binds its label to the control it wraps", () => {
    render(
      <FormField label="Email" htmlFor="email-input">
        <input id="email-input" />
      </FormField>,
    )

    expect(screen.getByLabelText("Email")).toBe(document.getElementById("email-input"))
  })

  it("appends an asterisk to the label of a required field", () => {
    render(
      <FormField label="Email" htmlFor="email-input" required>
        <input id="email-input" />
      </FormField>,
    )

    expect(screen.getByLabelText("Email *")).toBeInTheDocument()
  })

  it("renders the error message underneath the control", () => {
    render(
      <FormField label="Email" htmlFor="email-input" error="Email is required">
        <input id="email-input" />
      </FormField>,
    )

    expect(screen.getByText("Email is required")).toBeInTheDocument()
  })

  /**
   * BULGU: the error paragraph carries no id and the control gets no `aria-describedby`, so a
   * screen reader announces the field as invalid without ever reading why. Locking today's
   * behaviour so a future fix is a deliberate change.
   */
  it("does not wire the error to the control via aria-describedby (current behaviour)", () => {
    render(<TextField id="email" label="Email" error="Email is required" />)

    const input = screen.getByLabelText("Email")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).not.toHaveAttribute("aria-describedby")
  })
})

describe("TextField", () => {
  it("is reachable and typable by its label", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TextField id="name" label="First Name" onChange={onChange} />)

    await user.type(screen.getByLabelText("First Name"), "Serhat")

    expect(onChange).toHaveBeenCalled()
    expect(screen.getByLabelText("First Name")).toHaveValue("Serhat")
  })

  it("marks itself invalid only when an error is present", () => {
    render(<TextField id="name" label="First Name" />)

    expect(screen.getByLabelText("First Name")).not.toHaveAttribute("aria-invalid", "true")
  })

  it("refuses input while disabled", async () => {
    const user = userEvent.setup()
    render(<TextField id="name" label="First Name" disabled />)

    await user.type(screen.getByLabelText("First Name"), "Serhat")

    expect(screen.getByLabelText("First Name")).toBeDisabled()
    expect(screen.getByLabelText("First Name")).toHaveValue("")
  })
})

describe("PasswordField", () => {
  it("masks the value until the reveal control is used", async () => {
    const user = userEvent.setup()
    render(<PasswordField id="pw" label="Password" />)

    const input = screen.getByLabelText("Password")
    expect(input).toHaveAttribute("type", "password")

    await user.click(screen.getByRole("button", { name: "Show password" }))
    expect(input).toHaveAttribute("type", "text")

    await user.click(screen.getByRole("button", { name: "Hide password" }))
    expect(input).toHaveAttribute("type", "password")
  })

  it("marks itself invalid and shows the error", () => {
    render(<PasswordField id="pw" label="Password" error="Too short" />)

    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByText("Too short")).toBeInTheDocument()
  })
})

describe("TextAreaField", () => {
  it("is reachable by its label and reports its rows", async () => {
    const user = userEvent.setup()
    render(<TextAreaField id="msg" label="Message" rows={5} />)

    await user.type(screen.getByLabelText("Message"), "Hello")

    expect(screen.getByLabelText("Message")).toHaveValue("Hello")
    expect(screen.getByLabelText("Message")).toHaveAttribute("rows", "5")
  })
})

describe("CheckboxField", () => {
  it("toggles through its visible label", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CheckboxField id="tos" label="I agree" onChange={onChange} />)

    await user.click(screen.getByLabelText("I agree"))

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("shows an optional description next to the label", () => {
    render(<CheckboxField id="tos" label="I agree" description="Required to place an order" />)

    expect(screen.getByText("Required to place an order")).toBeInTheDocument()
  })

  it("cannot be toggled while disabled", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CheckboxField id="tos" label="I agree" disabled onChange={onChange} />)

    await user.click(screen.getByLabelText("I agree"))

    expect(onChange).not.toHaveBeenCalled()
  })
})

describe("RadioField", () => {
  it("selects one option out of a named group", async () => {
    const user = userEvent.setup()
    render(
      <>
        <RadioField id="card" name="payment" value="card" label="Card" />
        <RadioField id="net30" name="payment" value="net30" label="Net 30" />
      </>,
    )

    await user.click(screen.getByLabelText("Net 30"))

    expect(screen.getByLabelText("Net 30")).toBeChecked()
    expect(screen.getByLabelText("Card")).not.toBeChecked()
  })
})

describe("SelectField", () => {
  it("shows the placeholder option as the empty-value label", () => {
    render(
      <SelectField id="topic" label="Subject" value="">
        <option value="">Select a topic...</option>
        <option value="order">Order Issues</option>
      </SelectField>,
    )

    expect(screen.getByRole("combobox", { name: /Subject/ })).toHaveTextContent("Select a topic...")
  })

  it("reports the picked option through a synthetic change event carrying name and value", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const onChange = vi.fn()
    render(
      <SelectField id="topic" name="subject" label="Subject" value="" onChange={onChange}>
        <option value="">Select a topic...</option>
        <option value="order">Order Issues</option>
      </SelectField>,
    )

    await user.click(screen.getByRole("combobox", { name: /Subject/ }))
    await user.click(await screen.findByRole("option", { name: "Order Issues" }))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ target: { name: "subject", value: "order" } }))
  })

  it("cannot be opened while disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(
      <SelectField id="topic" label="Subject" value="" disabled>
        <option value="">Select a topic...</option>
        <option value="order">Order Issues</option>
      </SelectField>,
    )

    await user.click(screen.getByRole("combobox", { name: /Subject/ }))

    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })
})
