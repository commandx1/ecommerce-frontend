import type { ChangeEvent, FormEvent } from "react"
import ResetPasswordFooterLink from "@/features/reset-password/components/ResetPasswordFooterLink"
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
    <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 max-w-md w-full">
      <ResetPasswordHeader />
      <ResetPasswordForm
        password={password}
        confirmPassword={confirmPassword}
        isSubmitting={isSubmitting}
        onChange={onChange}
        onSubmit={onSubmit}
      />
      <ResetPasswordFooterLink />
    </div>
  )
}
