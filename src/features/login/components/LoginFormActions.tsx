import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"

interface LoginFormActionsProps {
  isSubmitting: boolean
  isFormValid: boolean
}

export default function LoginFormActions({ isSubmitting, isFormValid }: LoginFormActionsProps) {
  return (
    <AsyncSubmitButton
      idleText="Sign In"
      submittingText="Signing In..."
      isSubmitting={isSubmitting}
      disabled={!isFormValid}
      size="lg"
    />
  )
}
