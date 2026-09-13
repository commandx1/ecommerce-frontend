import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CompanyProfile, UpdateCompanyPayload } from "@/lib/api/company"
import { server } from "@/mocks/server"
import { makeCompanyProfile } from "@/test/factories"
import { fireEvent, render, screen, waitFor } from "@/test/render"
import CompanyInfoCard from "./CompanyInfoCard"

const toastSpies = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  love: vi.fn(),
  loading: vi.fn(),
}))

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))

const serveCompany = (body: CompanyProfile | { message: string }, status = 200) => {
  server.use(http.get("*/backend-api/companies/me", () => HttpResponse.json(body, { status })))
}

beforeEach(() => {
  vi.restoreAllMocks()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
})

describe("CompanyInfoCard", () => {
  describe("A axis - outgoing payload on save", () => {
    it("sends exactly the eight CompanyUpdateRequest fields, unchanged, when the owner saves without editing", async () => {
      const user = userEvent.setup()
      const company = makeCompanyProfile()
      serveCompany(company)
      let capturedBody: UpdateCompanyPayload | null = null
      server.use(
        http.put("*/backend-api/companies/me", async ({ request }) => {
          capturedBody = (await request.json()) as UpdateCompanyPayload
          return HttpResponse.json(company)
        }),
      )

      render(<CompanyInfoCard />)
      await user.click(await screen.findByRole("button", { name: /Save Changes/i }))

      await waitFor(() => expect(capturedBody).not.toBeNull())
      // Backend `auth/dto/CompanyUpdateRequest.java` declares exactly these eight fields - no
      // `id`, `active`, `createdDate` or `companyRole` (those are response-only / server-owned).
      expect(Object.keys(capturedBody ?? {}).sort()).toEqual(
        ["name", "companyPhoto", "taxNumber", "email", "phoneNumber", "website", "description", "uberEnabled"].sort(),
      )
      expect(capturedBody).toEqual({
        name: company.name,
        companyPhoto: company.companyPhoto ?? "",
        taxNumber: company.taxNumber ?? "",
        email: company.email ?? "",
        phoneNumber: company.phoneNumber ?? "",
        website: company.website ?? "",
        description: company.description ?? "",
        uberEnabled: company.uberEnabled,
      })
    })

    it("sends edited field values verbatim", async () => {
      const user = userEvent.setup()
      serveCompany(makeCompanyProfile())
      let capturedBody: UpdateCompanyPayload | null = null
      server.use(
        http.put("*/backend-api/companies/me", async ({ request }) => {
          capturedBody = (await request.json()) as UpdateCompanyPayload
          return HttpResponse.json(makeCompanyProfile({ name: "New Name Inc" }))
        }),
      )

      render(<CompanyInfoCard />)
      const nameInput = await screen.findByLabelText("Company Name")
      await user.clear(nameInput)
      await user.type(nameInput, "New Name Inc")
      await user.click(screen.getByRole("button", { name: /Save Changes/i }))

      await waitFor(() => expect(capturedBody?.name).toBe("New Name Inc"))
    })

    it("disables every field and hides the save button when the caller is not the company owner", async () => {
      serveCompany(makeCompanyProfile({ companyRole: "MANAGER" }))

      render(<CompanyInfoCard />)

      expect(await screen.findByLabelText("Company Name")).toBeDisabled()
      expect(screen.queryByRole("button", { name: /Save Changes/i })).not.toBeInTheDocument()
      expect(screen.getByText(/Only the company owner can edit/i)).toBeInTheDocument()
    })

    it("renders the Uber Direct checkbox checked when the company has uberEnabled: true", async () => {
      serveCompany(makeCompanyProfile({ uberEnabled: true }))

      render(<CompanyInfoCard />)

      expect(await screen.findByLabelText("Enable Uber Direct delivery")).toBeChecked()
    })

    it("renders the Uber Direct checkbox unchecked when the company has uberEnabled: false", async () => {
      serveCompany(makeCompanyProfile({ uberEnabled: false }))

      render(<CompanyInfoCard />)

      expect(await screen.findByLabelText("Enable Uber Direct delivery")).not.toBeChecked()
    })

    it("disables the Uber Direct checkbox for a non-owner", async () => {
      serveCompany(makeCompanyProfile({ companyRole: "MANAGER" }))

      render(<CompanyInfoCard />)

      expect(await screen.findByLabelText("Enable Uber Direct delivery")).toBeDisabled()
    })

    it("sends uberEnabled: false in the PUT payload after the owner unchecks it and saves", async () => {
      const user = userEvent.setup()
      const company = makeCompanyProfile({ uberEnabled: true })
      serveCompany(company)
      let capturedBody: UpdateCompanyPayload | null = null
      server.use(
        http.put("*/backend-api/companies/me", async ({ request }) => {
          capturedBody = (await request.json()) as UpdateCompanyPayload
          return HttpResponse.json({ ...company, uberEnabled: false })
        }),
      )

      render(<CompanyInfoCard />)
      const checkbox = await screen.findByLabelText("Enable Uber Direct delivery")
      expect(checkbox).toBeChecked()
      await user.click(checkbox)
      await user.click(screen.getByRole("button", { name: /Save Changes/i }))

      await waitFor(() => expect(capturedBody?.uberEnabled).toBe(false))
    })
  })

  describe("B axis - incoming fields are consumed or intentionally ignored", () => {
    it("renders active/inactive status, role badge and member-since date from the response", async () => {
      serveCompany(makeCompanyProfile({ active: true, companyRole: "OWNER", createdDate: "2026-03-15T00:00:00Z" }))

      render(<CompanyInfoCard />)

      expect(await screen.findByText("Active")).toBeInTheDocument()
      expect(screen.getByText("OWNER")).toBeInTheDocument()
      expect(screen.getByText(/Company since Mar 15, 2026/)).toBeInTheDocument()
    })

    it("shows the inactive badge and omits the role pill when companyRole is null", async () => {
      serveCompany(makeCompanyProfile({ active: false, companyRole: null }))

      render(<CompanyInfoCard />)

      expect(await screen.findByText("Inactive")).toBeInTheDocument()
      expect(screen.queryByText("OWNER")).not.toBeInTheDocument()
    })
  })

  describe("C axis - hostile data", () => {
    it("shows the owner-only empty state, not a raw error, when the caller has no company (404)", async () => {
      serveCompany({ message: "Not found" }, 404)

      render(<CompanyInfoCard />)

      expect(await screen.findByText("No company information on file yet.")).toBeInTheDocument()
      expect(screen.queryByLabelText("Company Name")).not.toBeInTheDocument()
    })

    it("shows a retry affordance instead of crashing on a 500", async () => {
      const user = userEvent.setup()
      serveCompany({ message: "Server error" }, 500)

      render(<CompanyInfoCard />)

      expect(await screen.findByRole("button", { name: /Try again/i })).toBeInTheDocument()
      serveCompany(makeCompanyProfile())
      await user.click(screen.getByRole("button", { name: /Try again/i }))
      expect(await screen.findByLabelText("Company Name")).toBeInTheDocument()
    })

    it("recovers instead of crashing on a network failure", async () => {
      server.use(http.get("*/backend-api/companies/me", () => HttpResponse.error()))

      render(<CompanyInfoCard />)

      expect(await screen.findByRole("button", { name: /Try again/i })).toBeInTheDocument()
    })

    it("tolerates every nullable field being null without crashing", async () => {
      serveCompany(
        makeCompanyProfile({
          companyPhoto: null,
          taxNumber: null,
          email: null,
          phoneNumber: null,
          website: null,
          description: null,
        }),
      )

      render(<CompanyInfoCard />)

      expect(await screen.findByLabelText("Company Name")).toBeInTheDocument()
      expect(screen.getByLabelText("Company Email")).toHaveValue("")
      expect(screen.getByLabelText("Website")).toHaveValue("")
    })

    it("falls back to the plain input, not a broken <Image>, when the logo URL is not a valid absolute http(s) URL", async () => {
      serveCompany(makeCompanyProfile({ companyPhoto: "not-a-url" }))

      const { container } = render(<CompanyInfoCard />)

      await waitFor(() => expect(screen.getByLabelText("Company Logo URL")).toHaveValue("not-a-url"))
      expect(container.querySelector("img")).not.toBeInTheDocument()
    })

    it("shows the plain input again, not a broken image icon, once a rendered logo URL fails to load", async () => {
      serveCompany(makeCompanyProfile({ companyPhoto: "https://cdn.example.com/logo.png" }))

      const { container } = render(<CompanyInfoCard />)

      await screen.findByLabelText("Company Logo URL")
      const logo = await waitFor(() => {
        const img = container.querySelector("img")
        if (!img) throw new Error("logo image not rendered yet")
        return img
      })
      fireEvent.error(logo)

      await waitFor(() => expect(container.querySelector("img")).not.toBeInTheDocument())
    })

    it("defaults the Uber Direct checkbox to checked when the GET response omits uberEnabled entirely", async () => {
      const { uberEnabled: _uberEnabled, ...companyWithoutUberEnabled } = makeCompanyProfile()
      serveCompany(companyWithoutUberEnabled as CompanyProfile)

      render(<CompanyInfoCard />)

      expect(await screen.findByLabelText("Enable Uber Direct delivery")).toBeChecked()
    })

    it("shows a friendly error, not the raw backend message, when saving fails", async () => {
      const user = userEvent.setup()
      serveCompany(makeCompanyProfile({ companyRole: "OWNER" }))
      server.use(
        http.put("*/backend-api/companies/me", () =>
          HttpResponse.json({ message: "Tax number already exists" }, { status: 400 }),
        ),
      )

      render(<CompanyInfoCard />)
      await user.click(await screen.findByRole("button", { name: /Save Changes/i }))

      await waitFor(() => expect(toastSpies.error).toHaveBeenCalled())
      // Keeps the form intact/editable instead of losing the owner's unsaved changes
      expect(await screen.findByLabelText("Company Name")).toBeEnabled()
    })
  })
})
