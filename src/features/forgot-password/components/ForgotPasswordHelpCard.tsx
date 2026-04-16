import { Info } from "lucide-react"

export default function ForgotPasswordHelpCard() {
  return (
    <div className="mt-8 rounded-2xl border border-border-soft bg-surface-muted p-6">
      <div className="flex items-start space-x-3">
        <Info className="mt-1 h-5 w-5 text-brand" />
        <div className="text-sm text-text-secondary">
          <p className="font-medium mb-1">Can't find the email?</p>
          <p>Check your spam folder or contact our support team.</p>
        </div>
      </div>
    </div>
  )
}
