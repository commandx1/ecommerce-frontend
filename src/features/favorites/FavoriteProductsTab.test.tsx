import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { makeFavoriteProductItem } from "@/test/factories/product.factory"
import { render, screen, waitFor } from "@/test/render"
import FavoriteProductsTab from "./FavoriteProductsTab"

const mockToastError = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

const signIn = () => useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")

const item = makeFavoriteProductItem()

beforeEach(() => {
  vi.restoreAllMocks()
  mockToastError.mockClear()
})

describe("FavoriteProductsTab loading", () => {
  it("renders the favorited product's card once the ids hydrate to include it", async () => {
    server.use(http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json([item.productId])))

    render(<FavoriteProductsTab />)

    expect(await screen.findByText(item.productName)).toBeInTheDocument()
  })
})

describe("FavoriteProductsTab empty and error states", () => {
  it("says so when the favorites list is empty", async () => {
    server.use(http.get("*/backend-api/products/favorites", () => HttpResponse.json([])))

    render(<FavoriteProductsTab />)

    expect(await screen.findByText("No favorite products yet.")).toBeInTheDocument()
  })

  it("reports a failed lookup on a 500", async () => {
    server.use(http.get("*/backend-api/products/favorites", () => new HttpResponse(null, { status: 500 })))

    render(<FavoriteProductsTab />)

    expect(await screen.findByText("Unable to load favorite products. Please try again later.")).toBeInTheDocument()
  })

  it("shows the empty state instead of crashing on a malformed 200 (object, not a list)", async () => {
    server.use(http.get("*/backend-api/products/favorites", () => HttpResponse.json({ nope: true })))

    render(<FavoriteProductsTab />)

    expect(await screen.findByText("No favorite products yet.")).toBeInTheDocument()
  })
})

describe("FavoriteProductsTab remove-from-card flow", () => {
  beforeEach(() => {
    signIn()
    server.use(http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json([item.productId])))
  })

  it("sends a DELETE and removes the card when its heart is clicked", async () => {
    let deletedId: string | undefined
    server.use(
      http.delete("*/backend-api/products/:productId/favorite", ({ params }) => {
        deletedId = String(params.productId)
        return new HttpResponse(null, { status: 200 })
      }),
    )
    const user = userEvent.setup()
    render(<FavoriteProductsTab />)
    await screen.findByText(item.productName)

    await user.click(screen.getByRole("button", { name: "Remove from favorites" }))

    await waitFor(() => expect(screen.queryByText(item.productName)).not.toBeInTheDocument())
    expect(deletedId).toBe(item.productId)
  })

  it("brings the card back and shows an error toast when the DELETE fails", async () => {
    server.use(http.delete("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 500 })))
    const user = userEvent.setup()
    render(<FavoriteProductsTab />)
    await screen.findByText(item.productName)

    await user.click(screen.getByRole("button", { name: "Remove from favorites" }))

    expect(await screen.findByText(item.productName)).toBeInTheDocument()
    expect(mockToastError).toHaveBeenCalledWith("Action failed", expect.any(String))
  })
})
