import Link from "next/link"

export default function ResetPasswordFooterLink() {
  return (
    <div className="mt-8 text-center">
      <Link href="/login" className="text-gray-500 hover:text-steel-blue text-sm">
        Cancel and go back
      </Link>
    </div>
  )
}
