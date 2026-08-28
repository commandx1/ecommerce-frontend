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

  it("rejects with a 400 when the new tax number already belongs to another company", async () => {
    // CompanyService.updateMyCompany (ecommerce-api auth/service/CompanyService.java) has no tax
    // number *format* validation at all (CompanyUpdateRequest.taxNumber carries no
    // constraint), so a merely malformed value never 400s. The one real create-time conflict is
    // `companyRepository.existsByTaxNumber(newTaxNumber)` -> `new BadRequestException("Tax
    // number already exists")`, mapped 400 in GlobalExceptionHandler.
    server.use(
      http.put("*/backend-api/companies/me", () =>
        HttpResponse.json({ message: "Tax number already exists" }, { status: 400 }),
      ),
    )

    await expect(
      updateMyCompany({
        name: "Acme",
        companyPhoto: null,
        taxNumber: "999999999",
        email: null,
        phoneNumber: null,
        website: null,
        description: null,
      }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it("rejects with a 403 when the caller is not the company owner", async () => {
    // CompanyService.updateMyCompany: `if (user.getCompanyRole() != CompanyRole.OWNER) throw new
    // ForbiddenException("Only the company owner can update company details")`. Unlike the mail
    // invite endpoint, ForbiddenException (product/exception/ForbiddenException.java) IS mapped
    // to 403 in GlobalExceptionHandler - so a real 403 is reachable here.
    server.use(
      http.put("*/backend-api/companies/me", () =>
        HttpResponse.json({ message: "Only the company owner can update company details" }, { status: 403 }),
      ),
    )

    const error = await updateMyCompany({
      name: "Acme",
      companyPhoto: null,
      taxNumber: null,
      email: null,
      phoneNumber: null,
      website: null,
      description: null,
    }).catch((e) => e)

    expect(error.status).toBe(403)
    expect(error.authHandled).toBe(false)
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

  it("rejects with a 400 when the email already belongs to a registered user", async () => {
    // UserService.inviteCompanyUser (UserService.java:348-350) throws a plain
    // `new RuntimeException("This email already belongs to a registered user.")` when the
    // invited email already has a confirmed account. There is no dedicated conflict exception
    // anywhere in this method - every failure branch is a bare RuntimeException, so the
    // GlobalExceptionHandler catch-all always answers 400, never 409.
    server.use(
      http.post("*/backend-api/mail/invite-company-user", () =>
        HttpResponse.json({ message: "This email already belongs to a registered user." }, { status: 400 }),
      ),
    )

    await expect(inviteCompanyUser({ email: "existing@example.com", companyRole: "MEMBER" })).rejects.toMatchObject({
      status: 400,
      message: "This email already belongs to a registered user.",
    })
  })

  it("rejects with a 400 when the caller is not the company owner", async () => {
    // UserService.inviteCompanyUser (ecommerce-api auth/service/UserService.java:343-345) throws
    // a plain `new RuntimeException("Only company OWNER can invite members.")` for this case.
    // GlobalExceptionHandler has no dedicated handler for it, so it falls through to the
    // `@ExceptionHandler(RuntimeException.class)` catch-all, which returns 400 - not 403. (This
    // endpoint's `@PreAuthorize("hasRole('Vendor')")` on MailController.java:48 also can't
    // surface a real 403: Spring's AccessDeniedException is itself a RuntimeException, so the
    // same catch-all intercepts it before Spring Security's own 403 handling ever runs. No
    // custom `AccessDeniedException` handler exists for this controller, unlike order/cart/
    // invoice's dedicated *AccessDeniedException -> 403 mappings.)
    server.use(
      http.post("*/backend-api/mail/invite-company-user", () =>
        HttpResponse.json({ message: "Only company OWNER can invite members." }, { status: 400 }),
      ),
    )

    const error = await inviteCompanyUser({ email: "x@example.com", companyRole: "MEMBER" }).catch((e) => e)

    expect(error.status).toBe(400)
    expect(error.authHandled).toBe(false)
  })

  it("rejects on a network failure", async () => {
    server.use(http.post("*/backend-api/mail/invite-company-user", () => HttpResponse.error()))

    await expect(inviteCompanyUser({ email: "x@example.com", companyRole: "MEMBER" })).rejects.toBeInstanceOf(
      ApiRequestError,
    )
  })
})
