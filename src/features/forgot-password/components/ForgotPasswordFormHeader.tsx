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
      <div className="w-20 h-20 bg-light-mint-gray rounded-full flex items-center justify-center mx-auto mb-6">
        <Key className="text-steel-blue w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-steel-blue mb-3">{title}</h1>
      <p className="text-gray-600 text-lg">{description}</p>
    </div>
  )
}
