import { Suspense } from "react"
import RegisterForm from "@/features/register/components/RegisterForm"
import RegisterHeader from "@/features/register/components/RegisterHeader"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-canvas font-sans">
      <RegisterHeader />

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-border-soft bg-surface-elevated shadow-panel">
            <Suspense fallback={<div className="p-12" />}>
              <RegisterForm />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  )
}
