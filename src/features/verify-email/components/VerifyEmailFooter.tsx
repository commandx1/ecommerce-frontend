interface VerifyEmailFooterProps {
  onResendCode: () => void
}

export default function VerifyEmailFooter({ onResendCode }: VerifyEmailFooterProps) {
  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <p className="text-gray-600 text-sm text-center">
        Didn't receive the code?{" "}
        <button type="button" onClick={onResendCode} className="text-steel-blue font-medium hover:underline">
          Resend code
        </button>
      </p>
    </div>
  )
}
