import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import FavoriteProductButton from "./FavoriteProductButton"

const mockToastWarning = vi.fn()
const mockToastError = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    warning: (...args: unknown[]) => mockToastWarning(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

const signIn = () => useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")

let writes: Array<{ method: string; productId: string }>

beforeEach(() => {
  vi.restoreAllMocks()
  mockToastWarning.mockClear()
  mockToastError.mockClear()
  writes = []

  server.use(
    http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json([])),
    http.post("*/backend-api/products/:productId/favorite", ({ params }) => {
      writes.push({ method: "POST", productId: String(params.productId) })
      return new HttpResponse(null, { status: 200 })
    }),
    http.delete("*/backend-api/products/:productId/favorite", ({ params }) => {
      writes.push({ method: "DELETE", productId: String(params.productId) })
      return new HttpResponse(null, { status: 200 })
    }),
  )
})

describe("FavoriteProductButton guest", () => {
  it("warns an anonymous visitor to sign in and writes nothing", async () => {
    render(<FavoriteProductButton productId="p-1" />)

    await userEvent.setup().click(screen.getByRole("button", { name: "Save to favorites" }))

    expect(mockToastWarning).toHaveBeenCalledWith("Login required", expect.any(String))
    expect(writes).toEqual([])
  })
})

describe("FavoriteProductButton authenticated", () => {
  it("starts unfavorited and toggles to favorited on click, sending a POST", async () => {
    signIn()
    const user = userEvent.setup()
    render(<FavoriteProductButton productId="p-1" />)

    const button = screen.getByRole("button", { name: "Save to favorites" })
    expect(button).toHaveAttribute("aria-pressed", "false")

    await user.click(button)

    expect(await screen.findByRole("button", { name: "Remove from favorites" })).toHaveAttribute("aria-pressed", "true")
    await waitFor(() => expect(writes).toEqual([{ method: "POST", productId: "p-1" }]))
  })

  it("toggles back to unfavorited on a second click, sending a DELETE", async () => {
    signIn()
    const user = userEvent.setup()
    render(<FavoriteProductButton productId="p-1" />)

    await user.click(screen.getByRole("button", { name: "Save to favorites" }))
    await screen.findByRole("button", { name: "Remove from favorites" })

    await user.click(screen.getByRole("button", { name: "Remove from favorites" }))

    expect(await screen.findByRole("button", { name: "Save to favorites" })).toHaveAttribute("aria-pressed", "false")
    await waitFor(() =>
      expect(writes).toEqual([
        { method: "POST", productId: "p-1" },
        { method: "DELETE", productId: "p-1" },
      ]),
    )
  })

  it("renders as already favorited once hydrate resolves an id that includes this product", async () => {
    signIn()
    server.use(http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json(["p-1"])))

    render(<FavoriteProductButton productId="p-1" />)

    expect(await screen.findByRole("button", { name: "Remove from favorites" })).toHaveAttribute("aria-pressed", "true")
  })

  it("reverts to unfavorited and shows an error toast when the POST fails", async () => {
    signIn()
    server.use(http.post("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 500 })))
    const user = userEvent.setup()
    render(<FavoriteProductButton productId="p-1" />)

    await user.click(screen.getByRole("button", { name: "Save to favorites" }))

    expect(await screen.findByRole("button", { name: "Save to favorites" })).toBeInTheDocument()
    expect(mockToastError).toHaveBeenCalledWith("Action failed", expect.any(String))
  })

  it("does not trigger a parent anchor's onClick and prevents the default navigation", async () => {
    signIn()
    const parentClick = vi.fn()
    const user = userEvent.setup()
    render(
      // eslint-disable-next-line jsx-a11y/anchor-is-valid
      <a href="/x" onClick={parentClick}>
        <FavoriteProductButton productId="p-1" />
      </a>,
    )

    await user.click(screen.getByRole("button", { name: "Save to favorites" }))

    expect(parentClick).not.toHaveBeenCalled()
  })
})
