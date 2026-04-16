import { SendIcon } from "lucide-react"
import type { FormEventHandler } from "react"
import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"
import ForgotPasswordEmailField from "@/features/forgot-password/components/ForgotPasswordEmailField"
import ForgotPasswordFooterLink from "@/features/forgot-password/components/ForgotPasswordFooterLink"
import ForgotPasswordFormHeader from "@/features/forgot-password/components/ForgotPasswordFormHeader"
import ForgotPasswordHelpCard from "@/features/forgot-password/components/ForgotPasswordHelpCard"

interface ForgotPasswordFormProps {
  email: string
  isSubmitting: boolean
  onEmailChange: (value: string) => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

export default function ForgotPasswordForm({ email, isSubmitting, onEmailChange, onSubmit }: ForgotPasswordFormProps) {
  return (
    <div className="p-8 lg:p-12">
      <ForgotPasswordFormHeader />

      <form onSubmit={onSubmit} className="space-y-6">
        <ForgotPasswordEmailField value={email} onChange={onEmailChange} isSubmitting={isSubmitting} />

        <AsyncSubmitButton
          idleText="Send Reset Instructions"
          submittingText="Sending..."
          isSubmitting={isSubmitting}
          size="lg"
          icon={<SendIcon className="h-5 w-5" />}
          className="rounded-xl"
        />
      </form>

      <ForgotPasswordHelpCard />
      <ForgotPasswordFooterLink />
    </div>
  )
}
