import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Product } from "@/lib/api/products"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeProduct, makeUserProductDetailResponse } from "@/test/factories"
import { render, screen, waitFor, within } from "@/test/render"
import { signInVendor } from "@/test/vendor-products-page-harness"
import ProductDetailModal from "./ProductDetailModal"

const PRODUCT_URL = "*/api/products/:id/owner"
const USER_PRODUCT_URL = "*/api/user-products/:id"

const onClose = vi.fn()

const renderModal = () =>
  render(<ProductDetailModal productId="p-1" userProductId="up-1" productName="Fallback Name" onClose={onClose} />)

beforeEach(() => {
  vi.restoreAllMocks()
  onClose.mockClear()
  signInVendor()
})

describe("Vendor ProductDetailModal — loading and error", () => {
  it("shows the caller-supplied product name as the header before the detail requests resolve", async () => {
    renderModal()

    // The header reads `product?.name || productName`, so it must show the fallback the instant
    // the dialog mounts - before `product` is ever set, loading or not.
    const dialog = within(screen.getByRole("dialog"))
    expect(dialog.getByText("Fallback Name")).toBeInTheDocument()
  })

  it("shows a failed-to-load state with a retry action when either request fails", async () => {
    server.use(http.get(PRODUCT_URL, () => HttpResponse.json({ message: "boom" }, { status: 500 })))

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    expect(await dialog.findByText("Failed to load product details")).toBeInTheDocument()
    expect(dialog.getByRole("button", { name: "Retry" })).toBeInTheDocument()
    // The failure state replaces the body outright — no stale/partial product data underneath.
    expect(dialog.queryByText("Brand")).not.toBeInTheDocument()
  })

  it("re-fetches and renders the product once Retry succeeds after an initial failure", async () => {
    let attempt = 0
    server.use(
      http.get(PRODUCT_URL, () => {
        attempt += 1
        if (attempt === 1) {
          return HttpResponse.json({ message: "boom" }, { status: 500 })
        }
        return HttpResponse.json(makeProduct({ name: "Recovered Product" }))
      }),
    )

    const user = (await import("@testing-library/user-event")).default.setup()
    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Failed to load product details")

    await user.click(dialog.getByRole("button", { name: "Retry" }))

    expect(await dialog.findByText("Recovered Product")).toBeInTheDocument()
    expect(dialog.queryByText("Failed to load product details")).not.toBeInTheDocument()
  })

  it("also fails when the product loads but the user-product listing request fails", async () => {
    server.use(http.get(USER_PRODUCT_URL, () => HttpResponse.json({ message: "boom" }, { status: 500 })))

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    expect(await dialog.findByText("Failed to load product details")).toBeInTheDocument()
  })

  /**
   * `accessToken` is read from the auth store, not passed as a prop, so it can disappear out from
   * under an already-open modal (e.g. a 401 elsewhere in the app triggers the interceptor's
   * logout while the vendor is still looking at this dialog, just before the redirect unmounts
   * it). The fetch effect must not fire without a token - it must stay on the skeleton rather
   * than a false "Failed to load" error, since no request was actually attempted.
   */
  it("stays on the loading skeleton and never requests details when there is no access token", async () => {
    useAuthStore.setState({ accessToken: null })
    const requested = vi.fn()
    server.use(
      http.get(PRODUCT_URL, () => {
        requested()
        return HttpResponse.json(makeProduct())
      }),
    )

    renderModal()

    const dialog = within(screen.getByRole("dialog"))
    expect(dialog.getByText("Fallback Name")).toBeInTheDocument()
    expect(dialog.queryByText("Failed to load product details")).not.toBeInTheDocument()
    expect(requested).not.toHaveBeenCalled()
  })

  it("calls onClose when the footer Close button is clicked", async () => {
    const user = (await import("@testing-library/user-event")).default.setup()
    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Brand")
    await user.click(dialog.getByRole("button", { name: "Close" }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe("Vendor ProductDetailModal — product details", () => {
  it("renders the active badge, spec grid and vendor listing metrics for a fully-populated product", async () => {
    server.use(
      http.get(PRODUCT_URL, () =>
        HttpResponse.json(
          makeProduct({
            name: "Composite Resin Kit",
            active: true,
            brand: "MARK3",
            manufacturer: "MARK3 Dental",
            manufacturerCode: "MK-1001",
            barcode: 123456789012,
            barcodeFormats: "UPC-A",
            type: "Consumable",
            sds: "SDS-001",
            dentalLicenseRequired: "Yes",
            categoryLevel1: "Restorative",
            categoryLevel2: "Composites",
            description: "A high-quality composite resin kit.",
            aboutProduct: "Great for anterior and posterior restorations.",
            manufacturerSiteProductPage: "https://example.com/product/mk-1001",
            createdDate: "2026-01-10T09:00:00Z",
            length: 10,
            width: 5,
            height: 2,
            distanceUnit: "cm",
            weight: 0.5,
            massUnit: "kg",
          }),
        ),
      ),
      http.get(USER_PRODUCT_URL, () =>
        HttpResponse.json(
          makeUserProductDetailResponse({
            skuCode: "SKU-RESIN",
            price: 89.99,
            oldPrice: 99.99,
            discount: 10,
            stock: 42,
            sellCount: 7,
            shipmentFee: 12.5,
            heavyShippingSurcharge: 30,
          }),
        ),
      ),
    )

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Composite Resin Kit")
    expect(dialog.getByText("Active")).toBeInTheDocument()

    // Category breadcrumb
    expect(dialog.getByText("Restorative")).toBeInTheDocument()
    expect(dialog.getByText("Composites")).toBeInTheDocument()

    // Spec grid
    expect(dialog.getByText("MARK3")).toBeInTheDocument()
    expect(dialog.getByText("MARK3 Dental")).toBeInTheDocument()
    expect(dialog.getByText("MK-1001")).toBeInTheDocument()
    expect(dialog.getByText("123456789012")).toBeInTheDocument()
    expect(dialog.getByText("UPC-A")).toBeInTheDocument()
    expect(dialog.getByText("Consumable")).toBeInTheDocument()
    expect(dialog.getByText("SDS-001")).toBeInTheDocument()
    expect(dialog.getByText("SKU-RESIN")).toBeInTheDocument()
    // License required renders exactly "Yes" (not the raw backend value)
    const licenseValue = dialog.getByText("License required").closest("div")
    expect(licenseValue).not.toBeNull()
    expect(within(licenseValue as HTMLElement).getByText("Yes")).toBeInTheDocument()

    // Description AND about-product both render when both are present
    expect(dialog.getByText("A high-quality composite resin kit.")).toBeInTheDocument()
    expect(dialog.getByText("Great for anterior and posterior restorations.")).toBeInTheDocument()

    // Vendor listing metrics
    expect(dialog.getByText("$89.99")).toBeInTheDocument()
    expect(dialog.getByText("$99.99")).toBeInTheDocument()
    expect(dialog.getByText("10%")).toBeInTheDocument()
    expect(dialog.getByText("42")).toBeInTheDocument()
    expect(dialog.getByText("7")).toBeInTheDocument()
    expect(dialog.getByText("$12.50")).toBeInTheDocument()
    expect(dialog.getByText("$30.00")).toBeInTheDocument()

    // Shipping & dimensions
    expect(dialog.getByText("10 cm")).toBeInTheDocument()
    expect(dialog.getByText("5 cm")).toBeInTheDocument()
    expect(dialog.getByText("2 cm")).toBeInTheDocument()
    expect(dialog.getByText("0.5 kg")).toBeInTheDocument()

    // Manufacturer page link
    const link = dialog.getByRole("link", { name: /Manufacturer page/ })
    expect(link).toHaveAttribute("href", "https://example.com/product/mk-1001")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")

    // Created date, formatted
    expect(dialog.getByText("Jan 10, 2026")).toBeInTheDocument()

    // Product id / user product id footer
    expect(dialog.getByText("p-1")).toBeInTheDocument()
    expect(dialog.getByText("up-1")).toBeInTheDocument()
  })

  it("shows the inactive badge for an inactive product", async () => {
    server.use(http.get(PRODUCT_URL, () => HttpResponse.json(makeProduct({ active: false }))))

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    expect(await dialog.findByText("Inactive")).toBeInTheDocument()
  })

  it("hides the manufacturer page link when the URL is not http(s)", async () => {
    server.use(
      http.get(PRODUCT_URL, () =>
        HttpResponse.json(makeProduct({ manufacturerSiteProductPage: "javascript:alert(1)" })),
      ),
    )

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Brand")
    expect(dialog.queryByRole("link", { name: /Manufacturer page/ })).not.toBeInTheDocument()
  })

  it("renders 'Invalid Date' instead of crashing when createdDate is not a real date", async () => {
    server.use(http.get(PRODUCT_URL, () => HttpResponse.json(makeProduct({ createdDate: "not-a-real-date" }))))

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Brand")
    // `new Date("not-a-real-date")` is a valid Date object whose toLocaleDateString() is the
    // literal string "Invalid Date" - it does not throw, so the rest of the modal still renders.
    expect(dialog.getByText("Invalid Date")).toBeInTheDocument()
  })

  it("renders only the description section when aboutProduct is absent, and vice versa", async () => {
    server.use(
      http.get(PRODUCT_URL, () =>
        HttpResponse.json(makeProduct({ description: "Just a description.", aboutProduct: undefined })),
      ),
    )

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    expect(await dialog.findByText("Just a description.")).toBeInTheDocument()
    expect(dialog.queryByText("About this product")).not.toBeInTheDocument()
  })

  /**
   * C-axis: every field in this grid is rendered straight from the backend response with no
   * transformation beyond `String(...)` / `??`. `null`, `undefined`, a missing field and the
   * legitimate falsy value `0` must all render as readable text — never crash, never blank out
   * the rest of the modal.
   */
  it.each([
    [
      "null fields",
      {
        brand: null,
        manufacturer: null,
        manufacturerCode: null,
        barcode: null,
        sds: null,
      } as unknown as Partial<Product>,
    ],
    [
      "undefined fields",
      { brand: undefined, manufacturer: undefined, manufacturerCode: undefined, barcode: undefined, sds: undefined },
    ],
    ["empty-string fields", { brand: "", manufacturer: "", manufacturerCode: "", sds: "" }],
  ])("renders a dash instead of crashing when spec fields are %s", async (_label, overrides) => {
    server.use(http.get(PRODUCT_URL, () => HttpResponse.json(makeProduct(overrides))))

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Brand")
    // At least the untouched labels are present and nothing throws during render.
    expect(dialog.getAllByText("—").length).toBeGreaterThan(0)
  })

  it("renders barcode 0 as the digit, not as the empty-value dash", async () => {
    server.use(http.get(PRODUCT_URL, () => HttpResponse.json(makeProduct({ barcode: 0 }))))

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Brand")
    const barcodeValue = dialog.getByText("Barcode").closest("div")
    expect(within(barcodeValue as HTMLElement).getByText("0")).toBeInTheDocument()
  })

  it("renders a very large barcode number without truncation or scientific notation", async () => {
    server.use(http.get(PRODUCT_URL, () => HttpResponse.json(makeProduct({ barcode: 99999999999999 }))))

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    expect(await dialog.findByText("99999999999999")).toBeInTheDocument()
  })

  it("does not render a category breadcrumb when every category level is missing", async () => {
    server.use(
      http.get(PRODUCT_URL, () =>
        HttpResponse.json(
          makeProduct({
            categoryLevel1: undefined,
            categoryLevel2: undefined,
            categoryLevel3: undefined,
            categoryLevel4: undefined,
            categoryLevel5: undefined,
          }),
        ),
      ),
    )

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    // Renders without a breadcrumb and without crashing when every category level is absent.
    await dialog.findByText("Brand")
    expect(dialog.queryByText("Restorative")).not.toBeInTheDocument()
  })

  it("hides the heavy shipping fee metric entirely when the surcharge is missing", async () => {
    server.use(
      http.get(USER_PRODUCT_URL, () =>
        HttpResponse.json(makeUserProductDetailResponse({ heavyShippingSurcharge: undefined })),
      ),
    )

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Brand")
    expect(dialog.queryByText("Heavy shipping fee")).not.toBeInTheDocument()
  })

  it("hides the heavy shipping fee metric entirely when the surcharge is zero", async () => {
    server.use(
      http.get(USER_PRODUCT_URL, () => HttpResponse.json(makeUserProductDetailResponse({ heavyShippingSurcharge: 0 }))),
    )

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Brand")
    expect(dialog.queryByText("Heavy shipping fee")).not.toBeInTheDocument()
  })

  it("shows the heavy shipping fee metric with the formatted amount when the surcharge is positive", async () => {
    server.use(
      http.get(USER_PRODUCT_URL, () =>
        HttpResponse.json(makeUserProductDetailResponse({ heavyShippingSurcharge: 30 })),
      ),
    )

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    const heavyValue = (await dialog.findByText("Heavy shipping fee")).closest("div")
    expect(within(heavyValue as HTMLElement).getByText("$30.00")).toBeInTheDocument()
  })

  it('shows the em dash for a zero discount instead of "0%"', async () => {
    server.use(http.get(USER_PRODUCT_URL, () => HttpResponse.json(makeUserProductDetailResponse({ discount: 0 }))))

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    const discountValue = (await dialog.findByText("Discount")).closest("div")
    expect(within(discountValue as HTMLElement).getByText("—")).toBeInTheDocument()
  })

  it("renders a metric without a trailing unit when the unit is missing", async () => {
    server.use(http.get(PRODUCT_URL, () => HttpResponse.json(makeProduct({ length: 15, distanceUnit: undefined }))))

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Shipping & dimensions")
    const lengthValue = dialog.getByText("Length").closest("div")
    expect(within(lengthValue as HTMLElement).getByText("15")).toBeInTheDocument()
  })

  it("shows a dash for shipping dimensions that are zero or missing", async () => {
    server.use(
      http.get(PRODUCT_URL, () =>
        HttpResponse.json(makeProduct({ length: 0, width: undefined, height: 0, weight: undefined })),
      ),
    )

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Shipping & dimensions")
    const lengthValue = dialog.getByText("Length").closest("div")
    expect(within(lengthValue as HTMLElement).getByText("—")).toBeInTheDocument()
  })
})

describe("Vendor ProductDetailModal — photo gallery", () => {
  it("shows the placeholder icon instead of an image when the product has no photos", async () => {
    server.use(
      http.get(PRODUCT_URL, () => HttpResponse.json(makeProduct({ coverPhotoPath: undefined, photoPhats: [] }))),
    )

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Brand")
    expect(dialog.queryByRole("img")).not.toBeInTheDocument()
  })

  it("does not render a thumbnail strip when there is only one distinct photo", async () => {
    server.use(
      http.get(PRODUCT_URL, () =>
        HttpResponse.json(makeProduct({ coverPhotoPath: "/uploads/a.png", photoPhats: ["/uploads/a.png"] })),
      ),
    )

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Brand")
    // Only the large active-photo image renders - no thumbnail strip for a single distinct photo.
    expect(dialog.getAllByRole("img")).toHaveLength(1)
  })

  it("shows just the cover photo without crashing when photoPhats is missing entirely", async () => {
    server.use(
      http.get(PRODUCT_URL, () =>
        HttpResponse.json(makeProduct({ coverPhotoPath: "/uploads/cover.png", photoPhats: undefined })),
      ),
    )

    renderModal()

    const dialogElement = await screen.findByRole("dialog")
    const dialog = within(dialogElement)
    await dialog.findByText("Brand")
    expect(dialogElement.querySelectorAll("img")).toHaveLength(1)
  })

  it("filters out empty-string entries in photoPhats instead of rendering a blank thumbnail", async () => {
    server.use(
      http.get(PRODUCT_URL, () =>
        HttpResponse.json(
          makeProduct({
            coverPhotoPath: "/uploads/cover.png",
            // Hostile backend data: an empty string and a repeat of the cover photo mixed into
            // the array alongside one genuinely distinct photo.
            photoPhats: ["", "/uploads/cover.png", "/uploads/second.png"],
          }),
        ),
      ),
    )

    renderModal()

    const dialogElement = await screen.findByRole("dialog")
    const dialog = within(dialogElement)
    await dialog.findByText("Brand")

    // The empty string and the cover-photo repeat are both dropped from the extra photos, so the
    // gallery ends up with exactly two distinct photos (cover + second) - 1 large image + 2
    // thumbnails (the strip includes the cover itself) = 3 <img> tags, not a blank thumbnail for
    // the empty string or a duplicate for the repeated cover path.
    expect(dialogElement.querySelectorAll("img")).toHaveLength(3)
  })

  it("renders a thumbnail per distinct photo and switches the active photo on click", async () => {
    const user = (await import("@testing-library/user-event")).default.setup()
    server.use(
      http.get(PRODUCT_URL, () =>
        HttpResponse.json(
          makeProduct({
            coverPhotoPath: "/uploads/cover.png",
            photoPhats: ["/uploads/cover.png", "/uploads/second.png", "/uploads/third.png"],
          }),
        ),
      ),
    )

    renderModal()

    const dialogElement = await screen.findByRole("dialog")
    const dialog = within(dialogElement)
    await dialog.findByText("Brand")

    // Thumbnails carry `alt=""`, which the accessibility tree treats as decorative (implicit
    // role="presentation"), so only the large photo (alt=product.name) shows up via getByRole -
    // count raw <img> tags instead: 1 large image + 3 thumbnails (cover + 2 more, duplicate cover
    // filtered out of the strip). Radix portals the dialog outside the render container, so the
    // dialog element itself (not `container`) has to be the query root.
    expect(dialogElement.querySelectorAll("img")).toHaveLength(4)
    expect(dialog.getAllByRole("img")).toHaveLength(1)

    const thumbnailButtons = dialog.getAllByRole("button").filter((button) => button.querySelector("img"))
    expect(thumbnailButtons).toHaveLength(3)

    await user.click(thumbnailButtons[1] as HTMLElement)
    // Switching thumbnails re-renders the large image; the gallery must not crash and must still
    // show exactly one large photo plus the thumbnail strip.
    expect(dialogElement.querySelectorAll("img")).toHaveLength(4)
  })

  it("falls back to the placeholder icon when the active photo fails to load", async () => {
    server.use(
      http.get(PRODUCT_URL, () =>
        HttpResponse.json(makeProduct({ coverPhotoPath: "/uploads/broken.png", photoPhats: [] })),
      ),
    )

    renderModal()

    const dialog = within(await screen.findByRole("dialog"))
    await dialog.findByText("Brand")
    const image = dialog.getByRole("img")

    image.dispatchEvent(new Event("error", { bubbles: false }))

    await waitFor(() => expect(dialog.queryByRole("img")).not.toBeInTheDocument())
  })
})
