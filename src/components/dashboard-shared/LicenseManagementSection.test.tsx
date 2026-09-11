import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { makeLicense } from "@/test/factories"
import { render, screen, waitFor, within } from "@/test/render"
import LicenseManagementCard from "./LicenseManagementCard"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const serveLicenses = (...licenses: ReturnType<typeof makeLicense>[]) => {
  server.use(http.get("*/backend-api/licenses", () => HttpResponse.json({ licenses, total: licenses.length })))
}

beforeEach(() => {
  vi.restoreAllMocks()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
})

describe("LicenseManagementCard", () => {
  it("shows an approved license with its state spelled out", async () => {
    serveLicenses(
      makeLicense({
        id: "l-1",
        licenseType: "STATE_DENTAL",
        stateOfLicense: "NY",
        licenseNumber: "DDS-1",
        approved: true,
      }),
    )

    render(<LicenseManagementCard />)

    expect(await screen.findByText("Approved")).toBeInTheDocument()
    expect(screen.getByText(/New York \(NY\)/)).toBeInTheDocument()
    expect(screen.getByText(/DDS-1/)).toBeInTheDocument()
  })

  it("marks a pending license as awaiting review", async () => {
    serveLicenses(makeLicense({ id: "l-1", approved: null as unknown as boolean }))

    render(<LicenseManagementCard />)

    expect(await screen.findByText("Pending")).toBeInTheDocument()
  })

  it("shows the rejection reason for a rejected license", async () => {
    serveLicenses(makeLicense({ id: "l-1", approved: false, rejectDescription: "The scan was unreadable." }))

    render(<LicenseManagementCard />)

    expect(await screen.findByText("Rejected")).toBeInTheDocument()
    expect(screen.getByText("The scan was unreadable.")).toBeInTheDocument()
  })

  it("calls out an expired license", async () => {
    serveLicenses(makeLicense({ id: "l-1", expired: true, year: 2020, month: 1, day: 5 }))

    render(<LicenseManagementCard />)

    expect(await screen.findByText(/^Expired/)).toBeInTheDocument()
  })

  it("offers a first-license shortcut when the list is empty", async () => {
    const user = userEvent.setup()
    serveLicenses()

    render(<LicenseManagementCard />)

    await user.click(await screen.findByRole("button", { name: "Add your first license" }))
    expect(screen.getByRole("heading", { level: 3, name: "Add License" })).toBeInTheDocument()
  })

  it("submits a state dental license with the expiration split into y/m/d", async () => {
    const user = userEvent.setup()
    serveLicenses()

    let payload: Record<string, unknown> | null = null
    server.use(
      http.post("*/backend-api/licenses", async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(makeLicense())
      }),
    )

    render(<LicenseManagementCard />)

    await user.click(await screen.findByRole("button", { name: "Add license" }))
    await user.type(screen.getByLabelText("License Number"), "  DDS-99  ")
    await user.type(screen.getByLabelText("Expiration Date"), "2030-06-15")

    // The default type is STATE_DENTAL and no state has been chosen yet.
    await user.click(screen.getByRole("button", { name: "Save License" }))
    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("State of license is required"))
    expect(payload).toBeNull()
  })

  it("rejects a blank license number before hitting the API", async () => {
    const user = userEvent.setup()
    serveLicenses()
    const created = vi.fn()
    server.use(
      http.post("*/backend-api/licenses", () => {
        created()
        return HttpResponse.json(makeLicense())
      }),
    )

    render(<LicenseManagementCard />)

    await user.click(await screen.findByRole("button", { name: "Add license" }))
    await user.click(screen.getByRole("button", { name: "Save License" }))

    // `required` stops the submit before the component's own guard runs
    expect(screen.getByLabelText("License Number")).toBeRequired()
    expect(created).not.toHaveBeenCalled()
  })

  it("deletes a license only after the confirmation is accepted", async () => {
    const user = userEvent.setup()
    serveLicenses(makeLicense({ id: "l-1" }))
    const deleted = vi.fn()
    server.use(
      http.delete("*/backend-api/licenses/:id", () => {
        deleted()
        return new HttpResponse(null, { status: 200 })
      }),
    )

    render(<LicenseManagementCard />)

    await user.click(await screen.findByRole("button", { name: /Delete/ }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    expect(deleted).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: /Delete/ }))
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("License deleted successfully"))
  })

  it("reports a failed load", async () => {
    server.use(http.get("*/backend-api/licenses", () => new HttpResponse(null, { status: 500 })))

    render(<LicenseManagementCard />)

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("An error occurred while loading licenses"))
  })
})
