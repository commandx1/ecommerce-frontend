import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeCompanyProfile } from "@/test/factories"
import {
  getMyCompany,
  type InviteCompanyUserPayload,
  inviteCompanyUser,
  type UpdateCompanyPayload,
  updateMyCompany,
} from "./company"
import { ApiRequestError } from "./request"

const mockCompany = makeCompanyProfile()

let capturedPutBody: UpdateCompanyPayload | null = null
let capturedInviteBody: InviteCompanyUserPayload | null = null

beforeEach(() => {
  capturedPutBody = null
  capturedInviteBody = null

  server.use(
    http.get("*/backend-api/companies/me", () => HttpResponse.json(mockCompany)),
    http.put("*/backend-api/companies/me", async ({ request }) => {
      capturedPutBody = (await request.json()) as UpdateCompanyPayload
      return HttpResponse.json(mockCompany)
    }),
    http.post("*/backend-api/mail/invite-company-user", async ({ request }) => {
      capturedInviteBody = (await request.json()) as InviteCompanyUserPayload
      return new HttpResponse(null, { status: 200 })
    }),
  )
})

describe("getMyCompany contract", () => {
  it("returns the typed company profile", async () => {
    const response = await getMyCompany()

    expect(response).toEqual(mockCompany)
    expect(typeof response.id).toBe("string")
    expect(typeof response.active).toBe("boolean")
    expect(response.companyRole).toBe("OWNER")
  })

  it("tolerates a company with every nullable field null", async () => {
    server.use(
      http.get("*/backend-api/companies/me", () =>
        HttpResponse.json({
          ...mockCompany,
          companyPhoto: null,
          taxNumber: null,
          email: null,
          phoneNumber: null,
          website: null,
          description: null,
          companyRole: null,
        }),
      ),
    )

    const response = await getMyCompany()

    expect(response.companyPhoto).toBeNull()
    expect(response.companyRole).toBeNull()
  })

  it("rejects with a 401 and marks the error as auth-handled", async () => {
    server.use(
      http.get("*/backend-api/companies/me", () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 })),
    )

    const error = await getMyCompany().catch((e) => e)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.status).toBe(401)
    expect(error.authHandled).toBe(true)
  })

  it("rejects with a 404 when the caller has no company", async () => {
    server.use(
      http.get("*/backend-api/companies/me", () => HttpResponse.json({ message: "Not found" }, { status: 404 })),
    )

    await expect(getMyCompany()).rejects.toMatchObject({ status: 404 })
  })

  it("rejects on a network failure", async () => {
    server.use(http.get("*/backend-api/companies/me", () => HttpResponse.error()))

    await expect(getMyCompany()).rejects.toBeInstanceOf(ApiRequestError)
  })
})

describe("updateMyCompany contract", () => {
  it("sends the exact update payload shape and returns the updated profile", async () => {
    const payload: UpdateCompanyPayload = {
      name: "Acme Dental Supplies",
      companyPhoto: null,
      taxNumber: "1234567890",
      email: "billing@acmedental.example.com",
      phoneNumber: "+15551234567",
      website: "https://acmedental.example.com",
      description: "Wholesale dental supplies",
    }

    const response = await updateMyCompany(payload)

    expect(capturedPutBody).toEqual(payload)
    expect(response).toEqual(mockCompany)
  })

  it("rejects with a 400 on invalid payload", async () => {
    server.use(
      http.put("*/backend-api/companies/me", () =>
        HttpResponse.json({ message: "Invalid tax number" }, { status: 400 }),
      ),
    )

    await expect(
      updateMyCompany({
        name: "Acme",
        companyPhoto: null,
        taxNumber: "bad",
        email: null,
        phoneNumber: null,
        website: null,
        description: null,
      }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it("rejects with a 500 server error", async () => {
    server.use(
      http.put("*/backend-api/companies/me", () => HttpResponse.json({ message: "Server error" }, { status: 500 })),
    )

    await expect(
      updateMyCompany({
        name: "Acme",
        companyPhoto: null,
        taxNumber: null,
        email: null,
        phoneNumber: null,
        website: null,
        description: null,
      }),
    ).rejects.toMatchObject({ status: 500 })
  })
})

describe("inviteCompanyUser contract", () => {
  it("sends the exact invite payload with an invitable role", async () => {
    const payload: InviteCompanyUserPayload = { email: "new.member@example.com", companyRole: "MEMBER" }

    await inviteCompanyUser(payload)

    expect(capturedInviteBody).toEqual(payload)
  })

  it("sends the MANAGER role invite payload", async () => {
    const payload: InviteCompanyUserPayload = { email: "manager@example.com", companyRole: "MANAGER" }

    await inviteCompanyUser(payload)

    expect(capturedInviteBody).toEqual(payload)
  })

  it("rejects with a 400 for an invalid/non-invitable role sent by a stale client", async () => {
    server.use(
      http.post("*/backend-api/mail/invite-company-user", () =>
        HttpResponse.json({ message: "Invalid company role" }, { status: 400 }),
      ),
    )

    // The type system only allows MANAGER/MEMBER, but the wire contract is still validated
    // server-side; simulate a backend rejection to lock in current error propagation.
    await expect(inviteCompanyUser({ email: "x@example.com", companyRole: "MEMBER" })).rejects.toMatchObject({
      status: 400,
    })
  })

  it("rejects with a 409 when the email is already invited", async () => {
    server.use(
      http.post("*/backend-api/mail/invite-company-user", () =>
        HttpResponse.json({ message: "User already invited" }, { status: 409 }),
      ),
    )

    await expect(inviteCompanyUser({ email: "existing@example.com", companyRole: "MEMBER" })).rejects.toMatchObject({
      status: 409,
      message: "User already invited",
    })
  })

  it("rejects with a 403 when the caller is not the company owner", async () => {
    server.use(
      http.post("*/backend-api/mail/invite-company-user", () =>
        HttpResponse.json({ message: "Only owners may invite users" }, { status: 403 }),
      ),
    )

    const error = await inviteCompanyUser({ email: "x@example.com", companyRole: "MEMBER" }).catch((e) => e)

    expect(error.status).toBe(403)
    expect(error.authHandled).toBe(false)
  })

  it("rejects on a network failure", async () => {
    server.use(http.post("*/backend-api/mail/invite-company-user", () => HttpResponse.error()))

    await expect(inviteCompanyUser({ email: "x@example.com", companyRole: "MEMBER" })).rejects.toBeInstanceOf(
      ApiRequestError,
    )
  })
})
