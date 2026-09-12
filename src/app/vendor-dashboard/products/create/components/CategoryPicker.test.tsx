import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { installRadixPointerPolyfills } from "@/test/radix"
import { render, screen, waitFor, within } from "@/test/render"
import CategoryPicker from "./CategoryPicker"

installRadixPointerPolyfills()

const K_FILES_PATH = ["Endodontic products", "Hand files-reamers-hedstroms", "K-Files"]

function renderPicker(overrides: Partial<Parameters<typeof CategoryPicker>[0]> = {}) {
  const onChange = vi.fn()
  const utils = render(<CategoryPicker value={null} onChange={onChange} {...overrides} />)
  return { ...utils, onChange }
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /select a category|dental supplies/i }))
  await screen.findByRole("listbox")
}

describe("CategoryPicker", () => {
  it("renders placeholder when value is null and full path when value is set", () => {
    renderPicker()
    expect(screen.getByRole("button", { name: "Select a category" })).toBeInTheDocument()
  })

  it("renders the full path text when a value is set", () => {
    renderPicker({ value: K_FILES_PATH })
    expect(
      screen.getByRole("button", {
        name: "Dental Supplies > Endodontic products > Hand files-reamers-hedstroms > K-Files",
      }),
    ).toBeInTheDocument()
  })

  it("opening shows the 41 root categories", async () => {
    const user = userEvent.setup()
    renderPicker()

    await openPicker(user)

    expect(await screen.findByRole("option", { name: "Endodontic products" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Instruments" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Pharmaceutical products" })).toBeInTheDocument()
    expect(screen.getAllByRole("option")).toHaveLength(41)
  })

  it("drills down into a branch and back up via the Back button", async () => {
    const user = userEvent.setup()
    renderPicker()

    await openPicker(user)
    await user.click(await screen.findByRole("option", { name: "Endodontic products" }))

    expect(await screen.findByRole("option", { name: "Medicaments" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Endodontic sealers & cements" })).toBeInTheDocument()
    expect(screen.getByTestId("category-breadcrumb")).toHaveTextContent("Dental Supplies › Endodontic products")

    await user.click(screen.getByRole("button", { name: "Back" }))

    expect(await screen.findByRole("option", { name: "Endodontic products" })).toBeInTheDocument()
    expect(screen.getAllByRole("option")).toHaveLength(41)
  })

  it("selects a leaf while browsing, calling onChange once and closing the popover", async () => {
    const user = userEvent.setup()
    const { onChange } = renderPicker()

    await openPicker(user)
    await user.click(await screen.findByRole("option", { name: "Endodontic products" }))
    await user.click(await screen.findByRole("option", { name: "Hand files-reamers-hedstroms" }))
    await user.click(await screen.findByRole("option", { name: "K-Files" }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(K_FILES_PATH)

    await waitFor(() => expect(screen.queryByRole("option", { name: "K-Files" })).not.toBeInTheDocument())
  })

  it("opens at the parent level of the current value with the current leaf marked selected", async () => {
    const user = userEvent.setup()
    renderPicker({ value: K_FILES_PATH })

    await user.click(
      screen.getByRole("button", {
        name: "Dental Supplies > Endodontic products > Hand files-reamers-hedstroms > K-Files",
      }),
    )
    await screen.findByRole("listbox")

    expect(await screen.findByRole("option", { name: "Hedstrom files" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Reamers" })).toBeInTheDocument()

    const kFilesOption = screen.getByRole("option", { name: /K-Files/ })
    expect(within(kFilesOption).getByText((_, el) => el?.tagName === "svg")).toBeTruthy()
  })

  it("search: typing an exact term returns one match and selecting it applies and closes", async () => {
    const user = userEvent.setup()
    const { onChange } = renderPicker()

    await openPicker(user)
    await user.type(screen.getByPlaceholderText("Search categories…"), "k-files")

    const options = await screen.findAllByRole("option")
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent("Endodontic products > Hand files-reamers-hedstroms > K-Files")

    await user.click(options[0])

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(K_FILES_PATH)
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument())
  })

  it("multi-token search only returns labels containing every token", async () => {
    const user = userEvent.setup()
    renderPicker()

    await openPicker(user)
    await user.type(screen.getByPlaceholderText("Search categories…"), "endodontic hand")

    const options = await screen.findAllByRole("option")
    expect(options.length).toBeGreaterThan(0)
    for (const option of options) {
      const text = option.textContent?.toLowerCase() ?? ""
      expect(text).toContain("endodontic")
      expect(text).toContain("hand")
    }
  })

  it("shows a no-match message for a query with no results", async () => {
    const user = userEvent.setup()
    renderPicker()

    await openPicker(user)
    await user.type(screen.getByPlaceholderText("Search categories…"), "zzzz")

    expect(await screen.findByText("No category matches “zzzz”")).toBeInTheDocument()
  })

  it("clears the value via the clear control without opening the popover", async () => {
    const user = userEvent.setup()
    const { onChange } = renderPicker({ value: K_FILES_PATH })

    await user.click(screen.getByRole("button", { name: "Clear category" }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(null)
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("does not render options or a clear control when disabled", async () => {
    const user = userEvent.setup()
    renderPicker({ value: K_FILES_PATH, disabled: true })

    expect(screen.queryByRole("button", { name: "Clear category" })).not.toBeInTheDocument()

    const trigger = screen.getByRole("button", {
      name: "Dental Supplies > Endodontic products > Hand files-reamers-hedstroms > K-Files",
    })
    expect(trigger).toBeDisabled()

    await user.click(trigger)
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("renders a legacy value note when legacyValue is provided", () => {
    renderPicker({ legacyValue: "Foo > Bar" })

    expect(screen.getByRole("note")).toHaveTextContent("Previous: Foo > Bar")
  })

  it("closes on Escape without calling onChange", async () => {
    const user = userEvent.setup()
    const { onChange } = renderPicker()

    await openPicker(user)
    await user.keyboard("{Escape}")

    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument())
    expect(onChange).not.toHaveBeenCalled()
  })
})
