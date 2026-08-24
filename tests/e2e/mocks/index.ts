import type { ApiMock } from "../fixtures/api-mock.fixture"
import { registerAccountMocks } from "./account.mocks"
import { registerAutoOrdersMocks } from "./auto-orders.mocks"
import { registerCartMocks } from "./cart.mocks"
import { registerOrdersMocks } from "./orders.mocks"
import { registerPaymentsMocks } from "./payments.mocks"
import { registerProductsMocks } from "./products.mocks"
import { registerShipmentMocks } from "./shipment.mocks"
import { registerVendorMocks } from "./vendor.mocks"

/**
 * Faz 8.1 - registers every apiMock route that can be safely derived from an
 * EXPORTED factory in src/test/factories/** (single source of truth), one
 * file per src/mocks/handlers/*.handlers.ts file. Routes whose handler
 * builds its response from data that isn't exported anywhere are
 * intentionally NOT registered - see each domain file's header comment and
 * the "missing exports" list in the Faz 8.1 infra report.
 *
 * Calling an unregistered route under `apiMock` (see ./fixtures/api-mock.fixture.ts)
 * fails the test with a clear 599 instead of silently succeeding - so a POM/
 * spec author who hits a gap here will find out immediately, not via a
 * flaky/false-positive test.
 */
export function registerAllMocks(apiMock: ApiMock) {
  registerAccountMocks(apiMock)
  registerAutoOrdersMocks(apiMock)
  registerCartMocks(apiMock)
  registerOrdersMocks(apiMock)
  registerPaymentsMocks(apiMock)
  registerProductsMocks(apiMock)
  registerShipmentMocks(apiMock)
  registerVendorMocks(apiMock)
}
