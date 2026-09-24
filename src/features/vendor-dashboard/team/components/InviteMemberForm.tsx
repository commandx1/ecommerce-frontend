import { Info, Mail, ShieldCheck, UserPlus } from "lucide-react"
import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { InvitableCompanyRole } from "@/lib/api/company"
import type { InviteMemberFormViewModel } from "../hooks/useInviteMemberForm"

const ROLE_DESCRIPTIONS: Record<InvitableCompanyRole, string> = {
  MANAGER: "Can manage products, orders, and promotions on behalf of the company.",
  MEMBER: "Can view and support day-to-day operations with limited access.",
}

export default function InviteMemberForm({
  emailId,
  roleId,
  email,
  setEmail,
  role,
  setRole,
  emailError,
  isSubmitting,
  handleSubmit,
}: InviteMemberFormViewModel) {
  return (
    <SurfaceCard as="section" variant="glass" className="max-w-xl overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border-soft px-6 py-4">
        <UserPlus className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-semibold text-text-primary">Invite a team member</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
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
    </SurfaceCard>
  )
}
