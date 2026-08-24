import type { ApiMock } from "../fixtures/api-mock.fixture"

/**
 * src/mocks/handlers/shipment.handlers.ts defines its ONLY response
 * (`makeShipmentRatesResponse`, for `POST /backend-api/shipment/rates`) as a
 * private function inside the handler file itself - it is not exported from
 * any `@/test/factories/**` module. Per the "don't copy handler data by
 * hand" rule, there is nothing safe to reuse here.
 *
 * No-op for now, kept as an explicit file (rather than omitted) so the
 * 1:1 mapping with src/mocks/handlers/*.handlers.ts stays obvious and this
 * is the first place an Adım 2/3 author will look. See the Faz 8.1 infra
 * report's "missing exports" list - fixing this requires exporting a
 * `makeShipmentRatesResponse` factory from shipment.handlers.ts's own module
 * (or a shared factory file), which is a src/ change out of scope here.
 */
export function registerShipmentMocks(_apiMock: ApiMock) {
  // Intentionally empty.
}
