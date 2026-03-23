interface RegisterFormActionsProps {
  isLoading: boolean
}

export default function RegisterFormActions({ isLoading }: RegisterFormActionsProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Creating Account..." : "Create Account"}
    </button>
  )
}
