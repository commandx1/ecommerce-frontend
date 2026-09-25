import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { makeStripeConnectStatus } from "@/test/factories"
import { render, screen, waitFor } from "@/test/render"
import StripeConnectCard from "./StripeConnectCard"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const serveStatus = (status: Partial<ReturnType<typeof makeStripeConnectStatus>>) => {
  server.use(http.get("*/backend-api/stripe/connect/status", () => HttpResponse.json(makeStripeConnectStatus(status))))
}

beforeEach(() => {
  vi.restoreAllMocks()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
})

describe("StripeConnectCard", () => {
  it("shows an Active payout account with a link into the Stripe dashboard", async () => {
    serveStatus({ connected: true, enabled: true, stripeAccountId: "acct_123" })

    render(<StripeConnectCard />)

    expect(await screen.findByText("Active")).toBeInTheDocument()
    expect(screen.getByText("acct_123")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Open Stripe dashboard/ })).toBeInTheDocument()
  })

  it("calls the onboarding flow 'Continue setup' when the account exists but is not enabled", async () => {
    serveStatus({ connected: true, enabled: false })

    render(<StripeConnectCard />)

    expect(await screen.findByText("Setup incomplete")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Continue setup/ })).toBeInTheDocument()
    expect(screen.getByText(/You won't receive payouts until it is complete/)).toBeInTheDocument()
  })

  it("invites a vendor with no Stripe account to set up payouts", async () => {
    serveStatus({ connected: false, enabled: false, stripeAccountId: null as unknown as string })

    render(<StripeConnectCard />)

    expect(await screen.findByText("Not connected")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Set up payouts/ })).toBeInTheDocument()
  })

  it("treats any status failure as 'not available for this account'", async () => {
    server.use(http.get("*/backend-api/stripe/connect/status", () => new HttpResponse(null, { status: 403 })))

    render(<StripeConnectCard />)

    expect(await screen.findByText("Payout account information is not available for this account.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Set up payouts/ })).not.toBeInTheDocument()
  })

  it("redirects the vendor to the Stripe onboarding URL", async () => {
    const user = userEvent.setup()
    serveStatus({ connected: false, enabled: false })
    server.use(
      http.post("*/backend-api/stripe/connect/account", () =>
        HttpResponse.json({
          stripeAccountId: "acct_123",
          onboardingUrl: "https://connect.stripe.com/setup/acct_123",
          stripeAccountEnabled: false,
        }),
      ),
    )

    render(<StripeConnectCard />)

    await user.click(await screen.findByRole("button", { name: /Set up payouts/ }))

    await waitFor(() =>
      expect(window.location.assign).toHaveBeenCalledWith("https://connect.stripe.com/setup/acct_123"),
    )
  })

  it("reports a failure to start onboarding and re-enables the button", async () => {
    const user = userEvent.setup()
    serveStatus({ connected: false, enabled: false })
    server.use(http.post("*/backend-api/stripe/connect/account", () => new HttpResponse(null, { status: 500 })))

    render(<StripeConnectCard />)

    await user.click(await screen.findByRole("button", { name: /Set up payouts/ }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith(expect.any(String)))
    expect(await screen.findByRole("button", { name: /Set up payouts/ })).toBeEnabled()
  })

  it("opens the Stripe dashboard in a new, opener-less tab", async () => {
    const user = userEvent.setup()
    serveStatus({ connected: true, enabled: true })
    server.use(
      http.get("*/backend-api/stripe/connect/login-link", () =>
        HttpResponse.json({ url: "https://connect.stripe.com/express/acct_123" }),
      ),
    )
    const open = vi.spyOn(window, "open").mockImplementation(() => null)

    render(<StripeConnectCard />)

    await user.click(await screen.findByRole("button", { name: /Open Stripe dashboard/ }))

    await waitFor(() =>
      expect(open).toHaveBeenCalledWith("https://connect.stripe.com/express/acct_123", "_blank", "noopener,noreferrer"),
    )
  })
})
