import { waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeCompanyProfile } from "@/test/factories/user.factory"
import { render } from "@/test/render"
import { CompanyRoleProvider } from "./CompanyRoleContext"
import ImpersonationTabTitle from "./ImpersonationTabTitle"

const renderTitle = (route = "/vendor-dashboard") =>
  render(
    <CompanyRoleProvider>
      <ImpersonationTabTitle />
    </CompanyRoleProvider>,
    { route },
  )

beforeEach(() => {
  useAuthStore.setState({
    user: makeAccountUser({ name: "Jane", surname: "Doe" }),
    isAuthenticated: true,
    isAdminImpersonating: true,
  })
})

describe("ImpersonationTabTitle", () => {
  it("sets the tab title to `companyName - fullName` while impersonating", async () => {
    server.use(
      http.get("*/backend-api/companies/me", () => HttpResponse.json(makeCompanyProfile({ name: "Acme Dental" }))),
    )

    renderTitle()

    await waitFor(() => expect(document.title).toBe("Acme Dental - Jane Doe"))
  })

  it("falls back to just the full name when there is no company yet", async () => {
    server.use(http.get("*/backend-api/companies/me", () => HttpResponse.json({ message: "nope" }, { status: 500 })))

    renderTitle()

    await waitFor(() => expect(document.title).toBe("Jane Doe"))
  })

  it("leaves the document title untouched when not impersonating", async () => {
    useAuthStore.setState({ isAdminImpersonating: false })
    document.title = "Dentypro - Dental Supplies"
    server.use(
      http.get("*/backend-api/companies/me", () => HttpResponse.json(makeCompanyProfile({ name: "Acme Dental" }))),
    )

    renderTitle()

    // Give the company fetch a tick to resolve; the title must still be untouched.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(document.title).toBe("Dentypro - Dental Supplies")
  })

  it("re-applies the title after a client-side navigation changes the pathname", async () => {
    server.use(
      http.get("*/backend-api/companies/me", () => HttpResponse.json(makeCompanyProfile({ name: "Acme Dental" }))),
    )

    const { rerender } = renderTitle("/vendor-dashboard/orders")
    await waitFor(() => expect(document.title).toBe("Acme Dental - Jane Doe"))

    // Simulate Next re-applying the page's metadata <title> on navigation, then re-render at
    // the new pathname the way a client-side route change would.
    document.title = "Dentypro - Dental Supplies"
    const { setPathname } = await import("@/test/mocks/next-navigation")
    setPathname("/vendor-dashboard/products")
    rerender(
      <CompanyRoleProvider>
        <ImpersonationTabTitle />
      </CompanyRoleProvider>,
    )

    await waitFor(() => expect(document.title).toBe("Acme Dental - Jane Doe"))
  })
})
