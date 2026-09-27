import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { makeFavoriteProductItem } from "@/test/factories/product.factory"
import { cleanup, render, screen, waitFor } from "@/test/render"
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

describe("FavoriteProductsTab cross-device freshness", () => {
  /**
   * The favorite-*ids* store hydrates once per tab lifetime by default (see
   * `favoriteProductsStore.hydrate`), so without forcing a fresh GET on every mount, reopening
   * this tab after favoriting/unfavoriting on another device would keep showing the ids this tab
   * already had cached.
   */
  it("shows the current server state (not a stale cache) when the tab is reopened after a change made elsewhere", async () => {
    const itemA = makeFavoriteProductItem({ productId: "p-a", productName: "Product A" })
    const itemB = makeFavoriteProductItem({ productId: "p-b", productName: "Product B" })
    server.use(http.get("*/backend-api/products/favorites", () => HttpResponse.json([itemA, itemB])))

    server.use(http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json([itemA.productId])))
    const { unmount } = render(<FavoriteProductsTab />)
    expect(await screen.findByText("Product A")).toBeInTheDocument()
    expect(screen.queryByText("Product B")).not.toBeInTheDocument()
    unmount()
    cleanup()

    // Simulates a favorites change made on a different device: A was unfavorited, B was favorited.
    server.use(http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json([itemB.productId])))
    render(<FavoriteProductsTab />)

    expect(await screen.findByText("Product B")).toBeInTheDocument()
    expect(screen.queryByText("Product A")).not.toBeInTheDocument()
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
    await user.click(await screen.findByRole("button", { name: "Remove" }))

    await waitFor(() => expect(screen.queryByText(item.productName)).not.toBeInTheDocument())
    expect(deletedId).toBe(item.productId)
  })

  it("brings the card back and shows an error toast when the DELETE fails", async () => {
    server.use(http.delete("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 500 })))
    const user = userEvent.setup()
    render(<FavoriteProductsTab />)
    await screen.findByText(item.productName)

    await user.click(screen.getByRole("button", { name: "Remove from favorites" }))
    await user.click(await screen.findByRole("button", { name: "Remove" }))

    expect(await screen.findByText(item.productName)).toBeInTheDocument()
    expect(mockToastError).toHaveBeenCalledWith("Action failed", expect.any(String))
  })
})

describe("FavoriteProductsTab pagination", () => {
  const manyItems = Array.from({ length: 13 }, (_, i) =>
    makeFavoriteProductItem({ productId: `p-${i}`, productName: `Product ${i}` }),
  )

  it("shows 12 cards on page 1, with pagination, and 1 card after clicking next", async () => {
    server.use(
      http.get("*/backend-api/products/favorites", () => HttpResponse.json(manyItems)),
      http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json(manyItems.map((p) => p.productId))),
    )
    const user = userEvent.setup()
    render(<FavoriteProductsTab />)

    await screen.findByText("Product 0")
    for (let i = 0; i < 12; i++) {
      expect(screen.getByText(`Product ${i}`)).toBeInTheDocument()
    }
    expect(screen.queryByText("Product 12")).not.toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: "pagination" })).toBeInTheDocument()

    await user.click(screen.getByText("Next"))

    expect(await screen.findByText("Product 12")).toBeInTheDocument()
    expect(screen.queryByText("Product 0")).not.toBeInTheDocument()
  })

  it("falls back to page 1 and hides pagination once the last item on page 2 is removed", async () => {
    signIn()
    server.use(
      http.get("*/backend-api/products/favorites", () => HttpResponse.json(manyItems)),
      http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json(manyItems.map((p) => p.productId))),
      http.delete("*/backend-api/products/:productId/favorite", () => new HttpResponse(null, { status: 200 })),
    )
    const user = userEvent.setup()
    render(<FavoriteProductsTab />)

    await screen.findByText("Product 0")
    await user.click(screen.getByText("Next"))
    await screen.findByText("Product 12")

    await user.click(screen.getByRole("button", { name: "Remove from favorites" }))
    await user.click(await screen.findByRole("button", { name: "Remove" }))

    await waitFor(() => expect(screen.queryByText("Product 12")).not.toBeInTheDocument())
    for (let i = 0; i < 12; i++) {
      expect(screen.getByText(`Product ${i}`)).toBeInTheDocument()
    }
    expect(screen.queryByRole("navigation", { name: "pagination" })).not.toBeInTheDocument()
  })

  it("renders no pagination control with 12 or fewer items", async () => {
    const twelveItems = manyItems.slice(0, 12)
    server.use(
      http.get("*/backend-api/products/favorites", () => HttpResponse.json(twelveItems)),
      http.get("*/backend-api/products/favorite-ids", () => HttpResponse.json(twelveItems.map((p) => p.productId))),
    )
    render(<FavoriteProductsTab />)

    await screen.findByText("Product 0")
    expect(screen.queryByRole("navigation", { name: "pagination" })).not.toBeInTheDocument()
  })
})
