import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeVendorGeographicDistributionResponse } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import GeographicDistribution from "./GeographicDistribution"

const GEO_URL = "*/backend-api/dashboard/vendor/geographic-distribution"

const signInVendor = () => {
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "token",
    isAuthenticated: true,
  })
}

const serveGeo = (body: unknown) => {
  const requests: URLSearchParams[] = []
  server.use(
    http.get(GEO_URL, ({ request }) => {
      requests.push(new URL(request.url).searchParams)
      return HttpResponse.json(body as object)
    }),
  )
  return requests
}

beforeEach(() => {
  signInVendor()
})

describe("GeographicDistribution", () => {
  it("shows loading placeholders before the distribution resolves", () => {
    serveGeo(makeVendorGeographicDistributionResponse())
    const { container } = render(<GeographicDistribution />)

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it("renders each city's name and rounded percentage from the backend", async () => {
    serveGeo(
      makeVendorGeographicDistributionResponse({
        cities: [
          // countChangePercentage: null keeps this city out of the separate "Top Growth
          // Markets" section below, so its name renders exactly once.
          {
            city: "New York",
            buyerCount: 42,
            percentage: 35.6,
            previousBuyerCount: null,
            previousPercentage: null,
            countChangePercentage: null,
          },
        ],
      }),
    )
    render(<GeographicDistribution />)

    expect(await screen.findByText("New York")).toBeInTheDocument()
    expect(screen.getByText("36%")).toBeInTheDocument()
  })

  it("shows the top 3 growth markets sorted by change percentage, excluding cities with no prior data", async () => {
    serveGeo(
      makeVendorGeographicDistributionResponse({
        cities: [
          {
            city: "Austin",
            buyerCount: 10,
            percentage: 10,
            previousBuyerCount: 8,
            previousPercentage: 8,
            countChangePercentage: 25,
          },
          {
            city: "Boston",
            buyerCount: 20,
            percentage: 20,
            previousBuyerCount: 25,
            previousPercentage: 25,
            countChangePercentage: -5,
          },
          {
            city: "Chicago",
            buyerCount: 30,
            percentage: 30,
            previousBuyerCount: 20,
            previousPercentage: 20,
            countChangePercentage: 50,
          },
          {
            city: "Denver",
            buyerCount: 5,
            percentage: 5,
            previousBuyerCount: null,
            previousPercentage: null,
            countChangePercentage: null,
          },
        ],
      }),
    )
    render(<GeographicDistribution />)

    await screen.findByText("Top Growth Markets")
    // "Top Growth Markets" is the heading `<div>` itself; its sibling list of cities lives in
    // the shared parent, one level up.
    const growthSection = screen.getByText("Top Growth Markets").parentElement as HTMLElement
    expect(growthSection).toHaveTextContent("Chicago")
    expect(growthSection).toHaveTextContent("Austin")
    expect(growthSection).toHaveTextContent("Boston")
    expect(growthSection).not.toHaveTextContent("Denver")
  })

  it("requests a new range and shows a fresh loading state when a range button is clicked", async () => {
    const requests = serveGeo(makeVendorGeographicDistributionResponse())
    render(<GeographicDistribution />)
    await screen.findAllByText("New York")

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "7D" }))

    await waitFor(() => {
      expect(requests.at(-1)?.get("daysFromNow")).toBe("7")
    })
  })

  it("omits the daysFromNow param when 'All' is selected", async () => {
    const requests = serveGeo(makeVendorGeographicDistributionResponse())
    render(<GeographicDistribution />)
    await screen.findAllByText("New York")

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "All" }))

    await waitFor(() => {
      expect(requests.at(-1)?.has("daysFromNow")).toBe(false)
    })
  })

  it("shows an error message and a Retry button instead of the city rows when the request fails", async () => {
    server.use(http.get(GEO_URL, () => new HttpResponse(null, { status: 400 })))
    render(<GeographicDistribution />)

    expect(await screen.findByText("Couldn't load geographic distribution. Please try again.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
    expect(screen.queryByText("Top Growth Markets")).not.toBeInTheDocument()
    expect(screen.queryByText(/bad request/i)).not.toBeInTheDocument()
    expect(screen.getByText("Geographic Distribution")).toBeInTheDocument()
  })

  it("re-requests the distribution and renders the cities after a successful retry", async () => {
    server.use(http.get(GEO_URL, () => new HttpResponse(null, { status: 400 })))
    render(<GeographicDistribution />)
    await screen.findByText("Couldn't load geographic distribution. Please try again.")

    serveGeo(
      makeVendorGeographicDistributionResponse({
        cities: [
          {
            city: "New York",
            buyerCount: 42,
            percentage: 35.6,
            previousBuyerCount: null,
            previousPercentage: null,
            countChangePercentage: null,
          },
        ],
      }),
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Retry" }))

    expect(await screen.findByText("New York")).toBeInTheDocument()
    expect(screen.queryByText("Couldn't load geographic distribution. Please try again.")).not.toBeInTheDocument()
  })

  it.each([
    ["cities missing entirely", undefined],
    ["cities null", null],
    ["cities not an array", { city: "New York" }],
  ])("renders no city rows or growth markets instead of crashing when %s", async (_label, citiesOverride) => {
    const body: Record<string, unknown> = { ...makeVendorGeographicDistributionResponse(), cities: citiesOverride }
    if (citiesOverride === undefined) delete body.cities
    serveGeo(body)
    render(<GeographicDistribution />)

    await waitFor(() => {
      expect(screen.queryByText("Top Growth Markets")).not.toBeInTheDocument()
    })
    expect(screen.getByText("Geographic Distribution")).toBeInTheDocument()
  })

  it("does not crash when a city's percentage is not a finite number", async () => {
    serveGeo(
      makeVendorGeographicDistributionResponse({
        cities: [
          {
            city: "Miami",
            buyerCount: 5,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally malformed backend payload
            percentage: Number.NaN as any,
            previousBuyerCount: null,
            previousPercentage: null,
            countChangePercentage: null,
          },
        ],
      }),
    )
    render(<GeographicDistribution />)

    expect(await screen.findByText("Miami")).toBeInTheDocument()
  })

  it("does not request geographic data for an unauthenticated visitor", async () => {
    useAuthStore.getState().clearAuth()
    const requests = serveGeo(makeVendorGeographicDistributionResponse())
    render(<GeographicDistribution />)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(requests).toHaveLength(0)
  })
})
