import { Check, Info } from "lucide-react"
import ThemeToggle from "@/components/theme/ThemeToggle"

interface ForgotPasswordSuccessProps {
  email: string
  onSendAgain: () => void
}

export default function ForgotPasswordSuccess({ email, onSendAgain }: ForgotPasswordSuccessProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-3xl border border-border-soft bg-surface-elevated p-8 text-center shadow-panel lg:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
          <Check className="h-10 w-10 text-success" />
        </div>
        <h3 className="mb-4 text-2xl font-bold text-text-primary">Reset Link Sent!</h3>
        <p className="mb-6 text-text-secondary">
          We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox and follow the
          instructions.
        </p>
        <div className="mb-6 rounded-xl border border-border-soft bg-surface-muted p-4">
          <p className="text-sm text-text-secondary">
            <Info className="mr-2 inline-block h-4 w-4 text-brand" />
            The reset link is valid for 24 hours for security reasons.
          </p>
        </div>
        <button
          type="button"
          onClick={onSendAgain}
          className="w-full rounded-xl bg-brand px-6 py-4 font-semibold text-primary-foreground transition-colors hover:bg-brand-strong"
        >
          Send Again
        </button>
      </div>
    </div>
  )
}
