interface LoginFormOptionsProps {
  rememberMe: boolean
  onRememberMeChange: (value: boolean) => void
  onForgotPassword: () => void
  isSubmitting: boolean
}

export default function LoginFormOptions({
  rememberMe,
  onRememberMeChange,
  onForgotPassword,
  isSubmitting,
}: LoginFormOptionsProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => onRememberMeChange(event.target.checked)}
          className="w-4 h-4 text-steel-blue border-gray-300 rounded focus:ring-steel-blue cursor-pointer"
          disabled={isSubmitting}
        />
        <span className="ml-2 text-sm text-gray-600">Remember me</span>
      </label>
      <button
        type="button"
        onClick={onForgotPassword}
        className="text-sm text-steel-blue hover:underline font-medium"
        disabled={isSubmitting}
      >
        Forgot password?
      </button>
    </div>
  )
}
