import { Check } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-steel-blue mb-4">Password Updated Successfully!</h3>
        <p className="text-gray-600 mb-8">You can now sign in with your new password. Redirecting to login page...</p>
        <Link
          href="/login"
          className="inline-block w-full bg-steel-blue text-white py-4 px-6 rounded-xl hover:bg-opacity-90 font-semibold"
        >
          Sign In Now
        </Link>
      </div>
    </div>
  )
}
