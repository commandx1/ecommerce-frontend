import Link from "next/link"

export default function ResetPasswordFooterLink() {
  return (
    <div className="mt-8 text-center">
      <Link href="/login" className="text-sm text-text-muted transition-colors hover:text-brand">
        Cancel and go back
      </Link>
    </div>
  )
}
