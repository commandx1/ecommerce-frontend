import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiRequest } from "@/lib/api/request"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeProduct, makeVendorUserProduct } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import CreateProductPage from "./page"

// This file drives the full 17-field, three-tab create-product form through userEvent, so its
// slowest cases legitimately take ~1.8s in isolation. Under the full suite's parallel worker load
// that stretches past the 5s default and the whole file fails on timeouts — nine of them in the
// gate run on 27 Aug 2026, with zero assertion failures. The work is real, so the budget is
// raised to match it rather than the tests being retried or trimmed. Same reasoning as the
// Playwright `workers=3` decision: match capacity, do not mask contention.
// If a test here ever exceeds this, that is a genuine slowdown worth investigating.
vi.setConfig({ testTimeout: 20_000 })

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))
// Brand is now a required field, so the mock needs to behave like a real controlled input.
// The search view also renders BrandFilterDropdown without an `id`; only give it an
// aria-label when `id` is present so `getByLabelText("Brand")` in the form stays unambiguous.
vi.mock("./components/BrandFilterDropdown", () => ({
  default: ({
    id,
    value,
    onChange,
    disabled,
  }: {
    id?: string
    value: string | null
    onChange: (v: string | null) => void
    disabled?: boolean
  }) =>
    id ? (
      <input
        id={id}
        aria-label="Brand"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
      />
    ) : null,
}))

const submitButton = () => screen.getByRole("button", { name: /^Submit$/ })
const nextButton = () => screen.getByRole("button", { name: "Next" })

/** Tab headers get an appended "N errors" a11y label once a tab has errors, so match by prefix. */
const tabButton = (label: string) => screen.getByRole("button", { name: new RegExp(`^${label}`) })

/** The page opens on the search view; this jumps straight to the blank form. */
const openBlankForm = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<CreateProductPage />)
  // The dropdown only opens after the 500ms debounce plus the search round-trip.
  await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
  await user.click(
    await screen.findByRole("button", { name: /Can't find your product\? Create new/ }, { timeout: 4000 }),
  )
}

/** Fills every required Basic-tab field; leaves the form on the Basic tab. */
const fillBasicTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
  await user.type(screen.getByLabelText("SKU Code *"), "SKU-1")
  await user.type(screen.getByLabelText("Price *"), "42")
  await user.type(screen.getByLabelText("Stock *"), "7")
  await user.type(screen.getByLabelText("Shipment Fee *"), "5")
  await user.type(screen.getByLabelText("Heavy Shipping Fee *"), "3")
  await user.type(screen.getByLabelText("Fulfillment Policy *"), "Ships within 2 business days")
}

/** Fills every required Details-tab field; leaves the form on the Details tab. */
const fillDetailsTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Detailed Description *"), "A great dental product")
  await user.type(screen.getByLabelText("Manufacturer Code *"), "MNF-1")
  await user.type(screen.getByLabelText("Manufacturer *"), "MARK3")
  await user.type(screen.getByLabelText("Brand"), "Acme Dental")
  await user.type(screen.getByLabelText("Manufacturer Site Product Page *"), "https://example.com/products/item")
  await user.type(screen.getByLabelText("Reorder ID *"), "RO-1001")
  await user.type(screen.getByLabelText("Reference Number *"), "REF-2024-01")
  await user.type(screen.getByLabelText("Weight *"), "1.5")
}

beforeEach(() => {
  vi.restoreAllMocks()
  URL.createObjectURL = vi.fn(() => "blob:preview")
  URL.revokeObjectURL = vi.fn()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "vendor-token",
    isAuthenticated: true,
  })
})

describe("CreateProductPage — form validation", () => {
  it("shows inline errors for all Basic-tab fields on clicking Next and does not toast", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    await user.click(nextButton())

    expect(await screen.findByText("Product name is required")).toBeInTheDocument()
    expect(screen.getByText("SKU code is required")).toBeInTheDocument()
    expect(screen.getByText("Price is required")).toBeInTheDocument()
    expect(screen.getByText("Stock is required")).toBeInTheDocument()
    expect(screen.getByText("Shipment fee is required")).toBeInTheDocument()
    expect(screen.getByText("Heavy shipping fee is required")).toBeInTheDocument()
    expect(screen.getByText("Fulfillment policy is required")).toBeInTheDocument()
    // Active tab jumped to (or stayed on) Basic, where the errored fields live.
    expect(screen.getByLabelText(/Product Name/)).toBeInTheDocument()
    expect(toastSpies.error).not.toHaveBeenCalled()
  })

  it("blocks forward navigation while the Basic tab has errors and shows the error badge", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    await user.click(tabButton("Product Details"))
    expect(await screen.findByText("Product name is required")).toBeInTheDocument()
    expect(screen.getByLabelText(/Product Name/)).toBeInTheDocument()
    expect(screen.getByTitle("7 errors")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByLabelText(/Product Name/)).toBeInTheDocument()
  })

  it("reaches Details once Basic is valid, then blocks Media while Details has errors", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await fillBasicTab(user)

    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(await screen.findByLabelText("Detailed Description *")).toBeInTheDocument()

    await user.click(tabButton("Media"))
    // Blocked: still on Details, and its error badge now shows.
    expect(screen.getByLabelText("Detailed Description *")).toBeInTheDocument()
    expect(await screen.findByTitle("8 errors")).toBeInTheDocument()
  })

  it("allows backward navigation away from Details even while it has errors", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await fillBasicTab(user)
    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(await screen.findByLabelText("Detailed Description *")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Previous" }))
    expect(screen.getByLabelText(/Product Name/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Next" }))
    await user.click(tabButton("Basic Information"))
    expect(screen.getByLabelText(/Product Name/)).toBeInTheDocument()
  })

  it("clears an inline error once its field is fixed, and the Basic badge disappears once all Basic errors are fixed", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await user.click(nextButton())
    expect(await screen.findByText("Product name is required")).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
    expect(screen.queryByText("Product name is required")).not.toBeInTheDocument()

    await user.type(screen.getByLabelText("SKU Code *"), "SKU-1")
    await user.type(screen.getByLabelText("Price *"), "42")
    await user.type(screen.getByLabelText("Stock *"), "7")
    await user.type(screen.getByLabelText("Shipment Fee *"), "5")
    await user.type(screen.getByLabelText("Heavy Shipping Fee *"), "3")
    await user.type(screen.getByLabelText("Fulfillment Policy *"), "Ships within 2 business days")

    // No appended "N errors" label left on the Basic tab header.
    expect(screen.getByRole("button", { name: "Basic Information" })).toBeInTheDocument()
  })

  it("accepts a zero price, matching the backend's non-negative rule", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
    await user.type(screen.getByLabelText("SKU Code *"), "SKU-1")
    await user.type(screen.getByLabelText("Price *"), "0")
    await user.type(screen.getByLabelText("Stock *"), "5")
    await user.type(screen.getByLabelText("Shipment Fee *"), "5")
    await user.type(screen.getByLabelText("Heavy Shipping Fee *"), "3")
    await user.type(screen.getByLabelText("Fulfillment Policy *"), "Ships within 2 business days")
    await user.click(nextButton())

    // Basic tab passed validation (moved on to Details) — no error for price.
    expect(await screen.findByLabelText("Detailed Description *")).toBeInTheDocument()
    expect(screen.queryByText(/^Price (is|must)/)).not.toBeInTheDocument()
  })

  it("constrains stock and price to non-negative values at the input level", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    expect(screen.getByLabelText("Stock *")).toHaveAttribute("min", "0")
    expect(screen.getByLabelText("Price *")).toHaveAttribute("min", "0")

    expect(screen.getByLabelText("Stock *")).toHaveAttribute("step", "1")
  })

  it("rejects a non-numeric barcode", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    await fillBasicTab(user)
    await user.type(screen.getByLabelText(/Barcode$/), "not-a-number")
    await user.click(nextButton())

    expect(await screen.findByText("Barcode must be a number")).toBeInTheDocument()
  })

  it("validates the manufacturer site URL format and that weight is greater than 0", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)
    await fillBasicTab(user)
    await user.click(screen.getByRole("button", { name: "Next" }))

    await user.type(screen.getByLabelText("Manufacturer Site Product Page *"), "not-a-url")
    await user.type(screen.getByLabelText("Weight *"), "0")
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(
      await screen.findByText("Manufacturer site product page must be a valid URL (starting with http:// or https://)"),
    ).toBeInTheDocument()
    expect(screen.getByText("Weight must be greater than 0")).toBeInTheDocument()
  })

  it("requires a cover photo even when every other field is valid, and shows the error on Media", async () => {
    const user = userEvent.setup()
    const requestJson = vi.spyOn(apiRequest, "requestJson")

    await openBlankForm(user)
    await fillBasicTab(user)
    await user.click(nextButton())
    await fillDetailsTab(user)
    await user.click(nextButton())
    await user.click(submitButton())

    expect(await screen.findByText("Cover photo is required")).toBeInTheDocument()
    // Only one tab's fields render at a time, so this confirms Media (not Details) is active.
    expect(screen.queryByLabelText("Detailed Description *")).not.toBeInTheDocument()
    expect(
      requestJson.mock.calls.some(([config]) =>
        String((config as { url?: string }).url).includes("/api/products/review"),
      ),
    ).toBe(false)
  })

  it("keeps the Next button clickable so validation can report the problem", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    expect(nextButton()).toBeEnabled()
  })

  it("edit mode validates only price and stock, leaving the details tab untouched", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/user-products", () =>
        HttpResponse.json([makeVendorUserProduct({ id: "up-9", price: 56, stock: 40 })]),
      ),
      http.get("*/api/products/:id", ({ params }) => HttpResponse.json(makeProduct({ id: String(params.id) }))),
    )

    render(<CreateProductPage />, { searchParams: "edit=up-9" })

    const priceInput = await screen.findByLabelText("Price *")
    await waitFor(() => expect(priceInput).toHaveValue(56))
    expect(screen.getByLabelText("Stock *")).toBeInTheDocument()
    expect(screen.queryByLabelText("Detailed Description *")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("SKU Code *")).not.toBeInTheDocument()

    await user.clear(priceInput)
    await user.click(nextButton())

    expect(await screen.findByText("Price is required")).toBeInTheDocument()
    expect(screen.queryByLabelText("Detailed Description *")).not.toBeInTheDocument()
  })

  it("removes the header submit button and switches the bottom button between Next and Submit", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    expect(screen.queryByRole("button", { name: /Create Product/ })).not.toBeInTheDocument()
    expect(nextButton()).toBeInTheDocument()

    await fillBasicTab(user)
    await user.click(nextButton())
    await fillDetailsTab(user)
    await user.click(nextButton())

    expect(submitButton()).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument()
  })

  it("edit mode: reaching the Media tab shows an Update Product submit button", async () => {
    const user = userEvent.setup()
    server.use(
      http.get("*/api/user-products", () =>
        HttpResponse.json([makeVendorUserProduct({ id: "up-9", price: 56, stock: 40 })]),
      ),
      http.get("*/api/products/:id", ({ params }) => HttpResponse.json(makeProduct({ id: String(params.id) }))),
    )

    render(<CreateProductPage />, { searchParams: "edit=up-9" })

    await screen.findByLabelText("Price *")
    await user.click(nextButton())
    await user.click(nextButton())

    expect(await screen.findByRole("button", { name: "Update Product" })).toBeInTheDocument()
  })
})
