import ThemeToggle from "@/components/theme/ThemeToggle"
import VerifyEmailContent from "@/features/verify-email/components/VerifyEmailContent"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-inter flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full">
        <VerifyEmailContent />
      </div>
    </div>
  )
}
