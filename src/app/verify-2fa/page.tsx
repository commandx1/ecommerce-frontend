import { Suspense } from "react"
import Verify2FAPage from "./components/Verify2FAPage"

function Verify2FAContent() {
  return <Verify2FAPage />
}

export default function Page() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-light-mint-gray flex items-center justify-center">Loading...</div>}
    >
      <Verify2FAContent />
    </Suspense>
  )
}
