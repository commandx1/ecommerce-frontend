import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"

interface RegisterFormActionsProps {
  isLoading: boolean
}

export default function RegisterFormActions({ isLoading }: RegisterFormActionsProps) {
  return (
    <AsyncSubmitButton
      idleText="Create Account"
      submittingText="Creating Account..."
      isSubmitting={isLoading}
      size="lg"
    />
  )
}
