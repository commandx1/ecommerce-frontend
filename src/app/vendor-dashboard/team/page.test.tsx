import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { makeCompanyProfile } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import { CompanyRoleProvider } from "../CompanyRoleContext"
import VendorTeamPage from "./page"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const serveCompanyRole = (companyRole: "OWNER" | "MANAGER" | "MEMBER") => {
  server.use(http.get("*/backend-api/companies/me", () => HttpResponse.json(makeCompanyProfile({ companyRole }))))
}

const renderTeamPage = () =>
  render(
    <CompanyRoleProvider>
      <VendorTeamPage />
    </CompanyRoleProvider>,
  )

beforeEach(() => {
  vi.restoreAllMocks()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
})

describe("VendorTeamPage", () => {
  it("lets the company owner invite a team member", async () => {
    const user = userEvent.setup()
    serveCompanyRole("OWNER")
    let payload: Record<string, unknown> | null = null
    server.use(
      http.post("*/backend-api/mail/invite-company-user", async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 200 })
      }),
    )

    renderTeamPage()

    await user.type(await screen.findByLabelText("Email address"), "teammate@company.com")
    await user.click(screen.getByRole("button", { name: /Send invitation/ }))

    await waitFor(() =>
      expect(toastSpies.success).toHaveBeenCalledWith(
        "Invitation sent",
        "An invitation email was sent to teammate@company.com.",
      ),
    )
    expect(payload).toEqual({ email: "teammate@company.com", companyRole: "MEMBER" })
    expect(screen.getByLabelText("Email address")).toHaveValue("")
  })

  it("blocks anyone who is not the company owner", async () => {
    serveCompanyRole("MANAGER")

    renderTeamPage()

    expect(await screen.findByText("Owner access required")).toBeInTheDocument()
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument()
  })

  it("requires an email address before calling the backend", async () => {
    const user = userEvent.setup()
    serveCompanyRole("OWNER")
    const invited = vi.fn()
    server.use(
      http.post("*/backend-api/mail/invite-company-user", () => {
        invited()
        return new HttpResponse(null, { status: 200 })
      }),
    )

    renderTeamPage()

    await user.click(await screen.findByRole("button", { name: /Send invitation/ }))

    expect(await screen.findByText("Email is required.")).toBeInTheDocument()
    expect(invited).not.toHaveBeenCalled()
  })

  it("never sends an invitation to a malformed email address", async () => {
    const user = userEvent.setup()
    serveCompanyRole("OWNER")
    const invited = vi.fn()
    server.use(
      http.post("*/backend-api/mail/invite-company-user", () => {
        invited()
        return new HttpResponse(null, { status: 200 })
      }),
    )

    renderTeamPage()

    const emailInput = await screen.findByLabelText("Email address")
    await user.type(emailInput, "not-an-email")
    await user.click(screen.getByRole("button", { name: /Send invitation/ }))

    // `type="email"` blocks the submit first, so the component's own
    // "Enter a valid email address." guard never gets a chance to run.
    expect(emailInput).toHaveAttribute("type", "email")
    expect(invited).not.toHaveBeenCalled()
    expect(toastSpies.success).not.toHaveBeenCalled()
  })

  it("surfaces the backend's reason when the invitation cannot be sent", async () => {
    const user = userEvent.setup()
    serveCompanyRole("OWNER")
    server.use(
      http.post("*/backend-api/mail/invite-company-user", () =>
        HttpResponse.json({ message: "This person was invited less than 5 minutes ago." }, { status: 429 }),
      ),
    )

    renderTeamPage()

    await user.type(await screen.findByLabelText("Email address"), "teammate@company.com")
    await user.click(screen.getByRole("button", { name: /Send invitation/ }))

    await waitFor(() =>
      expect(toastSpies.error).toHaveBeenCalledWith(
        "Failed to send invitation",
        "This person was invited less than 5 minutes ago.",
      ),
    )
    // The address is kept so the owner can retry without retyping it
    expect(screen.getByLabelText("Email address")).toHaveValue("teammate@company.com")
  })

  it("describes what the default MEMBER role can do", async () => {
    serveCompanyRole("OWNER")

    renderTeamPage()

    expect(
      await screen.findByText("Can view and support day-to-day operations with limited access."),
    ).toBeInTheDocument()
  })
})
