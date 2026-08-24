import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ParsedAddress } from "@/lib/utils/google-maps"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeAddress } from "@/test/factories"
import { render, screen, waitFor, within } from "@/test/render"
import AddressManagementShared from "./AddressManagementShared"

const { toastSpies, placesMocks } = vi.hoisted(() => ({
  toastSpies: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    love: vi.fn(),
    loading: vi.fn(),
  },
  placesMocks: { searchPlaces: vi.fn(), getPlaceDetails: vi.fn() },
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))
vi.mock("@/lib/utils/google-maps", () => ({
  searchPlaces: placesMocks.searchPlaces,
  getPlaceDetails: placesMocks.getPlaceDetails,
}))

const parsedAddress: ParsedAddress = {
  country: "US",
  state: "CA",
  city: "Los Angeles",
  district: "Los Angeles",
  postalCode: "90001",
  addressLine: "1600 Amphitheatre Parkway",
  latitude: 37.422,
  longitude: -122.084,
  placeId: "place-1",
  formattedAddress: "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA",
}

const serveAddresses = (...addresses: ReturnType<typeof makeAddress>[]) => {
  server.use(http.get("*/backend-api/address", () => HttpResponse.json(addresses)))
}

/** Walks the autocomplete: type, pick a prediction, which fills the hidden geo fields. */
const pickAddressFromPlaces = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Search Address *"), "1600 Amphi")
  await user.click(await screen.findByText(parsedAddress.formattedAddress, { selector: "div" }))
}

/**
 * `src/lib/api/address.ts` memoises `getAddresses()` for 2s in module scope and exposes no
 * reset, so results leak between tests. Each test therefore runs on its own faked "now",
 * pushed far enough forward that the previous test's cache entry is already stale.
 */
let clockOffset = 0

beforeEach(() => {
  vi.restoreAllMocks()
  clockOffset += 10_000
  const realNow = Date.now.bind(Date)
  vi.spyOn(Date, "now").mockImplementation(() => realNow() + clockOffset)
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
  placesMocks.searchPlaces.mockResolvedValue([{ place_id: "place-1", description: parsedAddress.formattedAddress }])
  placesMocks.getPlaceDetails.mockResolvedValue(parsedAddress)
  useAuthStore.setState({
    user: { ...makeAccountUser({ name: "Serhat", surname: "Belen", phoneNumber: "+15551234567" }) },
    accessToken: "access-token",
    isAuthenticated: true,
  })
})

describe("AddressManagementShared", () => {
  it("lists saved addresses and flags the default one", async () => {
    serveAddresses(
      makeAddress({ id: "a-1", title: "Clinic", defaultAddress: true }),
      makeAddress({ id: "a-2", title: "Warehouse", defaultAddress: false }),
    )

    render(<AddressManagementShared />)

    expect(await screen.findByRole("heading", { name: "Clinic" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Warehouse" })).toBeInTheDocument()
    expect(screen.getAllByText("Default")).toHaveLength(1)
  })

  it("invites the buyer to add a first address when there are none", async () => {
    const user = userEvent.setup()
    serveAddresses()

    render(<AddressManagementShared />)

    await user.click(await screen.findByRole("button", { name: "Add your first address" }))
    expect(screen.getByRole("heading", { name: "Add New Address" })).toBeInTheDocument()
  })

  it("prefills the new-address form from the signed-in user and defaults the first address", async () => {
    const user = userEvent.setup()
    serveAddresses()

    render(<AddressManagementShared />)

    await user.click(await screen.findByRole("button", { name: /Add New Address/ }))

    expect(screen.getByLabelText("Full Name")).toHaveValue("Serhat Belen")
    expect(screen.getByLabelText("Phone Number")).toHaveValue("+15551234567")
    expect(screen.getByLabelText("Set as default address")).toBeChecked()
  })

  it("does not pre-tick 'default' when other addresses already exist", async () => {
    const user = userEvent.setup()
    serveAddresses(makeAddress({ id: "a-1" }))

    render(<AddressManagementShared />)

    await user.click(await screen.findByRole("button", { name: /Add New Address/ }))
    expect(screen.getByLabelText("Set as default address")).not.toBeChecked()
  })

  it("keeps Save disabled until a place has been chosen from Google Places", async () => {
    const user = userEvent.setup()
    serveAddresses()

    render(<AddressManagementShared />)
    await user.click(await screen.findByRole("button", { name: /Add New Address/ }))

    expect(screen.getByRole("button", { name: /Save/ })).toBeDisabled()

    await pickAddressFromPlaces(user)

    await waitFor(() => expect(screen.getByRole("button", { name: /Save/ })).toBeEnabled())
    expect(screen.getByText(parsedAddress.formattedAddress, { selector: undefined })).toBeInTheDocument()
  })

  it("creates a new address with the geocoded fields from Places", async () => {
    const user = userEvent.setup()
    serveAddresses()

    let payload: Record<string, unknown> | null = null
    server.use(
      http.post("*/backend-api/address", async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(makeAddress())
      }),
    )

    render(<AddressManagementShared />)
    await user.click(await screen.findByRole("button", { name: /Add New Address/ }))

    await user.type(screen.getByLabelText(/Address Title/), "Clinic")
    await pickAddressFromPlaces(user)
    await waitFor(() => expect(screen.getByRole("button", { name: /Save/ })).toBeEnabled())
    await user.click(screen.getByRole("button", { name: /Save/ }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("New address added"))
    expect(payload).toMatchObject({
      title: "Clinic",
      placeId: "place-1",
      postalCode: "90001",
      latitude: 37.422,
      longitude: -122.084,
      // The component deliberately stores the state abbreviation in `city`
      // and the city name in `district`.
      city: "CA",
      district: "Los Angeles",
    })
  })

  it("will not submit an address whose zip code Places did not return", async () => {
    const user = userEvent.setup()
    serveAddresses()
    placesMocks.getPlaceDetails.mockResolvedValue({ ...parsedAddress, postalCode: "" })
    const created = vi.fn()
    server.use(
      http.post("*/backend-api/address", () => {
        created()
        return HttpResponse.json(makeAddress())
      }),
    )

    render(<AddressManagementShared />)
    await user.click(await screen.findByRole("button", { name: /Add New Address/ }))
    await user.type(screen.getByLabelText(/Address Title/), "Clinic")
    await pickAddressFromPlaces(user)
    await waitFor(() => expect(screen.getByRole("button", { name: /Save/ })).toBeEnabled())
    await user.click(screen.getByRole("button", { name: /Save/ }))

    // The zip field is `required`, so the form never submits and the guard in
    // `handleSave` ("Zip code is required") is unreachable from the UI.
    expect(screen.getByLabelText("Zip Code")).toBeRequired()
    expect(screen.getByLabelText("Zip Code")).toHaveValue("")
    expect(created).not.toHaveBeenCalled()
    expect(toastSpies.success).not.toHaveBeenCalled()
  })

  it("edits an existing address through the update endpoint", async () => {
    const user = userEvent.setup()
    serveAddresses(makeAddress({ id: "a-1", title: "Clinic" }))
    let updatedId = ""
    server.use(
      http.put("*/backend-api/address/:id", ({ params }) => {
        updatedId = String(params.id)
        return HttpResponse.json(makeAddress({ id: String(params.id) }))
      }),
    )

    render(<AddressManagementShared />)

    await user.click(await screen.findByRole("button", { name: /Edit/ }))
    expect(screen.getByRole("heading", { name: "Edit Address" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Save/ }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Address updated"))
    expect(updatedId).toBe("a-1")
  })

  it("deletes an address only after the confirmation is accepted", async () => {
    const user = userEvent.setup()
    serveAddresses(makeAddress({ id: "a-1", title: "Clinic" }))
    const deleted = vi.fn()
    server.use(
      http.delete("*/backend-api/address/:id", () => {
        deleted()
        return new HttpResponse(null, { status: 200 })
      }),
    )

    render(<AddressManagementShared />)

    await user.click(await screen.findByRole("button", { name: /Delete/ }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    expect(deleted).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: /Delete/ }))
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Address deleted successfully"))
    expect(deleted).toHaveBeenCalledTimes(1)
  })

  it("reports a failed load instead of showing an empty address book", async () => {
    server.use(http.get("*/backend-api/address", () => new HttpResponse(null, { status: 500 })))

    render(<AddressManagementShared />)

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("An error occurred while loading addresses"))
  })

  it("leaves Save blocked when Google Places itself fails", async () => {
    const user = userEvent.setup()
    serveAddresses()
    placesMocks.searchPlaces.mockRejectedValue(new Error("Places is down"))
    vi.spyOn(console, "error").mockImplementation(() => {})

    render(<AddressManagementShared />)
    await user.click(await screen.findByRole("button", { name: /Add New Address/ }))
    await user.type(screen.getByLabelText("Search Address *"), "1600 Amphi")

    // BUG (locked, not fixed): there is no manual-entry fallback and no visible error —
    // a Places outage silently makes the address form unusable.
    await waitFor(() => expect(placesMocks.searchPlaces).toHaveBeenCalled())
    expect(screen.getByRole("button", { name: /Save/ })).toBeDisabled()
    expect(screen.queryByText(/Places is down/)).not.toBeInTheDocument()
  })

  it("renders a compact card when embedded in another settings page", async () => {
    serveAddresses(makeAddress({ id: "a-1", title: "Clinic" }))

    render(<AddressManagementShared embedded />)

    expect(await screen.findByRole("heading", { name: "Addresses" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Add New/ })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "My Addresses" })).not.toBeInTheDocument()
  })
})
