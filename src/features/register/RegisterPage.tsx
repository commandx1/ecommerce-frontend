import RegisterForm from "@/features/register/components/RegisterForm"
import RegisterHeader from "@/features/register/components/RegisterHeader"
import RegisterSidebar from "@/features/register/components/RegisterSidebar"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-light-mint-gray font-inter">
      <RegisterHeader />

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
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
