import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen } from "@/test/render"
import SearchableSelect, { type SearchableSelectOption } from "./searchable-select"

installRadixPointerPolyfills()

const OPTIONS: SearchableSelectOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
]

function renderSelect(overrides: Partial<Parameters<typeof SearchableSelect>[0]> = {}) {
  const onValueChange = vi.fn()
  const utils = render(
    <>
      <label htmlFor="fruit">Fruit</label>
      <SearchableSelect id="fruit" value={null} onValueChange={onValueChange} options={OPTIONS} {...overrides} />
    </>,
  )
  return { ...utils, onValueChange }
}

describe("SearchableSelect", () => {
  it("filters options immediately while typing, without pressing Enter", async () => {
    const user = userEvent.setup()
    renderSelect()

    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    await user.type(screen.getByRole("textbox"), "an")

    expect(screen.getByRole("option", { name: "Banana" })).toBeInTheDocument()
    expect(screen.getAllByRole("option")).toHaveLength(1)
  })

  it("shows empty text and zero options when nothing matches", async () => {
    const user = userEvent.setup()
    renderSelect()

    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    await user.type(screen.getByRole("textbox"), "zzz")

    expect(screen.getByText("No results")).toBeInTheDocument()
    expect(screen.queryAllByRole("option")).toHaveLength(0)
  })

  it("ArrowDown then Enter selects the 2nd filtered option and closes", async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderSelect()

    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    const input = screen.getByRole("textbox")
    await user.type(input, "a")
    await user.keyboard("{ArrowDown}{Enter}")

    expect(onValueChange).toHaveBeenCalledWith("banana")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("Escape closes the popover", async () => {
    const user = userEvent.setup()
    renderSelect()

    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    expect(screen.getByRole("listbox")).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("reopening shows an empty search and the full list again", async () => {
    const user = userEvent.setup()
    renderSelect()

    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    await user.type(screen.getByRole("textbox"), "an")
    await user.keyboard("{Escape}")

    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    expect(screen.getByRole("textbox")).toHaveValue("")
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length)
  })

  it("does not open when disabled", async () => {
    const user = userEvent.setup()
    renderSelect({ disabled: true })

    const trigger = screen.getByRole("combobox", { name: "Fruit" })
    expect(trigger).toBeDisabled()
    await user.click(trigger)
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("marks the option matching value as aria-selected", async () => {
    const user = userEvent.setup()
    renderSelect({ value: "cherry" })

    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("option", { name: "Apple" })).toHaveAttribute("aria-selected", "false")
  })

  it("clicking an option calls onValueChange and closes", async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderSelect()

    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    await user.click(screen.getByRole("option", { name: "Date" }))

    expect(onValueChange).toHaveBeenCalledWith("date")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("focuses the search input after opening", async () => {
    const user = userEvent.setup()
    renderSelect()

    await user.click(screen.getByRole("combobox", { name: "Fruit" }))
    expect(screen.getByRole("textbox")).toHaveFocus()
  })
})
