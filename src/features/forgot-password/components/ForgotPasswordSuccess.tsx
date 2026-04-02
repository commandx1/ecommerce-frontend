import { Check, Info } from "lucide-react"

interface ForgotPasswordSuccessProps {
  email: string
  onSendAgain: () => void
}

export default function ForgotPasswordSuccess({ email, onSendAgain }: ForgotPasswordSuccessProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-steel-blue mb-4">Reset Link Sent!</h3>
        <p className="text-gray-600 mb-6">
          We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox and follow the
          instructions.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600">
            <Info className="inline-block w-4 h-4 text-steel-blue mr-2" />
            The reset link is valid for 24 hours for security reasons.
          </p>
        </div>
        <button
          type="button"
          onClick={onSendAgain}
          className="w-full bg-steel-blue text-white py-4 px-6 rounded-xl hover:bg-opacity-90 font-semibold"
        >
          Send Again
        </button>
      </div>
    </div>
  )
}
