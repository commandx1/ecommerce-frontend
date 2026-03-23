import { Mail } from "lucide-react"

interface VerifyEmailHeaderProps {
  email: string
}

export default function VerifyEmailHeader({ email }: VerifyEmailHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="text-white w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-steel-blue mb-3">Email Verification</h1>
      <p className="text-gray-600">
        Enter the 6-digit verification code sent to <span className="font-medium">{email}</span>
      </p>
    </div>
  )
}
