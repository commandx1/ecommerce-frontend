import userEvent from "@testing-library/user-event"
import { delay, HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ParsedAddress } from "@/lib/utils/google-maps"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeAddress } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
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
  it("shows only the default address when several exist", async () => {
    serveAddresses(
      makeAddress({ id: "a-1", title: "Warehouse", defaultAddress: false }),
      makeAddress({ id: "a-2", title: "Clinic", defaultAddress: true }),
    )

    render(<AddressManagementShared />)

    expect(await screen.findByRole("heading", { name: "Clinic" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Warehouse" })).not.toBeInTheDocument()
  })

  it("falls back to the first address when none is marked default", async () => {
    serveAddresses(
      makeAddress({ id: "a-1", title: "Warehouse", defaultAddress: false }),
      makeAddress({ id: "a-2", title: "Clinic", defaultAddress: false }),
    )

    render(<AddressManagementShared />)

    expect(await screen.findByRole("heading", { name: "Warehouse" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Clinic" })).not.toBeInTheDocument()
  })

  it("hides Add New once an address exists", async () => {
    serveAddresses(makeAddress({ id: "a-1", title: "Clinic", defaultAddress: true }))

    render(<AddressManagementShared />)

    await screen.findByRole("heading", { name: "Clinic" })
    expect(screen.queryByRole("button", { name: /Add New/ })).not.toBeInTheDocument()
  })

  it("invites the user to add an address when there are none", async () => {
    const user = userEvent.setup()
    serveAddresses()

    render(<AddressManagementShared />)

    await user.click(await screen.findByRole("button", { name: "Add your address" }))
    expect(await screen.findByLabelText(/Address Title/)).toBeInTheDocument()
  })

  it("prefills the new-address form from the signed-in user", async () => {
    const user = userEvent.setup()
    serveAddresses()

    render(<AddressManagementShared />)

    await user.click(await screen.findByRole("button", { name: "Add your address" }))

    expect(screen.getByLabelText("Full Name")).toHaveValue("Serhat Belen")
    expect(screen.getByLabelText("Phone Number")).toHaveValue("+15551234567")
  })

  it("keeps Save disabled until a place has been chosen from Google Places", async () => {
    const user = userEvent.setup()
    serveAddresses()

    render(<AddressManagementShared />)
    await user.click(await screen.findByRole("button", { name: "Add your address" }))

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
    await user.click(await screen.findByRole("button", { name: "Add your address" }))

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
      defaultAddress: true,
      // The component deliberately stores the state abbreviation in `city`
      // and the city name in `district`.
      city: "CA",
      district: "Los Angeles",
    })
    // AddressCreateRequest (ecommerce-api auth/dto/AddressCreateRequest.java) has no `state`
    // field and no @JsonIgnoreProperties(ignoreUnknown = true), so a `state` key here would
    // throw Jackson UnrecognizedPropertyException and 400 the whole create. Revert-proof:
    // re-adding `state: parsedAddress.state` to handleAddressSelect's setCurrentAddress call in
    // AddressManagementShared.tsx makes this assertion fail - measured locally before writing
    // this test.
    expect(payload).not.toHaveProperty("state")
  })

  it("always sends defaultAddress: true when updating an address", async () => {
    const user = userEvent.setup()
    serveAddresses(makeAddress({ id: "a-1", title: "Clinic", defaultAddress: false }))

    let payload: Record<string, unknown> | null = null
    server.use(
      http.put("*/backend-api/address/:id", async ({ request, params }) => {
        payload = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(makeAddress({ id: String(params.id) }))
      }),
    )

    render(<AddressManagementShared />)

    await user.click(await screen.findByRole("button", { name: /Edit/ }))
    await user.click(screen.getByRole("button", { name: /Save/ }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Address updated"))
    expect(payload).toMatchObject({ defaultAddress: true })
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
    await user.click(await screen.findByRole("button", { name: "Add your address" }))
    await user.type(screen.getByLabelText(/Address Title/), "Clinic")
    await pickAddressFromPlaces(user)
    await waitFor(() => expect(screen.getByRole("button", { name: /Save/ })).toBeEnabled())
    await user.click(screen.getByRole("button", { name: /Save/ }))

    // The zip field is `required`, so an EMPTY value never submits and the guard in
    // `handleSave` ("Zip code is required") is unreachable that way from the UI. A
    // whitespace-only value satisfies `required`, though - see the test below that reaches
    // the guard through it.
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
    expect(await screen.findByDisplayValue("Clinic")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Save/ }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Address updated"))
    expect(updatedId).toBe("a-1")
  })

  it("shows a retry state instead of an empty address book when the load fails, and recovers on retry", async () => {
    const user = userEvent.setup()
    server.use(http.get("*/backend-api/address", () => new HttpResponse(null, { status: 500 })))

    render(<AddressManagementShared />)

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("An error occurred while loading addresses"))
    expect(screen.queryByText("You haven't added an address yet.")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Add New/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add your address" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()

    // The 2s module cache in `src/lib/api/address.ts` only stores successful responses, so a
    // failed load leaves nothing cached for the retry to hit.
    serveAddresses(makeAddress({ id: "a-1", title: "Clinic" }))
    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByRole("heading", { name: "Clinic" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument()
  })

  it("shows only the first address when more than one is marked default", async () => {
    serveAddresses(
      makeAddress({ id: "a-1", title: "Warehouse", defaultAddress: true }),
      makeAddress({ id: "a-2", title: "Clinic", defaultAddress: true }),
    )

    render(<AddressManagementShared />)

    expect(await screen.findByRole("heading", { name: "Warehouse" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Clinic" })).not.toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /Edit/ })).toHaveLength(1)
  })

  it("shows only the newly created address after a successful create", async () => {
    const user = userEvent.setup()
    let created = false
    server.use(
      http.get("*/backend-api/address", () =>
        created ? HttpResponse.json([makeAddress({ id: "a-1", title: "Clinic" })]) : HttpResponse.json([]),
      ),
      http.post("*/backend-api/address", () => {
        created = true
        return HttpResponse.json(makeAddress({ id: "a-1", title: "Clinic" }))
      }),
    )

    render(<AddressManagementShared />)
    await user.click(await screen.findByRole("button", { name: "Add your address" }))
    await user.type(screen.getByLabelText(/Address Title/), "Clinic")
    await pickAddressFromPlaces(user)
    await waitFor(() => expect(screen.getByRole("button", { name: /Save/ })).toBeEnabled())
    await user.click(screen.getByRole("button", { name: /Save/ }))

    expect(await screen.findByRole("heading", { name: "Clinic" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Add New/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add your address" })).not.toBeInTheDocument()
  })

  it("keeps the edit form open with the user's input when the update fails", async () => {
    const user = userEvent.setup()
    serveAddresses(makeAddress({ id: "a-1", title: "Clinic" }))
    server.use(http.put("*/backend-api/address/:id", () => new HttpResponse(null, { status: 400 })))

    render(<AddressManagementShared />)

    await user.click(await screen.findByRole("button", { name: /Edit/ }))
    const titleInput = screen.getByLabelText(/Address Title/)
    await user.clear(titleInput)
    await user.type(titleInput, "Office")
    await user.click(screen.getByRole("button", { name: /Save/ }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("An error occurred while saving the address"))
    expect(toastSpies.success).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/Address Title/)).toHaveValue("Office")
  })

  it("discards edits when Cancel is clicked", async () => {
    const user = userEvent.setup()
    serveAddresses(makeAddress({ id: "a-1", title: "Clinic" }))

    render(<AddressManagementShared />)

    await user.click(await screen.findByRole("button", { name: /Edit/ }))
    const titleInput = screen.getByLabelText(/Address Title/)
    await user.clear(titleInput)
    await user.type(titleInput, "Changed")
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(await screen.findByRole("heading", { name: "Clinic" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Edit/ }))
    expect(screen.getByLabelText(/Address Title/)).toHaveValue("Clinic")
  })

  it("rejects a whitespace-only zip code without calling the API", async () => {
    const user = userEvent.setup()
    serveAddresses(makeAddress({ id: "a-1", title: "Clinic" }))
    const putCalled = vi.fn()
    server.use(
      http.put("*/backend-api/address/:id", ({ params }) => {
        putCalled()
        return HttpResponse.json(makeAddress({ id: String(params.id) }))
      }),
    )

    render(<AddressManagementShared />)

    await user.click(await screen.findByRole("button", { name: /Edit/ }))
    const zipInput = screen.getByLabelText("Zip Code")
    await user.clear(zipInput)
    await user.type(zipInput, "   ")
    await user.click(screen.getByRole("button", { name: /Save/ }))

    expect(toastSpies.error).toHaveBeenCalledWith("Zip code is required")
    expect(putCalled).not.toHaveBeenCalled()
  })

  it("submits only once when Save is clicked twice quickly", async () => {
    const user = userEvent.setup()
    let postCount = 0
    server.use(
      http.get("*/backend-api/address", () => HttpResponse.json([])),
      http.post("*/backend-api/address", async () => {
        postCount++
        await delay(100)
        return HttpResponse.json(makeAddress())
      }),
    )

    render(<AddressManagementShared />)
    await user.click(await screen.findByRole("button", { name: "Add your address" }))
    await user.type(screen.getByLabelText(/Address Title/), "Clinic")
    await pickAddressFromPlaces(user)
    await waitFor(() => expect(screen.getByRole("button", { name: /Save/ })).toBeEnabled())

    const saveButton = screen.getByRole("button", { name: /Save/ })
    await user.click(saveButton)
    await user.click(saveButton)

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("New address added"))
    expect(postCount).toBe(1)
  })

  it("renders without a signed-in user", async () => {
    const user = userEvent.setup()
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
    serveAddresses()

    render(<AddressManagementShared />)

    expect(await screen.findByText("Your delivery location.")).toBeInTheDocument()
    // findByRole (was getByRole): the address list now loads through React Query, which adds a
    // microtask hop or two versus the old direct fetch-in-useEffect, so the button isn't
    // synchronously present the instant the header text above resolves. Robustness-only change,
    // same button, same end state.
    await user.click(await screen.findByRole("button", { name: "Add your address" }))
    expect(screen.getByLabelText("Full Name")).toHaveValue("")
    expect(screen.getByLabelText("Phone Number")).toHaveValue("")
  })

  it("tells the buyer Google Places failed and lets them retry instead of getting stuck", async () => {
    const user = userEvent.setup()
    serveAddresses()
    placesMocks.searchPlaces.mockRejectedValue(new Error("Places is down"))
    vi.spyOn(console, "error").mockImplementation(() => {})

    render(<AddressManagementShared />)
    await user.click(await screen.findByRole("button", { name: "Add your address" }))
    await user.type(screen.getByLabelText("Search Address *"), "1600 Amphi")

    // The buyer sees why the form is stuck instead of a silent, unexplained dead end.
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't search for addresses/i)
    expect(screen.getByRole("button", { name: /Save/ })).toBeDisabled()

    // Once Places recovers, retrying (typing again) works and unblocks Save.
    placesMocks.searchPlaces.mockResolvedValue([
      { place_id: parsedAddress.placeId, description: parsedAddress.formattedAddress },
    ])
    await user.type(screen.getByLabelText("Search Address *"), "theatre")
    await user.click(await screen.findByText(parsedAddress.formattedAddress, { selector: "div" }))

    await waitFor(() => expect(screen.getByRole("button", { name: /Save/ })).toBeEnabled())
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("shows a skeleton inside the section shell while loading, then swaps it for the address", async () => {
    serveAddresses(makeAddress({ id: "a-1", title: "Clinic" }))

    render(<AddressManagementShared />)

    expect(screen.getByRole("heading", { name: "Address" })).toBeInTheDocument()
    expect(screen.getByText("Loading address...")).toBeInTheDocument()

    expect(await screen.findByRole("heading", { name: "Clinic" })).toBeInTheDocument()
    expect(screen.queryByText("Loading address...")).not.toBeInTheDocument()
  })

  it("renders as a compact card section", async () => {
    serveAddresses(makeAddress({ id: "a-1", title: "Clinic" }))

    render(<AddressManagementShared />)

    expect(await screen.findByRole("heading", { name: "Address" })).toBeInTheDocument()
  })

  it("shows the vendor subtitle when the signed-in user is a vendor", async () => {
    useAuthStore.setState({
      user: { ...makeAccountUser({ name: "Serhat", surname: "Belen", roleName: "Vendor" }) },
      accessToken: "access-token",
      isAuthenticated: true,
    })
    serveAddresses()

    render(<AddressManagementShared />)

    expect(
      await screen.findByText("Orders ship from this address. It also determines local delivery availability."),
    ).toBeInTheDocument()
  })

  it("shows the buyer subtitle when the signed-in user is not a vendor", async () => {
    serveAddresses()

    render(<AddressManagementShared />)

    expect(await screen.findByText("Your delivery location.")).toBeInTheDocument()
  })

  describe("Query request counts (C3b)", () => {
    it("refetches the address list exactly once after a successful create", async () => {
      const user = userEvent.setup()
      let getCount = 0
      server.use(
        http.get("*/backend-api/address", () => {
          getCount++
          return HttpResponse.json(getCount > 1 ? [makeAddress({ id: "a-1", title: "Clinic" })] : [])
        }),
        http.post("*/backend-api/address", () => HttpResponse.json(makeAddress({ id: "a-1", title: "Clinic" }))),
      )

      render(<AddressManagementShared />)
      await user.click(await screen.findByRole("button", { name: "Add your address" }))
      await user.type(screen.getByLabelText(/Address Title/), "Clinic")
      await pickAddressFromPlaces(user)
      await waitFor(() => expect(screen.getByRole("button", { name: /Save/ })).toBeEnabled())
      await user.click(screen.getByRole("button", { name: /Save/ }))

      await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("New address added"))
      // 1 GET on mount + exactly 1 more from the invalidateQueries the create triggers - not 0
      // (a silent stale list) and not more than 1 (a double refetch).
      await waitFor(() => expect(getCount).toBe(2))
    })

    it("refetches the address list exactly once after a successful update", async () => {
      const user = userEvent.setup()
      let getCount = 0
      server.use(
        http.get("*/backend-api/address", () => {
          getCount++
          return HttpResponse.json([makeAddress({ id: "a-1", title: getCount > 1 ? "Office" : "Clinic" })])
        }),
        http.put("*/backend-api/address/:id", ({ params }) =>
          HttpResponse.json(makeAddress({ id: String(params.id), title: "Office" })),
        ),
      )

      render(<AddressManagementShared />)
      await user.click(await screen.findByRole("button", { name: /Edit/ }))
      await user.click(screen.getByRole("button", { name: /Save/ }))

      await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Address updated"))
      await waitFor(() => expect(getCount).toBe(2))
    })

    it("does not refetch the address list when a save fails", async () => {
      const user = userEvent.setup()
      let getCount = 0
      server.use(
        http.get("*/backend-api/address", () => {
          getCount++
          return HttpResponse.json([makeAddress({ id: "a-1", title: "Clinic" })])
        }),
        http.put("*/backend-api/address/:id", () => new HttpResponse(null, { status: 400 })),
      )

      render(<AddressManagementShared />)
      await user.click(await screen.findByRole("button", { name: /Edit/ }))
      await user.click(screen.getByRole("button", { name: /Save/ }))

      await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("An error occurred while saving the address"))
      expect(getCount).toBe(1)
    })
  })
})
