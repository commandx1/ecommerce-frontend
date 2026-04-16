import Link from "next/link"

export default function ForgotPasswordFooterLink() {
  return (
    <div className="mt-8 text-center">
      <p className="text-text-secondary">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand transition-colors hover:text-brand-strong hover:underline"
        >
          Sign In
        </Link>
      </p>
    </div>
  )
}
