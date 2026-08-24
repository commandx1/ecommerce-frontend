import { HttpResponse, http } from "msw"
import type { ShipmentRatesResponse } from "@/lib/api/shipment"

function makeShipmentRatesResponse(overrides: Partial<ShipmentRatesResponse> = {}): ShipmentRatesResponse {
  return {
    shippoRates: [
      {
        objectId: "rate-1",
        provider: "USPS",
        providerImage75: "https://shippo-static.s3.amazonaws.com/providers/75/USPS.png",
        providerImage200: "https://shippo-static.s3.amazonaws.com/providers/200/USPS.png",
        amount: "8.50",
        currency: "USD",
        amountLocal: "8.50",
        currencyLocal: "USD",
        arrivesBy: null,
        durationTerms: "Estimated 2-3 business days.",
        estimatedDays: 3,
        attributes: ["CHEAPEST"],
        servicelevel: {
          name: "Priority Mail",
          token: "usps_priority",
          terms: "",
          extendedToken: "usps_priority",
          parentServicelevel: null,
        },
        test: true,
      },
    ],
    uberQuote: null,
    defaultShipmentFee: 5,
    ...overrides,
  }
}

export const shipmentHandlers = [
  http.post("*/backend-api/shipment/rates", () => HttpResponse.json(makeShipmentRatesResponse())),
]
