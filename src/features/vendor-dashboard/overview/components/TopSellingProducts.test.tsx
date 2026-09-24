import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeVendorTopSellingProduct } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import TopSellingProducts from "./TopSellingProducts"

const TOP_SELLING_URL = "*/backend-api/dashboard/vendor/top-selling-products"

const signInVendor = () => {
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "token",
    isAuthenticated: true,
  })
}

const pageOf = (content: unknown) => ({
  content,
  totalPages: 1,
  totalElements: Array.isArray(content) ? content.length : 0,
  last: true,
  first: true,
  numberOfElements: Array.isArray(content) ? content.length : 0,
  size: 4,
  number: 0,
  empty: !Array.isArray(content) || content.length === 0,
})

const serveTopSelling = (body: unknown) => {
  server.use(http.get(TOP_SELLING_URL, () => HttpResponse.json(body as object)))
}

beforeEach(() => {
  signInVendor()
})

describe("TopSellingProducts", () => {
  it("shows loading skeletons before the products resolve", () => {
    serveTopSelling(pageOf([makeVendorTopSellingProduct()]))
    const { container } = render(<TopSellingProducts />)

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it("renders each product's name, SKU and sell count from the backend page", async () => {
    serveTopSelling(
      pageOf([
        makeVendorTopSellingProduct({
          userProductId: "up-1",
          name: "Intra Oral Mixing Tips",
          skuCode: "SKU-1",
          manufacturerCode: "MK-1001",
          sellCount: 320,
        }),
      ]),
    )
    render(<TopSellingProducts />)

    expect(await screen.findByText("Intra Oral Mixing Tips")).toBeInTheDocument()
    expect(screen.getByText("SKU: SKU-1")).toBeInTheDocument()
    expect(screen.getByText("320 sold")).toBeInTheDocument()
  })

  it("falls back to the manufacturer code when skuCode is null", async () => {
    serveTopSelling(pageOf([makeVendorTopSellingProduct({ skuCode: null, manufacturerCode: "MK-2002" })]))
    render(<TopSellingProducts />)

    expect(await screen.findByText("SKU: MK-2002")).toBeInTheDocument()
  })

  it("falls back to an em dash when both skuCode and manufacturerCode are null", async () => {
    serveTopSelling(pageOf([makeVendorTopSellingProduct({ skuCode: null, manufacturerCode: null })]))
    render(<TopSellingProducts />)

    expect(await screen.findByText("SKU: —")).toBeInTheDocument()
  })

  it("renders no product rows instead of crashing when the vendor has no top sellers yet", async () => {
    serveTopSelling(pageOf([]))
    render(<TopSellingProducts />)

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: /sold/ })).not.toBeInTheDocument()
    })
    expect(screen.getByText("Top Selling Products")).toBeInTheDocument()
  })

  it("shows an error message and a Retry button instead of the products when the request fails", async () => {
    server.use(http.get(TOP_SELLING_URL, () => new HttpResponse(null, { status: 400 })))
    render(<TopSellingProducts />)

    expect(await screen.findByText("Couldn't load top selling products. Please try again.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /sold/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/bad request/i)).not.toBeInTheDocument()
    expect(screen.getByText("Top Selling Products")).toBeInTheDocument()
  })

  it("re-requests the top sellers and renders them after a successful retry", async () => {
    server.use(http.get(TOP_SELLING_URL, () => new HttpResponse(null, { status: 400 })))
    render(<TopSellingProducts />)
    await screen.findByText("Couldn't load top selling products. Please try again.")

    serveTopSelling(pageOf([makeVendorTopSellingProduct({ name: "Intra Oral Mixing Tips", sellCount: 320 })]))
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Retry" }))

    expect(await screen.findByText("Intra Oral Mixing Tips")).toBeInTheDocument()
    expect(screen.queryByText("Couldn't load top selling products. Please try again.")).not.toBeInTheDocument()
  })

  it.each([
    ["content missing entirely", {}],
    ["content null", { content: null }],
    ["content not an array", { content: { name: "Intra Oral Mixing Tips" } }],
  ])("renders no product rows instead of crashing when %s", async (_label, body) => {
    serveTopSelling(body)
    render(<TopSellingProducts />)

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: /sold/ })).not.toBeInTheDocument()
    })
    expect(screen.getByText("Top Selling Products")).toBeInTheDocument()
  })

  it("does not request top-selling data for an unauthenticated visitor", async () => {
    useAuthStore.getState().clearAuth()
    let requested = false
    server.use(
      http.get(TOP_SELLING_URL, () => {
        requested = true
        return HttpResponse.json(pageOf([]))
      }),
    )
    render(<TopSellingProducts />)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(requested).toBe(false)
  })
})
