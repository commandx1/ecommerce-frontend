import { Mail } from "lucide-react"

interface VerifyEmailHeaderProps {
  email: string
}

export default function VerifyEmailHeader({ email }: VerifyEmailHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="text-primary-foreground w-7 h-7 sm:w-8 sm:h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-brand mb-3">Email Verification</h1>
      <p className="text-text-secondary">
        Enter the 6-digit verification code sent to <span className="font-medium">{email}</span>
      </p>
    </div>
  )
}
