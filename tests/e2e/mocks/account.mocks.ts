import { makeAccountUser, makeAddress, makeCompanyProfile, makeLicense } from "@/test/factories/user.factory"
import type { ApiMock } from "../fixtures/api-mock.fixture"

/**
 * Mirrors src/mocks/handlers/account.handlers.ts, EXCEPT:
 *  - `GET /backend-api/licenses` - the handler wraps `makeLicense()` in a
 *    `{ licenses: [...], total: 1 }` object literally written in the handler
 *    file (no `makeLicensesResponse`-style factory is exported). Registering
 *    a hand-copied `{ total: 1 }` here would be a second, driftable source of
 *    truth. See the Faz 8.1 infra report's "missing exports" list.
 */
export function registerAccountMocks(apiMock: ApiMock) {
  apiMock.on("PUT", "/backend-api/users/me", () => ({ body: makeAccountUser() }))

  apiMock.on("GET", "/backend-api/companies/me", () => ({ body: makeCompanyProfile() }))
  apiMock.on("PUT", "/backend-api/companies/me", () => ({ body: makeCompanyProfile() }))
  apiMock.on("POST", "/backend-api/mail/invite-company-user", () => ({ status: 200 }))

  apiMock.on("POST", "/backend-api/licenses", () => ({ body: makeLicense() }))
  apiMock.on("DELETE", "/backend-api/licenses/:id", () => ({ status: 200 }))

  // Static path registered before the `:id` wildcard - same segment count.
  apiMock.on("GET", "/backend-api/address", () => ({ body: [makeAddress()] }))
  apiMock.on("GET", "/backend-api/address/:id", ({ params }) => ({ body: makeAddress({ id: params.id }) }))
  apiMock.on("POST", "/backend-api/address", () => ({ body: makeAddress() }))
  apiMock.on("PUT", "/backend-api/address/:id", ({ params }) => ({ body: makeAddress({ id: params.id }) }))
  apiMock.on("DELETE", "/backend-api/address/:id", () => ({ status: 200 }))
}
