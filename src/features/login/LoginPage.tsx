import LoginForm from "@/features/login/components/LoginForm"
import LoginHeader from "@/features/login/components/LoginHeader"
import LoginSidebar from "@/features/login/components/LoginSidebar"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <LoginHeader />

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <LoginForm />
              <LoginSidebar />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
