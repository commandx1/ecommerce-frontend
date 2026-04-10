import RegisterForm from "@/features/register/components/RegisterForm"
import RegisterHeader from "@/features/register/components/RegisterHeader"
import RegisterSidebar from "@/features/register/components/RegisterSidebar"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-canvas font-sans">
      <RegisterHeader />

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-border-soft bg-surface-elevated shadow-panel">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <RegisterForm />
              <RegisterSidebar />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
