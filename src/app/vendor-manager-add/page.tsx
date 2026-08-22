import { redirect } from "next/navigation"

/**
 * Team member invitation emails (ecommerce-api MailService#sendCompanySignupInvitationEmail)
 * point at /vendor-manager-add?token=... but registration lives on /register.
 * Forward the invite there with the role preselected, since this link is only ever
 * sent to MANAGER/MEMBER invitees.
 */
export default async function VendorManagerAddPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const token = typeof params.token === "string" ? params.token : ""

  if (!token) {
    redirect("/register")
  }

  const query = new URLSearchParams({ token, role: "TEAM_MEMBER" })

  if (typeof params.email === "string" && params.email) {
    query.set("email", params.email)
  }

  redirect(`/register?${query.toString()}`)
}
