import ThemeToggle from "@/components/theme/ThemeToggle"
import VerifyEmailContent from "@/features/verify-email/components/VerifyEmailContent"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 font-inter">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full">
        <VerifyEmailContent />
      </div>
    </div>
  )
}
