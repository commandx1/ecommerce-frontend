import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ParsedAddress } from "@/lib/utils/google-maps"
import { server } from "@/mocks/server"
import { render, screen, waitFor } from "@/test/render"
import AddressAutocomplete from "./AddressAutocomplete"

let queries: string[]

const installPlacesHandlers = () => {
  server.use(
    http.get("*/api/google-maps/autocomplete", ({ request }) => {
      queries.push(new URL(request.url).searchParams.get("query") ?? "")
      return HttpResponse.json({
        predictions: [
          { place_id: "place-1", description: "201 Madison Ave, New York, NY, USA" },
          { place_id: "place-2", description: "202 Madison Ave, New York, NY, USA" },
        ],
      })
    }),
    http.get("*/api/google-maps/place-details", () =>
      HttpResponse.json({
        result: {
          place_id: "place-1",
          formatted_address: "201 Madison Ave, New York, NY 10016, USA",
          geometry: { location: { lat: 40.7484, lng: -73.9857 } },
          address_components: [
            { long_name: "201", short_name: "201", types: ["street_number"] },
            { long_name: "Madison Avenue", short_name: "Madison Ave", types: ["route"] },
            { long_name: "New York", short_name: "NY", types: ["locality"] },
            { long_name: "New York", short_name: "NY", types: ["administrative_area_level_1"] },
            { long_name: "United States", short_name: "US", types: ["country"] },
            { long_name: "10016", short_name: "10016", types: ["postal_code"] },
          ],
        },
      }),
    ),
  )
}

const field = () => screen.getByLabelText("Search Address *")

describe("AddressAutocomplete", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    queries = []
    installPlacesHandlers()
  })

  it("waits for three characters before asking Google for anything", async () => {
    const user = userEvent.setup()
    render(<AddressAutocomplete onSelect={vi.fn()} selectedAddress={null} />)

    await user.type(field(), "20")

    await waitFor(() => expect(field()).toHaveValue("20"))
    expect(queries).toEqual([])
    expect(screen.queryByText(/Madison Ave/)).not.toBeInTheDocument()
  })

  it("suggests places once the query is long enough", async () => {
    const user = userEvent.setup()
    render(<AddressAutocomplete onSelect={vi.fn()} selectedAddress={null} />)

    await user.type(field(), "201 Madison")

    expect(await screen.findByText("201 Madison Ave, New York, NY, USA")).toBeInTheDocument()
    expect(queries).toEqual(["201 Madison"])
  })

  it("hands the parsed address to its owner and fills the field", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<AddressAutocomplete onSelect={onSelect} selectedAddress={null} />)

    await user.type(field(), "201 Madison")
    await user.click(await screen.findByText("201 Madison Ave, New York, NY, USA"))

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1))
    const selected = onSelect.mock.calls[0][0] as ParsedAddress
    expect(selected).toMatchObject({
      city: "New York",
      postalCode: "10016",
      placeId: "place-1",
      latitude: 40.7484,
      longitude: -73.9857,
    })
    expect(screen.queryByText("202 Madison Ave, New York, NY, USA")).not.toBeInTheDocument()
  })

  it("seeds the field from an address chosen earlier", () => {
    render(
      <AddressAutocomplete
        onSelect={vi.fn()}
        selectedAddress={{
          country: "US",
          state: "NY",
          city: "New York",
          district: "",
          postalCode: "10016",
          addressLine: "201 Madison Ave",
          latitude: 40.7484,
          longitude: -73.9857,
          placeId: "place-1",
          formattedAddress: "201 Madison Ave, New York, NY 10016, USA",
        }}
      />,
    )

    expect(field()).toHaveValue("201 Madison Ave")
  })

  it("shows the validation message it is handed", () => {
    render(<AddressAutocomplete onSelect={vi.fn()} selectedAddress={null} error="Address is required" />)

    expect(screen.getByText("Address is required")).toBeInTheDocument()
  })

  it("keeps the field usable when the lookup fails", async () => {
    const user = userEvent.setup()
    vi.spyOn(console, "error").mockImplementation(() => {})
    server.use(http.get("*/api/google-maps/autocomplete", () => new HttpResponse(null, { status: 500 })))
    render(<AddressAutocomplete onSelect={vi.fn()} selectedAddress={null} />)

    await user.type(field(), "201 Madison")

    await waitFor(() => expect(field()).toHaveValue("201 Madison"))
    expect(screen.queryByText(/Madison Ave, New York/)).not.toBeInTheDocument()
  })

  // BULGU: each suggestion is an <li> with an onClick but no button role, tabindex or key
  // handler — the list cannot be used with a keyboard at all.
  it("renders suggestions as non-interactive list items (current behaviour)", async () => {
    const user = userEvent.setup()
    render(<AddressAutocomplete onSelect={vi.fn()} selectedAddress={null} />)

    await user.type(field(), "201 Madison")
    const suggestion = (await screen.findByText("201 Madison Ave, New York, NY, USA")).closest("li")!

    expect(suggestion).not.toHaveAttribute("tabindex")
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })
})
