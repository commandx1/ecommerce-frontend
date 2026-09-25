import Link from "next/link"
import type { ChangeEvent, FormEvent } from "react"
import ResetPasswordForm from "@/features/reset-password/components/ResetPasswordForm"
import ResetPasswordHeader from "@/features/reset-password/components/ResetPasswordHeader"

interface ResetPasswordCardProps {
  password: string
  confirmPassword: string
  isSubmitting: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function ResetPasswordCard({
  password,
  confirmPassword,
  isSubmitting,
  onChange,
  onSubmit,
}: ResetPasswordCardProps) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-border-soft bg-surface-elevated p-8 shadow-panel lg:p-12">
      <ResetPasswordHeader />
      <ResetPasswordForm
        password={password}
        confirmPassword={confirmPassword}
        isSubmitting={isSubmitting}
        onChange={onChange}
        onSubmit={onSubmit}
      />
      <div className="mt-8 text-center">
        <Link href="/login" className="text-sm text-text-muted transition-colors hover:text-brand">
          Cancel and go back
        </Link>
      </div>
    </div>
  )
}
