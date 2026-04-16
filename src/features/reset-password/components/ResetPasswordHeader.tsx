import { Lock } from "lucide-react"

interface ResetPasswordHeaderProps {
  title?: string
  description?: string
}

export default function ResetPasswordHeader({
  title = "Set New Password",
  description = "Please enter a new and secure password for your account.",
}: ResetPasswordHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-muted">
        <Lock className="h-8 w-8 text-brand" />
      </div>
      <h1 className="mb-3 text-3xl font-bold text-text-primary">{title}</h1>
      <p className="text-text-secondary">{description}</p>
    </div>
  )
}
