import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import { INITIAL_EXISTING_IMAGES, INITIAL_LINKED_IMAGES, INITIAL_PHOTO_FILES } from "../lib/product-media"
import EditorHeader from "./EditorHeader"
import EditorNavigation from "./EditorNavigation"
import EditorTabs from "./EditorTabs"
import UploadSummary from "./media/UploadSummary"

describe("EditorHeader", () => {
  it.each([
    ["create", "Create New Product", "Add a new product to your catalog"],
    ["edit", "Edit Product", "Update product information"],
    ["reviewEdit", "Edit Rejected Product", "Update your product and resubmit it for review"],
  ] as const)("%s mode shows its heading", (mode, title, subtitle) => {
    render(<EditorHeader mode={mode} showBackToSearch={false} onBackToSearch={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument()
    expect(screen.getByText(subtitle)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Back to Search/ })).not.toBeInTheDocument()
  })

  it("offers Back to Search when asked to", async () => {
    const onBackToSearch = vi.fn()
    render(<EditorHeader mode="create" showBackToSearch onBackToSearch={onBackToSearch} onCancel={vi.fn()} />)
    await userEvent.setup().click(screen.getByRole("button", { name: /Back to Search/ }))
    expect(onBackToSearch).toHaveBeenCalledTimes(1)
  })
})

describe("EditorTabs", () => {
  it("appends an error count to the accessible name of tabs with errors only", async () => {
    const onSelect = vi.fn()
    render(<EditorTabs activeTab="basic" errorCounts={{ basic: 0, details: 1, media: 3 }} onSelect={onSelect} />)

    expect(screen.getByRole("button", { name: "Basic Information" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Product Details 1 error" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Media 3 errors" })).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole("button", { name: /^Media/ }))
    expect(onSelect).toHaveBeenCalledWith("media")
  })
})

describe("EditorNavigation", () => {
  const renderNav = (props: Partial<Parameters<typeof EditorNavigation>[0]> = {}) =>
    render(
      <EditorNavigation
        activeTab="media"
        mode="create"
        isBusy={false}
        formId="f"
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        {...props}
      />,
    )

  it.each([
    ["create", false, "Submit"],
    ["create", true, "Submitting..."],
    ["edit", false, "Update Product"],
    ["edit", true, "Updating..."],
    ["reviewEdit", false, "Resubmit for Review"],
    ["reviewEdit", true, "Resubmitting..."],
  ] as const)("%s mode, busy=%s -> %s", (mode, isBusy, label) => {
    renderNav({ mode, isBusy })
    const submit = screen.getByRole("button", { name: label })
    expect(submit).toHaveAttribute("type", "submit")
    expect(submit).toHaveAttribute("form", "f")
    expect(submit.hasAttribute("disabled")).toBe(isBusy)
  })

  it("shows Next instead of submit before the last tab, and hides Previous on the first", async () => {
    const onNext = vi.fn()
    renderNav({ activeTab: "basic", onNext })

    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Previous" })).toHaveClass("invisible")
    await userEvent.setup().click(screen.getByRole("button", { name: "Next" }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})

describe("UploadSummary", () => {
  const cover = new File(["c"], "cover.png")

  it("renders nothing without images", () => {
    render(
      <UploadSummary
        photoFiles={INITIAL_PHOTO_FILES}
        existingImages={INITIAL_EXISTING_IMAGES}
        linkedImages={INITIAL_LINKED_IMAGES}
      />,
    )
    expect(screen.queryByText("Images Summary")).not.toBeInTheDocument()
  })

  it("lets a new cover file replace the existing and linked cover lines", () => {
    render(
      <UploadSummary
        photoFiles={{ ...INITIAL_PHOTO_FILES, coverPhoto: cover, photos: [cover, cover] }}
        existingImages={{ coverPhoto: "https://img/e.png", photos: ["e1"] }}
        linkedImages={{ coverPhoto: "https://cdn/l.png", photos: ["l1", "l2", "l3"] }}
      />,
    )
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Cover photo: cover.png (new)",
      "Existing photos: 1 image(s)",
      "New photos: 2 file(s)",
      "Linked photos: 3 image(s)",
    ])
  })

  it("lists both the existing and the linked cover when no file was picked", () => {
    render(
      <UploadSummary
        photoFiles={INITIAL_PHOTO_FILES}
        existingImages={{ coverPhoto: "https://img/e.png", photos: [] }}
        linkedImages={{ coverPhoto: "https://cdn/l.png", photos: [] }}
      />,
    )
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Cover photo: Existing image",
      "Cover photo: link",
    ])
  })
})
