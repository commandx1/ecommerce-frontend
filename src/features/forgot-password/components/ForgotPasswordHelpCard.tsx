import { Info } from "lucide-react"

export default function ForgotPasswordHelpCard() {
  return (
    <div className="mt-8 p-6 bg-light-mint-gray rounded-2xl">
      <div className="flex items-start space-x-3">
        <Info className="text-steel-blue mt-1 w-5 h-5" />
        <div className="text-sm text-gray-700">
          <p className="font-medium mb-1">Can't find the email?</p>
          <p>Check your spam folder or contact our support team.</p>
        </div>
      </div>
    </div>
  )
}
