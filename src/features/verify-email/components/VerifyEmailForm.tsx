import type { ChangeEventHandler, FormEventHandler } from "react"
import { ArrowLeft } from "lucide-react"
import { TextField } from "@/components/form/TextField"

interface VerifyEmailFormProps {
  code: string
  isCodeComplete: boolean
  isSubmitting: boolean
  submitLabel: string
  onCodeChange: ChangeEventHandler<HTMLInputElement>
  onSubmit: FormEventHandler<HTMLFormElement>
  onBackToRegister: () => void
}

export default function VerifyEmailForm({
  code,
  isCodeComplete,
  isSubmitting,
  submitLabel,
  onCodeChange,
  onSubmit,
  onBackToRegister,
}: VerifyEmailFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="mb-6">
        <TextField
          id="code"
          label="Verification Code"
          required
          type="text"
          inputMode="numeric"
          value={code}
          onChange={onCodeChange}
          placeholder="000000"
          maxLength={6}
          disabled={isSubmitting}
          containerClassName="text-center"
          inputClassName="py-4 text-center text-2xl font-bold tracking-widest"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !isCodeComplete}
        className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {submitLabel}
      </button>

      <button
        type="button"
        onClick={onBackToRegister}
        className="w-full flex items-center justify-center text-steel-blue hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to registration
      </button>
    </form>
  )
}
