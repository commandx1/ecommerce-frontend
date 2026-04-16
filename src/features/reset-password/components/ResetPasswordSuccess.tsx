import { Check } from "lucide-react"
import Link from "next/link"
import ThemeToggle from "@/components/theme/ThemeToggle"

export default function ResetPasswordSuccess() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-3xl border border-border-soft bg-surface-elevated p-8 text-center shadow-panel lg:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
          <Check className="h-10 w-10 text-success" />
        </div>
        <h3 className="mb-4 text-2xl font-bold text-text-primary">Password Updated Successfully!</h3>
        <p className="mb-8 text-text-secondary">
          You can now sign in with your new password. Redirecting to login page...
        </p>
        <Link
          href="/login"
          className="inline-block w-full rounded-xl bg-brand px-6 py-4 font-semibold text-primary-foreground transition-colors hover:bg-brand-strong"
        >
          Sign In Now
        </Link>
      </div>
    </div>
  )
}
