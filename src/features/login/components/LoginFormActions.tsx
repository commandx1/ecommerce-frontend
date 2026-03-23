interface LoginFormActionsProps {
  isSubmitting: boolean
  isFormValid: boolean
}

export default function LoginFormActions({ isSubmitting, isFormValid }: LoginFormActionsProps) {
  const label = isSubmitting ? "Signing In..." : "Sign In"

  return (
    <button
      type="submit"
      disabled={isSubmitting || !isFormValid}
      className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  )
}
