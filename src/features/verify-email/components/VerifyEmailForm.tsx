import { ArrowLeft } from "lucide-react"
import type { ChangeEventHandler, FormEventHandler } from "react"
import { useId } from "react"
import { TextField } from "@/components/form/TextField"
import ActionButton from "@/components/ui/ActionButton"
import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"

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
  const id = useId()

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-6">
        <TextField
          id={`${id}-code`}
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

      <AsyncSubmitButton
        idleText={submitLabel}
        submittingText={submitLabel}
        isSubmitting={isSubmitting}
        disabled={!isCodeComplete}
        size="lg"
        className="mb-4"
      />

      <ActionButton type="button" onClick={onBackToRegister} intent="ghost" fullWidth className="justify-center">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to registration
      </ActionButton>
    </form>
  )
}
