import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import CreateProductPage from "./page"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))
vi.mock("./components/BrandFilterDropdown", () => ({ default: () => null }))

const submitButton = () => screen.getByRole("button", { name: /Create Product/ })

/** The page opens on the search view; this jumps straight to the blank form. */
const openBlankForm = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<CreateProductPage />)
  // The dropdown only opens after the 500ms debounce plus the search round-trip.
  await user.type(screen.getByPlaceholderText(/Search by barcode, name/), "composite")
  await user.click(
    await screen.findByRole("button", { name: /Can't find your product\? Create new/ }, { timeout: 4000 }),
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
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
  it("names the three required fields when the form is submitted empty", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    await user.click(submitButton())

    expect(await screen.findByText("Product name is required")).toBeInTheDocument()
    expect(screen.getByText("Price is required")).toBeInTheDocument()
    expect(screen.getByText("Stock is required")).toBeInTheDocument()
    expect(toastSpies.error).toHaveBeenCalledWith("Please fill in 3 required fields")
  })

  it("shows the single error verbatim when only one field is wrong", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
    await user.type(screen.getByLabelText("Price *"), "10")
    await user.click(submitButton())

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Stock is required"))
  })

  it("rejects a non-positive price", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
    await user.type(screen.getByLabelText("Price *"), "0")
    await user.type(screen.getByLabelText("Stock *"), "5")
    await user.click(submitButton())

    expect(await screen.findByText("Price must be a positive number")).toBeInTheDocument()
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

    await user.type(screen.getByLabelText(/Product Name/), "Composite Kit")
    await user.type(screen.getByLabelText("Price *"), "10")
    await user.type(screen.getByLabelText("Stock *"), "5")
    await user.type(screen.getByLabelText(/Barcode$/), "not-a-number")
    await user.click(submitButton())

    expect(await screen.findByText("Barcode must be a number")).toBeInTheDocument()
  })

  it("switches back to the tab holding the first invalid field", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    await user.click(screen.getByRole("button", { name: "Media" }))
    expect(screen.queryByLabelText(/Product Name/)).not.toBeInTheDocument()

    await user.click(submitButton())

    // `name` is a Basic-tab field, so the page must jump back there to show the error
    expect(await screen.findByText("Product name is required")).toBeInTheDocument()
    expect(screen.getByLabelText(/Product Name/)).toBeInTheDocument()
  })

  it("keeps the submit button clickable so validation can report the problem", async () => {
    const user = userEvent.setup()
    await openBlankForm(user)

    expect(submitButton()).toBeEnabled()
  })
})
