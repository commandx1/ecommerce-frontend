import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeVendorPeriodicRevenueResponse } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import RevenueChart from "./RevenueChart"

/**
 * chart.js cannot acquire a 2D canvas context in jsdom (no `canvas` npm package installed) —
 * it swallows that internally and logs "Failed to create chart", so it does not crash the
 * test, but it also renders nothing inspectable. Per TEST-FINDINGS.md guidance for chart
 * components, `Line` is replaced with a stand-in that exposes the `data`/`options` props it
 * was given, so the component's own data-transformation and empty/error handling can be
 * asserted without touching pixels.
 */
vi.mock("react-chartjs-2", () => ({
  Line: ({
    data,
    "aria-label": ariaLabel,
  }: {
    data: { labels: string[]; datasets: { data: number[] }[] }
    "aria-label"?: string
  }) => (
    <div
      data-testid="revenue-line"
      data-labels={JSON.stringify(data.labels)}
      data-values={JSON.stringify(data.datasets[0]?.data ?? [])}
      aria-label={ariaLabel}
      role="img"
    />
  ),
}))

const REVENUE_URL = "*/backend-api/dashboard/vendor/periodic-revenue"

const signInVendor = () => {
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "token",
    isAuthenticated: true,
  })
}

const serveRevenue = (body: unknown) => {
  const requests: URLSearchParams[] = []
  server.use(
    http.get(REVENUE_URL, ({ request }) => {
      requests.push(new URL(request.url).searchParams)
      return HttpResponse.json(body as object)
    }),
  )
  return requests
}

const readLine = () => screen.findByTestId("revenue-line")

beforeEach(() => {
  signInVendor()
})

describe("RevenueChart", () => {
  it("shows a loading placeholder before the periodic revenue resolves", () => {
    serveRevenue(makeVendorPeriodicRevenueResponse())
    const { container } = render(<RevenueChart />)

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
    expect(screen.queryByTestId("revenue-line")).not.toBeInTheDocument()
  })

  it("maps each backend period into a chart label and revenue value", async () => {
    serveRevenue(
      makeVendorPeriodicRevenueResponse({
        periods: [
          {
            period: "2026-06",
            periodMonth: 6,
            periodYear: 2026,
            totalRevenue: 1000,
            orderItemCount: 5,
            totalApprovedVendorPayment: 900,
            approvedVendorPaymentCount: 4,
          },
          {
            period: "2026-07",
            periodMonth: 7,
            periodYear: 2026,
            totalRevenue: 4200,
            orderItemCount: 80,
            totalApprovedVendorPayment: 4000,
            approvedVendorPaymentCount: 78,
          },
        ],
      }),
    )
    render(<RevenueChart />)

    const line = await readLine()
    expect(JSON.parse(line.dataset.labels ?? "[]")).toEqual(["2026-06", "2026-07"])
    expect(JSON.parse(line.dataset.values ?? "[]")).toEqual([1000, 4200])
  })

  it("passes an accessible name through to the underlying canvas", async () => {
    serveRevenue(makeVendorPeriodicRevenueResponse())
    render(<RevenueChart />)

    expect(await screen.findByRole("img", { name: "Monthly revenue performance" })).toBeInTheDocument()
  })

  it("requests a new range and updates the chart when a range button is clicked", async () => {
    const requests = serveRevenue(makeVendorPeriodicRevenueResponse())
    render(<RevenueChart />)
    await readLine()

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "6M" }))

    await waitFor(() => {
      expect(requests.at(-1)?.get("months")).toBe("6")
    })
  })

  it("requests every period (no months filter) when 'All' is selected", async () => {
    const requests = serveRevenue(makeVendorPeriodicRevenueResponse())
    render(<RevenueChart />)
    await readLine()

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "All" }))

    await waitFor(() => {
      expect(requests.at(-1)?.has("months")).toBe(false)
    })
  })

  it("shows an error message and a Retry button instead of the chart when the request fails", async () => {
    server.use(http.get(REVENUE_URL, () => new HttpResponse(null, { status: 400 })))
    render(<RevenueChart />)

    expect(await screen.findByText("Couldn't load revenue. Please try again.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
    expect(screen.queryByTestId("revenue-line")).not.toBeInTheDocument()
    expect(screen.queryByText(/bad request/i)).not.toBeInTheDocument()
  })

  it("re-requests the periodic revenue and renders the chart after a successful retry", async () => {
    server.use(http.get(REVENUE_URL, () => new HttpResponse(null, { status: 400 })))
    render(<RevenueChart />)
    await screen.findByText("Couldn't load revenue. Please try again.")

    serveRevenue(
      makeVendorPeriodicRevenueResponse({
        periods: [
          {
            period: "2026-07",
            periodMonth: 7,
            periodYear: 2026,
            totalRevenue: 4200,
            orderItemCount: 80,
            totalApprovedVendorPayment: 4000,
            approvedVendorPaymentCount: 78,
          },
        ],
      }),
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Retry" }))

    const line = await readLine()
    expect(JSON.parse(line.dataset.labels ?? "[]")).toEqual(["2026-07"])
    expect(screen.queryByText("Couldn't load revenue. Please try again.")).not.toBeInTheDocument()
  })

  it.each([
    ["periods missing entirely", {}],
    ["periods null", { periods: null }],
    ["periods not an array", { periods: { period: "2026-07" } }],
  ])("renders an empty chart instead of crashing when %s", async (_label, body) => {
    serveRevenue(body)
    render(<RevenueChart />)

    const line = await readLine()
    expect(JSON.parse(line.dataset.labels ?? "[]")).toEqual([])
    expect(JSON.parse(line.dataset.values ?? "[]")).toEqual([])
  })

  it.each([
    ["totalRevenue null", null],
    ["totalRevenue NaN", Number.NaN],
    ["totalRevenue a string", "4200"],
    ["totalRevenue negative", -500],
  ])("does not crash when a period's totalRevenue is %s", async (_label, totalRevenue) => {
    serveRevenue(
      makeVendorPeriodicRevenueResponse({
        periods: [
          {
            period: "2026-07",
            periodMonth: 7,
            periodYear: 2026,
            // biome-ignore lint/suspicious/noExplicitAny: intentionally malformed backend payload
            totalRevenue: totalRevenue as any,
            orderItemCount: 10,
            totalApprovedVendorPayment: 0,
            approvedVendorPaymentCount: 0,
          },
        ],
      }),
    )
    render(<RevenueChart />)

    const line = await readLine()
    expect(JSON.parse(line.dataset.labels ?? "[]")).toEqual(["2026-07"])
  })

  it("does not request revenue data for an unauthenticated visitor", async () => {
    useAuthStore.getState().clearAuth()
    const requests = serveRevenue(makeVendorPeriodicRevenueResponse())
    render(<RevenueChart />)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(requests).toHaveLength(0)
  })
})
