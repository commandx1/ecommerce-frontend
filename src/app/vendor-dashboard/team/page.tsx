"use client"

import { Info, Mail, ShieldCheck, UserPlus, Users } from "lucide-react"
import { useId, useState } from "react"
import NoticeBanner from "@/components/feedback/NoticeBanner"
import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showToast } from "@/components/ui/Toast"
import { type InvitableCompanyRole, inviteCompanyUser } from "@/lib/api/company"
import { ApiRequestError } from "@/lib/api/request"
import { useCompanyRole } from "../CompanyRoleContext"

const ROLE_DESCRIPTIONS: Record<InvitableCompanyRole, string> = {
  MANAGER: "Can manage products, orders, and promotions on behalf of the company.",
  MEMBER: "Can view and support day-to-day operations with limited access.",
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function VendorTeamPage() {
  const { companyRole, isLoading } = useCompanyRole()
  const emailId = useId()
  const roleId = useId()

  const [email, setEmail] = useState("")
  const [role, setRole] = useState<InvitableCompanyRole>("MEMBER")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setEmail("")
    setRole("MEMBER")
    setEmailError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setEmailError("Email is required.")
      return
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError("Enter a valid email address.")
      return
    }
    setEmailError(null)

    setIsSubmitting(true)
    try {
      await inviteCompanyUser({ email: trimmedEmail, companyRole: role })
      showToast.success("Invitation sent", `An invitation email was sent to ${trimmedEmail}.`)
      resetForm()
    } catch (error) {
      const message = error instanceof ApiRequestError ? error.message : "Please try again."
      showToast.error("Failed to send invitation", message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-surface-muted" />
          <div className="h-4 w-72 rounded bg-surface-muted" />
        </div>
        <div className="rounded-2xl border border-border-soft bg-surface-elevated p-6 shadow-soft">
          <div className="space-y-4">
            <div className="h-11 w-full rounded-2xl bg-surface-muted" />
            <div className="h-11 w-full rounded-2xl bg-surface-muted" />
            <div className="h-11 w-40 rounded-full bg-surface-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (companyRole !== "OWNER") {
    return (
      <>
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Team</h1>
          <p className="mt-1 text-text-secondary">Invite people to join your company.</p>
        </section>
        <NoticeBanner
          tone="warning"
          title="Owner access required"
          description="Only the company OWNER can invite team members. Ask your company owner to send invitations."
        />
      </>
    )
  }

  return (
    <>
      <section className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
            <Users className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Team</h1>
            <p className="mt-1 text-text-secondary">Invite managers and members to join your company.</p>
          </div>
        </div>
      </section>

      <section className="max-w-xl overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
        <div className="flex items-center gap-2 border-b border-border-soft px-6 py-4">
          <UserPlus className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold text-text-primary">Invite a team member</h2>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <Label htmlFor={emailId}>Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id={emailId}
                type="email"
                autoComplete="off"
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                aria-invalid={emailError ? true : undefined}
              />
            </div>
            {emailError ? <p className="text-xs font-medium text-danger">{emailError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={roleId}>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as InvitableCompanyRole)}>
              <SelectTrigger id={roleId} className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-text-muted">{ROLE_DESCRIPTIONS[role]}</p>
          </div>

          <AsyncSubmitButton
            idleText="Send invitation"
            submittingText="Sending…"
            isSubmitting={isSubmitting}
            fullWidth={false}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </form>

        <div className="flex items-start gap-2.5 border-t border-border-soft bg-surface px-6 py-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
          <p className="text-xs leading-relaxed text-text-muted">
            The invited person completes their registration through the link in the invitation email. Invitations expire
            after 1 day. If needed, you can resend an invitation to the same email — please wait at least 5 minutes
            between attempts.
          </p>
        </div>
      </section>
    </>
  )
}
