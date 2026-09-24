"use client"

import { useId, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { type InvitableCompanyRole, inviteCompanyUser } from "@/lib/api/company"
import { ApiRequestError } from "@/lib/api/request"
import { validateInviteEmail } from "../lib/invite-validation"

export interface InviteMemberFormViewModel {
  emailId: string
  roleId: string
  email: string
  setEmail: (value: string) => void
  role: InvitableCompanyRole
  setRole: (value: InvitableCompanyRole) => void
  emailError: string | null
  isSubmitting: boolean
  handleSubmit: (event: React.FormEvent) => void
}

export function useInviteMemberForm(): InviteMemberFormViewModel {
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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    const validationError = validateInviteEmail(email)
    if (validationError) {
      setEmailError(validationError)
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

  return {
    emailId,
    roleId,
    email,
    setEmail,
    role,
    setRole,
    emailError,
    isSubmitting,
    handleSubmit: (event: React.FormEvent) => void submit(event),
  }
}
