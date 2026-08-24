import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeCompanyListItem, makeVendorListItem } from "@/test/factories"
import { ApiRequestError } from "./request"
import {
  addVendorFavorite,
  getCompanies,
  getMyFavoriteVendorIds,
  getMyFavoriteVendors,
  getVendors,
  removeVendorFavorite,
} from "./vendors"

const vendor = makeVendorListItem()
const company = makeCompanyListItem()

let capturedVendorsQuery: URLSearchParams | null = null
let capturedCompaniesQuery: URLSearchParams | null = null

beforeEach(() => {
  capturedVendorsQuery = null
  capturedCompaniesQuery = null

  server.use(
    http.get("*/backend-api/vendors/favorite-ids", () => HttpResponse.json(["vendor-1", "vendor-2"])),
    http.get("*/backend-api/vendors/favorites", () => HttpResponse.json([vendor])),
    http.post("*/backend-api/vendors/:vendorId/favorite", () => new HttpResponse(null, { status: 200 })),
    http.delete("*/backend-api/vendors/:vendorId/favorite", () => new HttpResponse(null, { status: 200 })),
    http.get("*/backend-api/vendors/companies", ({ request }) => {
      capturedCompaniesQuery = new URL(request.url).searchParams
      return HttpResponse.json({ companies: [company], totalCount: 1, page: 0, size: 10, totalPages: 1 })
    }),
    http.get("*/backend-api/vendors", ({ request }) => {
      capturedVendorsQuery = new URL(request.url).searchParams
      return HttpResponse.json({ vendors: [vendor], totalCount: 1, page: 0, size: 10, totalPages: 1 })
    }),
  )
})

describe("getMyFavoriteVendorIds / getMyFavoriteVendors contract", () => {
  it("returns the favorite id list", async () => {
    const ids = await getMyFavoriteVendorIds()

    expect(ids).toEqual(["vendor-1", "vendor-2"])
  })

  it("tolerates an empty favorite id list", async () => {
    server.use(http.get("*/backend-api/vendors/favorite-ids", () => HttpResponse.json([])))

    expect(await getMyFavoriteVendorIds()).toEqual([])
  })

  it("returns the typed favorite vendor list", async () => {
    const vendors = await getMyFavoriteVendors()

    expect(vendors).toEqual([vendor])
  })

  it("tolerates an empty favorite vendor list", async () => {
    server.use(http.get("*/backend-api/vendors/favorites", () => HttpResponse.json([])))

    expect(await getMyFavoriteVendors()).toEqual([])
  })

  it("rejects favorite-ids fetch with a 401, marking the error auth-handled", async () => {
    server.use(
      http.get("*/backend-api/vendors/favorite-ids", () =>
        HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
      ),
    )

    const error = await getMyFavoriteVendorIds().catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.status).toBe(401)
    expect(error.authHandled).toBe(true)
  })
})

describe("addVendorFavorite / removeVendorFavorite idempotency contract", () => {
  it("adding a vendor that is not yet a favorite resolves on 200", async () => {
    await expect(addVendorFavorite("vendor-3")).resolves.toBeUndefined()
  })

  it(
    "adding a vendor that is already a favorite propagates the backend's 409 as-is - the client " +
      "performs no client-side idempotency check before POSTing",
    async () => {
      server.use(
        http.post("*/backend-api/vendors/:vendorId/favorite", () =>
          HttpResponse.json({ message: "Vendor is already a favorite" }, { status: 409 }),
        ),
      )

      const error = await addVendorFavorite("vendor-1").catch((e) => e)

      expect(error).toBeInstanceOf(ApiRequestError)
      expect(error.status).toBe(409)
      expect(error.message).toBe("Vendor is already a favorite")
    },
  )

  it("removing a vendor that is currently a favorite resolves on 200", async () => {
    await expect(removeVendorFavorite("vendor-1")).resolves.toBeUndefined()
  })

  it(
    "removing a vendor that is NOT a favorite propagates whatever status the backend returns - " +
      "there is no client-side guard making this a silent no-op",
    async () => {
      server.use(
        http.delete("*/backend-api/vendors/:vendorId/favorite", () =>
          HttpResponse.json({ message: "Vendor is not a favorite" }, { status: 404 }),
        ),
      )

      const error = await removeVendorFavorite("vendor-not-a-favorite").catch((e) => e)

      expect(error).toBeInstanceOf(ApiRequestError)
      expect(error.status).toBe(404)
    },
  )

  it("adding a favorite rejects with a 401 and marks the error auth-handled", async () => {
    server.use(
      http.post("*/backend-api/vendors/:vendorId/favorite", () =>
        HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
      ),
    )

    const error = await addVendorFavorite("vendor-1").catch((e) => e)

    expect(error.status).toBe(401)
    expect(error.authHandled).toBe(true)
  })

  it("adding a favorite rejects on a network failure", async () => {
    server.use(http.post("*/backend-api/vendors/:vendorId/favorite", () => HttpResponse.error()))

    await expect(addVendorFavorite("vendor-1")).rejects.toBeInstanceOf(ApiRequestError)
  })
})

describe("getVendors / getCompanies query serialization contract", () => {
  it("only sets params that were provided (0-indexed page, no defaults injected)", async () => {
    await getVendors({})

    expect(capturedVendorsQuery?.has("page")).toBe(false)
    expect(capturedVendorsQuery?.has("size")).toBe(false)
    expect(capturedVendorsQuery?.has("sort")).toBe(false)
    expect(capturedVendorsQuery?.has("minRating")).toBe(false)
    expect(capturedVendorsQuery?.has("search")).toBe(false)
  })

  it("serializes page as 0-indexed (page 0 is sent, not omitted or shifted to 1)", async () => {
    await getVendors({ page: 0, size: 20 })

    expect(capturedVendorsQuery?.get("page")).toBe("0")
    expect(capturedVendorsQuery?.get("size")).toBe("20")
  })

  it("serializes sort, minRating and search filters", async () => {
    await getVendors({ page: 2, sort: "rating", minRating: 4, search: "gloves" })

    expect(capturedVendorsQuery?.get("page")).toBe("2")
    expect(capturedVendorsQuery?.get("sort")).toBe("rating")
    expect(capturedVendorsQuery?.get("minRating")).toBe("4")
    expect(capturedVendorsQuery?.get("search")).toBe("gloves")
  })

  it("omits an empty search string rather than sending search=", async () => {
    await getVendors({ search: "" })

    expect(capturedVendorsQuery?.has("search")).toBe(false)
  })

  it("returns the typed vendor page and totalPages/totalCount", async () => {
    const response = await getVendors({ page: 0 })

    expect(response.vendors).toEqual([vendor])
    expect(response.totalCount).toBe(1)
    expect(response.totalPages).toBe(1)
  })

  it("serializes the same params for getCompanies", async () => {
    await getCompanies({ page: 1, size: 5, sort: "name", minRating: 3.5, search: "acme" })

    expect(capturedCompaniesQuery?.get("page")).toBe("1")
    expect(capturedCompaniesQuery?.get("size")).toBe("5")
    expect(capturedCompaniesQuery?.get("sort")).toBe("name")
    expect(capturedCompaniesQuery?.get("minRating")).toBe("3.5")
    expect(capturedCompaniesQuery?.get("search")).toBe("acme")
  })

  it("returns the typed company page", async () => {
    const response = await getCompanies({})

    expect(response.companies).toEqual([company])
  })

  it("tolerates an empty vendor/company list", async () => {
    server.use(
      http.get("*/backend-api/vendors", () =>
        HttpResponse.json({ vendors: [], totalCount: 0, page: 0, size: 10, totalPages: 0 }),
      ),
    )

    const response = await getVendors({})
    expect(response.vendors).toEqual([])
  })

  it("rejects getVendors with a 500 server error", async () => {
    server.use(http.get("*/backend-api/vendors", () => HttpResponse.json({ message: "Server error" }, { status: 500 })))

    await expect(getVendors({})).rejects.toMatchObject({ status: 500 })
  })

  it("rejects getCompanies on a network failure", async () => {
    server.use(http.get("*/backend-api/vendors/companies", () => HttpResponse.error()))

    await expect(getCompanies({})).rejects.toBeInstanceOf(ApiRequestError)
  })

  it("supports request cancellation via AbortSignal", async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(getVendors({ signal: controller.signal })).rejects.toBeDefined()
  })
})
