import { HttpResponse, http } from "msw"
import { makeAccountUser, makeAddress, makeCompanyProfile, makeLicense } from "@/test/factories/user.factory"

export const accountHandlers = [
  // ==================== Account ====================
  http.put("*/backend-api/users/me", () => HttpResponse.json(makeAccountUser())),

  // ==================== Company ====================
  http.get("*/backend-api/companies/me", () => HttpResponse.json(makeCompanyProfile())),

  http.put("*/backend-api/companies/me", () => HttpResponse.json(makeCompanyProfile())),

  http.post("*/backend-api/mail/invite-company-user", () => new HttpResponse(null, { status: 200 })),

  // ==================== Licenses ====================
  http.get("*/backend-api/licenses", () => HttpResponse.json({ licenses: [makeLicense()], total: 1 })),

  http.post("*/backend-api/licenses", () => HttpResponse.json(makeLicense())),

  http.delete("*/backend-api/licenses/:id", () => new HttpResponse(null, { status: 200 })),

  // ==================== Address ====================
  http.get("*/backend-api/address/:id", ({ params }) => HttpResponse.json(makeAddress({ id: String(params.id) }))),

  http.get("*/backend-api/address", () => HttpResponse.json([makeAddress()])),

  http.post("*/backend-api/address", () => HttpResponse.json(makeAddress())),

  http.put("*/backend-api/address/:id", ({ params }) => HttpResponse.json(makeAddress({ id: String(params.id) }))),

  http.delete("*/backend-api/address/:id", () => new HttpResponse(null, { status: 200 })),
]
