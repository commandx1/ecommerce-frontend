import type { FormEventHandler } from "react"
import { SendIcon } from "lucide-react"
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

export default function ForgotPasswordForm({
  email,
  isSubmitting,
  onEmailChange,
  onSubmit,
}: ForgotPasswordFormProps) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
      <ForgotPasswordFormHeader />

      <form onSubmit={onSubmit} className="space-y-6">
        <ForgotPasswordEmailField value={email} onChange={onEmailChange} isSubmitting={isSubmitting} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-steel-blue text-white py-4 px-6 rounded-xl hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue font-semibold text-lg transition-all flex items-center justify-center disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Send Reset Instructions"}
          <SendIcon className="ml-2 w-5 h-5" />
        </button>
      </form>

      <ForgotPasswordHelpCard />
      <ForgotPasswordFooterLink />
    </div>
  )
}
