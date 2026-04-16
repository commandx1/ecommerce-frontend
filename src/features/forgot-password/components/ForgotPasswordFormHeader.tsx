import { Key } from "lucide-react"

interface ForgotPasswordFormHeaderProps {
  title?: string
  description?: string
}

export default function ForgotPasswordFormHeader({
  title = "Reset Your Password",
  description = "Enter your email address and we'll send you instructions to reset your password.",
}: ForgotPasswordFormHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-muted">
        <Key className="h-8 w-8 text-brand" />
      </div>
      <h1 className="mb-3 text-3xl font-bold text-text-primary">{title}</h1>
      <p className="text-lg text-text-secondary">{description}</p>
    </div>
  )
}
