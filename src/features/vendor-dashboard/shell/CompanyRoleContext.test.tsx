import { QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeCompanyProfile } from "@/test/factories/user.factory"
import { createTestQueryClient } from "@/test/render"
import { CompanyRoleProvider, useCompanyRole } from "./CompanyRoleContext"

/**
 * `useCompanyRole` now reads the shared `company.me` Query cache (Phase 4 C3b/D1), so it needs a
 * `QueryClientProvider` above it. Each call gets its own fresh client (`gcTime: 0` matches the
 * app default), same isolation `renderHook(..., { wrapper: CompanyRoleProvider })` gave before.
 */
function renderCompanyRole() {
  const client = createTestQueryClient()
  return renderHook(() => useCompanyRole(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>
        <CompanyRoleProvider>{children}</CompanyRoleProvider>
      </QueryClientProvider>
    ),
  })
}

describe("CompanyRoleContext", () => {
  it("throws a descriptive error when used outside CompanyRoleProvider", () => {
    expect(() => renderHook(() => useCompanyRole())).toThrow("useCompanyRole must be used within a CompanyRoleProvider")
  })

  it("starts in a loading state with null role/name before the fetch resolves", () => {
    const { result } = renderCompanyRole()

    expect(result.current.isLoading).toBe(true)
    expect(result.current.companyRole).toBeNull()
    expect(result.current.companyName).toBeNull()
  })

  it("resolves companyRole and companyName from the company API", async () => {
    server.use(
      http.get("*/backend-api/companies/me", () =>
        HttpResponse.json(makeCompanyProfile({ companyRole: "MANAGER", name: "Vendor Co" })),
      ),
    )

    const { result } = renderCompanyRole()

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.companyRole).toBe("MANAGER")
    expect(result.current.companyName).toBe("Vendor Co")
  })

  it("trims the company name and falls back to null when it is blank", async () => {
    server.use(
      http.get("*/backend-api/companies/me", () => HttpResponse.json(makeCompanyProfile({ name: "  Padded Co  " }))),
    )

    const { result } = renderCompanyRole()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.companyName).toBe("Padded Co")
  })

  it("falls back to null companyName when the API returns a whitespace-only name", async () => {
    server.use(http.get("*/backend-api/companies/me", () => HttpResponse.json(makeCompanyProfile({ name: "   " }))))

    const { result } = renderCompanyRole()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.companyName).toBeNull()
  })

  it("resets role and name to null when the company fetch fails", async () => {
    server.use(http.get("*/backend-api/companies/me", () => HttpResponse.json({ message: "nope" }, { status: 500 })))

    const { result } = renderCompanyRole()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.companyRole).toBeNull()
    expect(result.current.companyName).toBeNull()
  })

  it("re-fetches and can change the resolved role when the provider is remounted", async () => {
    server.use(
      http.get("*/backend-api/companies/me", () => HttpResponse.json(makeCompanyProfile({ companyRole: "OWNER" }))),
    )

    const first = renderCompanyRole()
    await waitFor(() => expect(first.result.current.isLoading).toBe(false))
    expect(first.result.current.companyRole).toBe("OWNER")
    first.unmount()

    server.use(
      http.get("*/backend-api/companies/me", () => HttpResponse.json(makeCompanyProfile({ companyRole: "MEMBER" }))),
    )

    const second = renderCompanyRole()
    await waitFor(() => expect(second.result.current.isLoading).toBe(false))
    expect(second.result.current.companyRole).toBe("MEMBER")
  })
})
