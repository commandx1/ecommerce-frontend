import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { getChildren } from "@/lib/category-tree"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen } from "@/test/render"
import CategoryPicker from "./CategoryPicker"

installRadixPointerPolyfills()

const K_FILES_PATH = ["Endodontic products", "Hand files-reamers-hedstroms", "K-Files"]

function renderPicker(overrides: Partial<Parameters<typeof CategoryPicker>[0]> = {}) {
  const onChange = vi.fn()
  const utils = render(<CategoryPicker value={null} onChange={onChange} {...overrides} />)
  return { ...utils, onChange }
}

describe("CategoryPicker", () => {
  it("renders exactly 2 comboboxes when value is empty", () => {
    renderPicker()

    const category1 = screen.getByRole("combobox", { name: "Category 1" })
    expect(category1).toBeDisabled()
    expect(category1).toHaveTextContent("Dental Supplies")

    expect(screen.getByRole("combobox", { name: "Category 2" })).toHaveTextContent("Select…")
    expect(screen.queryByRole("combobox", { name: "Category 3" })).not.toBeInTheDocument()
  })

  it("opening Category 2 lists the 41 root categories", async () => {
    const user = userEvent.setup()
    renderPicker()

    await user.click(screen.getByRole("combobox", { name: "Category 2" }))

    expect(await screen.findByRole("option", { name: "Endodontic products" })).toBeInTheDocument()
    expect(screen.getAllByRole("option")).toHaveLength(41)
  })

  it("selecting a branch in Category 2 calls onChange and a Category 3 dropdown appears", async () => {
    const user = userEvent.setup()
    const { onChange, rerender } = renderPicker()

    await user.click(screen.getByRole("combobox", { name: "Category 2" }))
    await user.click(await screen.findByRole("option", { name: "Endodontic products" }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(["Endodontic products"])

    rerender(<CategoryPicker value={["Endodontic products"]} onChange={onChange} />)

    expect(await screen.findByRole("combobox", { name: "Category 3" })).toBeInTheDocument()
  })

  it("renders exactly 4 comboboxes for a leaf path, with no Category 5", () => {
    renderPicker({ value: K_FILES_PATH })

    expect(screen.getByRole("combobox", { name: "Category 1" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Category 2" })).toHaveTextContent("Endodontic products")
    expect(screen.getByRole("combobox", { name: "Category 3" })).toHaveTextContent("Hand files-reamers-hedstroms")
    expect(screen.getByRole("combobox", { name: "Category 4" })).toHaveTextContent("K-Files")
    expect(screen.queryByRole("combobox", { name: "Category 5" })).not.toBeInTheDocument()
  })

  it("changing Category 2 while deeper levels are set truncates to just the new selection", async () => {
    const user = userEvent.setup()
    const { onChange } = renderPicker({ value: K_FILES_PATH })

    await user.click(screen.getByRole("combobox", { name: "Category 2" }))
    await user.click(await screen.findByRole("option", { name: "Instruments" }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(["Instruments"])
  })

  it("marks branch options with data-branch and leaves leaf options unmarked", async () => {
    const user = userEvent.setup()

    // "Endodontic products" mixes leaf and branch children, so it exercises both cases at once.
    const leafName = getChildren(["Endodontic products"]).find(
      (node) => !node.children || node.children.length === 0,
    )?.name
    const branchName = getChildren(["Endodontic products"]).find(
      (node) => node.children && node.children.length > 0,
    )?.name
    expect(leafName).toBeTruthy()
    expect(branchName).toBeTruthy()

    renderPicker({ value: ["Endodontic products"] })

    await user.click(screen.getByRole("combobox", { name: "Category 3" }))

    const branchOption = await screen.findByRole("option", { name: branchName as string })
    expect(branchOption).toHaveAttribute("data-branch", "true")

    const leafOption = screen.getByRole("option", { name: leafName as string })
    expect(leafOption).not.toHaveAttribute("data-branch")
  })

  it("marks the Category 2 trigger invalid when hasError is true and value is empty", () => {
    renderPicker({ hasError: true })

    expect(screen.getByRole("combobox", { name: "Category 2" })).toHaveAttribute("aria-invalid", "true")
  })

  it("marks the Category 3 trigger invalid (not Category 2) when hasError is true and Category 2 is set", () => {
    renderPicker({ hasError: true, value: ["Endodontic products"] })

    expect(screen.getByRole("combobox", { name: "Category 2" })).not.toHaveAttribute("aria-invalid")
    expect(screen.getByRole("combobox", { name: "Category 3" })).toHaveAttribute("aria-invalid", "true")
  })

  it("disables every combobox when disabled is true", () => {
    renderPicker({ value: K_FILES_PATH, disabled: true })

    expect(screen.getByRole("combobox", { name: "Category 1" })).toBeDisabled()
    expect(screen.getByRole("combobox", { name: "Category 2" })).toBeDisabled()
    expect(screen.getByRole("combobox", { name: "Category 3" })).toBeDisabled()
    expect(screen.getByRole("combobox", { name: "Category 4" })).toBeDisabled()
  })

  it("renders a legacy value note when legacyValue is provided", () => {
    renderPicker({ legacyValue: "Foo > Bar" })

    expect(screen.getByRole("note")).toHaveTextContent("Previous: Foo > Bar")
  })
})
