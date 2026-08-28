import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeAddress } from "@/test/factories"
import { addressAPI, type CreateAddressPayload, type UpdateAddressPayload } from "./address"

const defaultAddress = makeAddress({ id: "address-1", defaultAddress: true })
const secondaryAddress = makeAddress({ id: "address-2", title: "Clinic", defaultAddress: false })

let capturedCreateBody: CreateAddressPayload | null = null
let capturedUpdateBody: UpdateAddressPayload | null = null
let capturedDeleteUrl: string | null = null

beforeEach(async () => {
  capturedCreateBody = null
  capturedUpdateBody = null
  capturedDeleteUrl = null

  server.use(
    http.get("*/backend-api/address", () => HttpResponse.json([defaultAddress, secondaryAddress])),
    http.get("*/backend-api/address/:id", ({ params }) =>
      HttpResponse.json(params.id === "address-2" ? secondaryAddress : defaultAddress),
    ),
    http.post("*/backend-api/address", async ({ request }) => {
      capturedCreateBody = (await request.json()) as CreateAddressPayload
      return HttpResponse.json({ ...defaultAddress, id: "address-3" })
    }),
    http.put("*/backend-api/address/:id", async ({ request, params }) => {
      capturedUpdateBody = (await request.json()) as UpdateAddressPayload
      return HttpResponse.json({ ...defaultAddress, id: String(params.id), ...capturedUpdateBody })
    }),
    http.delete("*/backend-api/address/:id", ({ request }) => {
      capturedDeleteUrl = request.url
      return new HttpResponse(null, { status: 200 })
    }),
  )

  // `addressAPI.getAddresses()` memoizes its last successful response for 2s and dedupes
  // concurrent in-flight calls (module-level state, not reset by the global test harness).
  // Clearing it here via a mutating call keeps each test's GET assertions isolated from
  // whatever the previous test cached.
  await addressAPI.deleteAddress("__cache-reset__")
})

describe("addressAPI.getAddresses contract", () => {
  it("returns the typed address list on a happy path", async () => {
    const addresses = await addressAPI.getAddresses()

    expect(addresses).toHaveLength(2)
    expect(addresses[0]).toEqual(defaultAddress)
    expect(addresses[0]?.defaultAddress).toBe(true)
    expect(typeof addresses[0]?.latitude).toBe("number")
  })

  // NOTE: AddressController.getMyAddresses (AddressController.java) always returns
  // `List<AddressResponse>` - the real backend never sends a bare object or an `{ items }`
  // envelope for GET /api/address. The next two cases are deliberate defensive-coding coverage
  // for addressAPI.getAddresses's own normalization branches (adversarial/malformed-shape
  // tolerance), not a claim that the backend produces these shapes.
  it("normalizes a bare object response into a single-item array", async () => {
    server.use(http.get("*/backend-api/address", () => HttpResponse.json(defaultAddress)))
    await addressAPI.deleteAddress("__cache-reset__")

    const addresses = await addressAPI.getAddresses()

    expect(addresses).toEqual([defaultAddress])
  })

  it("normalizes an { items: [...] } envelope into the items array", async () => {
    server.use(http.get("*/backend-api/address", () => HttpResponse.json({ items: [secondaryAddress] })))
    await addressAPI.deleteAddress("__cache-reset__")

    const addresses = await addressAPI.getAddresses()

    expect(addresses).toEqual([secondaryAddress])
  })

  it("tolerates a null response by returning an empty array", async () => {
    server.use(http.get("*/backend-api/address", () => new HttpResponse(null, { status: 200 })))
    await addressAPI.deleteAddress("__cache-reset__")

    const addresses = await addressAPI.getAddresses()

    expect(addresses).toEqual([])
  })

  it("rejects with a 401 and marks the error auth-handled", async () => {
    server.use(http.get("*/backend-api/address", () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 })))
    await addressAPI.deleteAddress("__cache-reset__")

    const error = await addressAPI.getAddresses().catch((e) => e)

    expect(error.response?.status).toBe(401)
    expect(error.authHandled).toBe(true)
  })

  it("rejects on a network failure", async () => {
    server.use(http.get("*/backend-api/address", () => HttpResponse.error()))
    await addressAPI.deleteAddress("__cache-reset__")

    await expect(addressAPI.getAddresses()).rejects.toThrow()
  })
})

describe("addressAPI.getAddress contract", () => {
  it("fetches a single address by id", async () => {
    const address = await addressAPI.getAddress("address-2")

    expect(address).toEqual(secondaryAddress)
  })

  it("rejects with a 400 for an unknown id", async () => {
    // AddressService.getOne (ecommerce-api auth/service/AddressService.java) throws a plain
    // `new RuntimeException("Address not found")` when findByIdAndUserId misses - there is no
    // ResourceNotFoundException here, so GlobalExceptionHandler's RuntimeException catch-all
    // answers 400, not 404.
    server.use(
      http.get("*/backend-api/address/:id", () => HttpResponse.json({ message: "Address not found" }, { status: 400 })),
    )

    await expect(addressAPI.getAddress("missing")).rejects.toThrow(/400/)
  })
})

describe("addressAPI.createAddress contract", () => {
  it("sends the full address payload (id omitted) and returns the created address", async () => {
    const payload: CreateAddressPayload = {
      title: "Office",
      fullName: "Serhat Belen",
      phoneNumber: "+15551234567",
      country: "US",
      city: "New York",
      district: "Kadikoy",
      postalCode: "10016",
      addressLine: "201 Madison Ave",
      defaultAddress: false,
      latitude: 40.7484,
      longitude: -73.9857,
      placeId: "place-2",
      formattedAddress: "201 Madison Ave, New York, NY",
    }

    const address = await addressAPI.createAddress(payload)

    expect(capturedCreateBody).toEqual(payload)
    expect(address.id).toBe("address-3")
  })

  it("marking a new address as default is sent verbatim in the payload", async () => {
    const { id: _id, ...payload } = defaultAddress

    await addressAPI.createAddress({ ...payload, defaultAddress: true })

    expect(capturedCreateBody?.defaultAddress).toBe(true)
  })

  it("rejects with a 400 on invalid payload", async () => {
    server.use(
      http.post("*/backend-api/address", () => HttpResponse.json({ message: "Invalid postal code" }, { status: 400 })),
    )

    const { id: _id, ...payload } = defaultAddress
    await expect(addressAPI.createAddress(payload)).rejects.toThrow(/400/)
  })
})

describe("addressAPI.updateAddress contract", () => {
  it("sends a partial update payload", async () => {
    const payload: UpdateAddressPayload = { defaultAddress: true }

    const address = await addressAPI.updateAddress("address-2", payload)

    expect(capturedUpdateBody).toEqual(payload)
    expect(address.defaultAddress).toBe(true)
  })

  it("rejects with a 400 when the new title collides with another of the caller's addresses", async () => {
    // AddressService.update (AddressService.java) has no order-usage check at all - PUT
    // /address/{id} never looks at orders. The only update-time conflict it can throw is a title
    // collision: `if (!address.getTitle().equals(request.getTitle())) { if
    // (addressRepository.existsByUserIdAndTitle(...)) throw new RuntimeException("You already
    // have an address with this title.") }`, which the RuntimeException catch-all turns into 400.
    server.use(
      http.put("*/backend-api/address/:id", () =>
        HttpResponse.json({ message: "You already have an address with this title." }, { status: 400 }),
      ),
    )

    await expect(addressAPI.updateAddress("address-1", { title: "Clinic" })).rejects.toThrow(/400/)
  })

  it("rejects with a 400 when the address id does not belong to the caller", async () => {
    // Same "Address not found" RuntimeException -> 400 as getOne/delete; PUT is not exempt.
    server.use(
      http.put("*/backend-api/address/:id", () => HttpResponse.json({ message: "Address not found" }, { status: 400 })),
    )

    await expect(addressAPI.updateAddress("someone-elses-address", { defaultAddress: true })).rejects.toThrow(/400/)
  })
})

describe("addressAPI.deleteAddress contract", () => {
  it("calls DELETE with the address id in the path", async () => {
    await addressAPI.deleteAddress("address-2")

    expect(capturedDeleteUrl).toContain("/address/address-2")
  })

  it("rejects with a 400 when the address was already deleted", async () => {
    // AddressService.delete looks up findByIdAndUserId and throws a plain
    // `new RuntimeException("Address not found")` on a miss (there is no order-usage guard on
    // delete at all - it deletes unconditionally once found). GlobalExceptionHandler's
    // RuntimeException catch-all turns that into 400, not 404.
    server.use(
      http.delete("*/backend-api/address/:id", () =>
        HttpResponse.json({ message: "Address not found" }, { status: 400 }),
      ),
    )

    await expect(addressAPI.deleteAddress("already-gone")).rejects.toThrow(/400/)
  })
})
