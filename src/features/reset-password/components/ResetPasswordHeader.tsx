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
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="text-steel-blue w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-steel-blue mb-3">{title}</h1>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
