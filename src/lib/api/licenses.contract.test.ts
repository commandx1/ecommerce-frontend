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

  it("rejects with a 409 for a duplicate license number", async () => {
    server.use(
      http.post("*/backend-api/licenses", () =>
        HttpResponse.json({ message: "License already registered" }, { status: 409 }),
      ),
    )

    const error = await licenseAPI
      .createLicense({ licenseType: "DEA", licenseNumber: "DEA-1", year: 2024, month: 1, day: 1 })
      .catch((e) => e)

    expect(error.response?.status).toBe(409)
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

  it("rejects with a 403 when the license belongs to another user", async () => {
    server.use(
      http.delete("*/backend-api/licenses/:id", () => HttpResponse.json({ message: "Forbidden" }, { status: 403 })),
    )

    const error = await licenseAPI.deleteLicense("someone-elses").catch((e) => e)

    expect(error.response?.status).toBe(403)
    expect(error.authHandled).toBeFalsy()
  })
})
