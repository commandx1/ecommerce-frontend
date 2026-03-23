import Link from "next/link"

export default function ForgotPasswordFooterLink() {
  return (
    <div className="mt-8 text-center">
      <p className="text-gray-600">
        Remember your password?{" "}
        <Link href="/login" className="text-steel-blue hover:text-blue-700 font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  )
}
