import { Suspense } from "react"
import ResetPasswordPage from "./components/ResetPasswordPage"

function ResetPasswordContent() {
  return <ResetPasswordPage />
}

export default function Page() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-light-mint-gray flex items-center justify-center">Loading...</div>}
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
