import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { makeAddress, makeApiSavedCard, makeAutoOrder } from "@/test/factories"
import { render, screen, waitFor, within } from "@/test/render"
import BuyerAutoOrdersPage from "./BuyerAutoOrdersPage"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const serveAutoOrders = (...autoOrders: ReturnType<typeof makeAutoOrder>[]) => {
  server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json({ autoOrders, total: autoOrders.length })))
}

/** Buyer is missing the auto order card, so nothing can be resumed. */
const serveNotReady = () => {
  server.use(
    http.get("*/backend-api/cards", () =>
      HttpResponse.json({ cards: [makeApiSavedCard({ autoOrderCard: false, openToAutoPayment: false })], total: 1 }),
    ),
    http.get("*/backend-api/address", () => HttpResponse.json([makeAddress({ defaultAddress: false })])),
  )
}

beforeEach(() => {
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
})

describe("BuyerAutoOrdersPage", () => {
  it("summarises active schedules and the soonest delivery", async () => {
    serveAutoOrders(
      makeAutoOrder({ id: "ao-1", productName: "Mixing Tips", nextOrderDate: "2026-09-14T00:00:00" }),
      makeAutoOrder({ id: "ao-2", productName: "Gloves", nextOrderDate: "2026-09-02T00:00:00", active: true }),
      makeAutoOrder({ id: "ao-3", productName: "Masks", active: false }),
    )

    render(<BuyerAutoOrdersPage />)

    expect(await screen.findByRole("heading", { name: "Auto Orders" })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument())
    expect(screen.getByText("1 paused")).toBeInTheDocument()
    // The soonest *active* schedule wins the "Next delivery" tile
    const nextDeliveryTile = screen.getByText("Next delivery").closest("article") as HTMLElement
    expect(within(nextDeliveryTile).getByText("Gloves")).toBeInTheDocument()
  })

  it("sinks paused schedules to the bottom and filters by status", async () => {
    const user = userEvent.setup()
    serveAutoOrders(
      makeAutoOrder({ id: "ao-paused", productName: "Paused Item", active: false }),
      makeAutoOrder({ id: "ao-active", productName: "Active Item", active: true }),
    )

    render(<BuyerAutoOrdersPage />)

    const headings = await screen.findAllByRole("heading", { level: 3 })
    expect(headings.map((h) => h.textContent)).toEqual(["Active Item", "Paused Item"])

    await user.click(screen.getByRole("button", { name: "Paused" }))
    expect(screen.queryByRole("heading", { name: "Active Item" })).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Paused Item" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Active" }))
    expect(screen.getByRole("heading", { name: "Active Item" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Paused Item" })).not.toBeInTheDocument()
  })

  it("tells the buyer the filter is empty rather than pretending there are no schedules", async () => {
    const user = userEvent.setup()
    serveAutoOrders(makeAutoOrder({ id: "ao-1", active: true }))

    render(<BuyerAutoOrdersPage />)
    await screen.findByRole("heading", { level: 3 })

    await user.click(screen.getByRole("button", { name: "Paused" }))

    expect(screen.getByText(/No paused auto orders/)).toBeInTheDocument()
    expect(screen.queryByText("No auto orders yet")).not.toBeInTheDocument()
  })

  it("sends the buyer to the catalogue from the empty state", async () => {
    const user = userEvent.setup()
    serveAutoOrders()

    const { router } = render(<BuyerAutoOrdersPage />)

    await user.click(await screen.findByRole("button", { name: "Browse products" }))
    expect(router.push).toHaveBeenCalledWith("/products")
  })

  it("pauses a schedule through the API and confirms it", async () => {
    const user = userEvent.setup()
    serveAutoOrders(makeAutoOrder({ id: "ao-1", active: true }))
    server.use(
      http.patch("*/backend-api/auto-orders/:id", ({ params }) =>
        HttpResponse.json(makeAutoOrder({ id: String(params.id), active: false })),
      ),
    )

    render(<BuyerAutoOrdersPage />)

    // `name: /pause/i` would also match the "Paused" status filter, which renders first.
    await screen.findByRole("heading", { level: 3 })
    await user.click(screen.getByRole("button", { name: "Pause" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Auto order paused"))
    expect(await screen.findByRole("button", { name: "Resume" })).toBeInTheDocument()
  })

  it("surfaces the backend's reason when activation is rejected", async () => {
    const user = userEvent.setup()
    serveAutoOrders(makeAutoOrder({ id: "ao-1", active: false }))
    server.use(
      http.patch("*/backend-api/auto-orders/:id", () =>
        HttpResponse.json({ message: "Set a primary address first." }, { status: 400 }),
      ),
    )

    render(<BuyerAutoOrdersPage />)

    await user.click(await screen.findByRole("button", { name: "Resume" }))

    await waitFor(() =>
      expect(toastSpies.error).toHaveBeenCalledWith("Could not update auto order", "Set a primary address first."),
    )
  })

  it("shows the readiness banner and blocks Resume when prerequisites are missing", async () => {
    serveAutoOrders(makeAutoOrder({ id: "ao-1", active: false }))
    serveNotReady()

    render(<BuyerAutoOrdersPage />)

    expect(await screen.findByText("Your auto orders can't run yet")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("button", { name: "Resume" })).toBeDisabled())
  })

  it("removes a schedule only after the confirmation is accepted", async () => {
    const user = userEvent.setup()
    serveAutoOrders(makeAutoOrder({ id: "ao-1", productName: "Mixing Tips" }))

    render(<BuyerAutoOrdersPage />)

    await user.click(await screen.findByRole("button", { name: "Remove" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("heading", { level: 3, name: "Remove this auto order?" })).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Keep it" }))
    expect(screen.getByRole("heading", { name: "Mixing Tips" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Remove" }))
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Auto order removed"))
    expect(screen.queryByRole("heading", { name: "Mixing Tips" })).not.toBeInTheDocument()
  })

  it("reports a failed load instead of showing an empty list silently", async () => {
    server.use(http.get("*/backend-api/auto-orders", () => new HttpResponse(null, { status: 500 })))

    render(<BuyerAutoOrdersPage />)

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Failed to load auto orders", expect.any(String)))
  })
})
