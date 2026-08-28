import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeLicense } from "@/test/factories"
import { type CreateLicensePayload, licenseAPI } from "./licenses"

const approvedLicense = makeLicense({ id: "license-1", approved: true })
const pendingLicense = makeLicense({ id: "license-2", licenseType: "DEA", stateOfLicense: null, approved: null })
const rejectedLicense = makeLicense({
  id: "license-3",
  approved: false,
  rejectDescription: "Illegible scan, please re-upload",
})
const expiredLicense = makeLicense({ id: "license-4", expired: true, approved: true })

let capturedCreateBody: CreateLicensePayload | null = null
let capturedDeleteUrl: string | null = null

beforeEach(() => {
  capturedCreateBody = null
  capturedDeleteUrl = null

  server.use(
    http.get("*/backend-api/licenses", () =>
      HttpResponse.json({ licenses: [approvedLicense, pendingLicense, rejectedLicense, expiredLicense], total: 4 }),
    ),
    http.post("*/backend-api/licenses", async ({ request }) => {
      capturedCreateBody = (await request.json()) as CreateLicensePayload
      return HttpResponse.json(pendingLicense)
    }),
    http.delete("*/backend-api/licenses/:id", ({ request }) => {
      capturedDeleteUrl = request.url
      return new HttpResponse(null, { status: 200 })
    }),
  )
})

describe("licenseAPI.getLicenses contract", () => {
  /**
   * Infra note #26: a malformed 200 is not always null/undefined - it can be a wrong-typed
   * truthy value that slips past `||`/`??` and reaches `.length`/`.map()`/`.some()` in the UI,
   * blanking the page. Normalising here protects every call site at once.
   */
  it.each([
    ["an object", { nope: true }],
    ["a string", "not-a-list"],
    ["a number", 7],
    ["null", null],
  ])("%s in place of the list degrades to an empty array", async (_label, body) => {
    server.use(http.get("*/backend-api/licenses", () => HttpResponse.json({ licenses: body, total: 0 })))

    await expect(licenseAPI.getLicenses()).resolves.toEqual([])
  })

  it("unwraps the licenses array from the paged envelope", async () => {
    const licenses = await licenseAPI.getLicenses()

    expect(licenses).toHaveLength(4)
    expect(licenses[0]).toEqual(approvedLicense)
  })

  it("represents approved, pending, rejected, and expired license states distinctly", async () => {
    const licenses = await licenseAPI.getLicenses()

    const [approved, pending, rejected, expired] = licenses
    expect(approved?.approved).toBe(true)
    expect(pending?.approved).toBeNull()
    expect(pending?.stateOfLicense).toBeNull()
    expect(rejected?.approved).toBe(false)
    expect(rejected?.rejectDescription).toBe("Illegible scan, please re-upload")
    expect(expired?.expired).toBe(true)
  })

  it("tolerates an empty license list", async () => {
    server.use(http.get("*/backend-api/licenses", () => HttpResponse.json({ licenses: [], total: 0 })))

    const licenses = await licenseAPI.getLicenses()

    expect(licenses).toEqual([])
  })

  it("rejects with a 401 on an expired session", async () => {
    server.use(
      http.get("*/backend-api/licenses", () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 })),
    )

    const error = await licenseAPI.getLicenses().catch((e) => e)

    expect(error.response?.status).toBe(401)
    expect(error.authHandled).toBe(true)
  })

  it("rejects with a 500 server error", async () => {
    server.use(
      http.get("*/backend-api/licenses", () => HttpResponse.json({ message: "Server error" }, { status: 500 })),
    )

    await expect(licenseAPI.getLicenses()).rejects.toThrow(/500/)
  })

  it("rejects on a network failure", async () => {
    server.use(http.get("*/backend-api/licenses", () => HttpResponse.error()))

    await expect(licenseAPI.getLicenses()).rejects.toThrow()
  })
})

describe("licenseAPI.createLicense contract", () => {
  it("sends the exact STATE_DENTAL payload shape and returns the created license", async () => {
    const payload: CreateLicensePayload = {
      licenseType: "STATE_DENTAL",
      stateOfLicense: "NY",
      licenseNumber: "DDS-123456",
      year: 2024,
      month: 6,
      day: 15,
    }

    const license = await licenseAPI.createLicense(payload)

    expect(capturedCreateBody).toEqual(payload)
    expect(license).toEqual(pendingLicense)
  })

  it("sends a DEA payload without stateOfLicense", async () => {
    const payload: CreateLicensePayload = {
      licenseType: "DEA",
      licenseNumber: "DEA-9988",
      year: 2025,
      month: 1,
      day: 1,
    }

    await licenseAPI.createLicense(payload)

    expect(capturedCreateBody).toEqual(payload)
    expect(capturedCreateBody).not.toHaveProperty("stateOfLicense")
  })

  it("rejects with a 400 for an invalid license number", async () => {
    server.use(
      http.post("*/backend-api/licenses", () =>
        HttpResponse.json({ message: "Invalid license number" }, { status: 400 }),
      ),
    )

    await expect(
      licenseAPI.createLicense({ licenseType: "DEA", licenseNumber: "bad", year: 2024, month: 1, day: 1 }),
    ).rejects.toThrow(/400/)
  })

  it("rejects with a 400 when stateOfLicense is missing for STATE_DENTAL", async () => {
    // LicenseService.validateCreateRequest (ecommerce-api order/service/LicenseService.java) has
    // no duplicate-license-number check anywhere - createLicense never queries for an existing
    // license before saving, so a 409 for "duplicate license number" can never happen. The only
    // create-time business-rule failure is LicenseValidationException (mapped to 400 in
    // OrderExceptionHandler.java), thrown when a STATE_DENTAL license is missing
    // `stateOfLicense`.
    server.use(
      http.post("*/backend-api/licenses", () =>
        HttpResponse.json({ message: "stateOfLicense is required when licenseType is STATE_DENTAL" }, { status: 400 }),
      ),
    )

    const error = await licenseAPI
      .createLicense({ licenseType: "STATE_DENTAL", licenseNumber: "DDS-1", year: 2024, month: 1, day: 1 })
      .catch((e) => e)

    expect(error.response?.status).toBe(400)
  })
})

describe("licenseAPI.deleteLicense contract", () => {
  it("calls DELETE with the license id in the path", async () => {
    await licenseAPI.deleteLicense("license-1")

    expect(capturedDeleteUrl).toContain("/licenses/license-1")
  })

  it("rejects with a 404 when the license does not exist", async () => {
    server.use(
      http.delete("*/backend-api/licenses/:id", () => HttpResponse.json({ message: "Not found" }, { status: 404 })),
    )

    await expect(licenseAPI.deleteLicense("missing")).rejects.toThrow(/404/)
  })

  it("rejects with a 404 when the license belongs to another user (indistinguishable from not-found)", async () => {
    // LicenseService.deleteLicense looks up `findByIdAndUserIdAndIsDeletedFalse(licenseId,
    // userId)` in one query - a license that exists but belongs to someone else produces the
    // exact same empty Optional, and thus the exact same LicenseNotFoundException -> 404, as a
    // license that doesn't exist at all. There is no separate 403 code path.
    server.use(
      http.delete("*/backend-api/licenses/:id", () =>
        HttpResponse.json({ message: "License bulunamadı: someone-elses" }, { status: 404 }),
      ),
    )

    const error = await licenseAPI.deleteLicense("someone-elses").catch((e) => e)

    expect(error.response?.status).toBe(404)
    expect(error.authHandled).toBeFalsy()
  })
})
