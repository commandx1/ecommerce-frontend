"use client"

import { Award, Percent, Shield, TrendingUp, Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
// import { authAPI, type LoginPayload } from "@/lib/api/auth"
import { authAPIDirect as authAPI, type LoginPayload } from "@/lib/api/auth-direct"
import { useAuthStore } from "@/stores/authStore"

const LoginPage = () => {
  const router = useRouter()
  const { setUser, setTokens, setError: setAuthError } = useAuthStore()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError("")
    setAuthError(null)

    try {
      const payload: LoginPayload = {
        ...formData,
        device: "windows",
      }

      // biome-ignore lint/suspicious/noExplicitAny: Response type includes dynamic fields from backend
      const response: any = await authAPI.login(payload)

      // Tokenleri kaydet
      if (response.accessToken && response.refreshToken) {
        setTokens(response.accessToken, response.refreshToken)
      }

      // Kullanıcı bilgilerini kaydet
      const userData = {
        id: response.id,
        name: response.name,
        surname: response.surname,
        email: response.email,
        phoneNumber: response.phoneNumber,
        emailConfirmed: response.emailConfirmed,
        phoneNumberConfirmed: response.phoneNumberConfirmed,
        twoFactorEnabled: response.twoFactorEnabled,
        lockoutEnd: response.lockoutEnd,
        createdDate: response.createdDate,
      }
      setUser(userData)

      // Ana sayfaya yönlendir
      router.push("/")
    } catch (error: unknown) {
      const err = error as { message?: string }

      if (
        err.message?.includes("Email doğrulanmamış") ||
        (err.message?.includes("email") && err.message?.includes("verified"))
      ) {
        setNeedsEmailVerification(true)
        setError(err.message)
      } else if (err.message?.includes("Account is Temporarily locked") || err.message?.includes("locked")) {
        setError("Your account is temporarily locked. Please try again later.")
      } else if (err.message?.includes("Invalid email or password") || err.message?.includes("Invalid")) {
        setError("Invalid email or password")
      } else {
        setError(err.message || "An error occurred during sign in")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError("")
  }

  const handleVerifyEmail = () => {
    router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
  }

  return (
    <div className="min-h-screen bg-light-mint-gray font-inter">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-steel-blue rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">🦷</span>
              </div>
              <span className="ml-3 text-2xl font-bold text-steel-blue">DentyPro</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Don't have an account?</span>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Form */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Side - Form */}
              <div className="p-12">
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-steel-blue mb-3">Sign In</h1>
                  <p className="text-gray-600 text-lg">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                        placeholder="professional@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-steel-blue border-gray-300 rounded focus:ring-steel-blue"
                        />
                        <span className="ml-2 text-sm text-gray-600">Remember me</span>
                      </label>
                      <button type="button" className="text-sm text-steel-blue hover:underline font-medium">
                        Forgot password?
                      </button>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{error}</p>
                        {needsEmailVerification && (
                          <button
                            type="button"
                            onClick={handleVerifyEmail}
                            className="mt-2 text-steel-blue hover:underline text-sm font-medium"
                          >
                            Go to email verification page →
                          </button>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Signing In..." : "Sign In"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side - Visual and Info */}
              <div className="bg-linear-to-br from-steel-blue to-blue-800 p-12 flex flex-col justify-center">
                <div className="text-white mb-8">
                  <h2 className="text-3xl font-bold mb-4">Welcome to the Professional Network</h2>
                  <p className="text-blue-100 text-lg leading-relaxed mb-6">
                    Connect with thousands of verified dental professionals and access exclusive pricing, certified
                    suppliers, and industry-leading products.
                  </p>
                </div>

                {/* Benefits List */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-white">
                    <div className="w-8 h-8 bg-pale-lime rounded-full flex items-center justify-center mr-4">
                      <Shield className="text-steel-blue w-4 h-4" />
                    </div>
                    <span>Verified professional network</span>
                  </div>
                  <div className="flex items-center text-white">
                    <div className="w-8 h-8 bg-pale-lime rounded-full flex items-center justify-center mr-4">
                      <Percent className="text-steel-blue w-4 h-4" />
                    </div>
                    <span>Exclusive professional pricing</span>
                  </div>
                  <div className="flex items-center text-white">
                    <div className="w-8 h-8 bg-pale-lime rounded-full flex items-center justify-center mr-4">
                      <Truck className="text-steel-blue w-4 h-4" />
                    </div>
                    <span>Priority shipping & support</span>
                  </div>
                  <div className="flex items-center text-white">
                    <div className="w-8 h-8 bg-pale-lime rounded-full flex items-center justify-center mr-4">
                      <Award className="text-steel-blue w-4 h-4" />
                    </div>
                    <span>Access to certified suppliers</span>
                  </div>
                  <div className="flex items-center text-white">
                    <div className="w-8 h-8 bg-pale-lime rounded-full flex items-center justify-center mr-4">
                      <TrendingUp className="text-steel-blue w-4 h-4" />
                    </div>
                    <span>Practice management tools</span>
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                  <h3 className="text-white text-lg font-semibold mb-4">Trusted by Professionals</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pale-lime">10,000+</div>
                      <div className="text-sm text-blue-100">Verified Dentists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pale-lime">500+</div>
                      <div className="text-sm text-blue-100">Certified Suppliers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pale-lime">50,000+</div>
                      <div className="text-sm text-blue-100">Products Available</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pale-lime">99.8%</div>
                      <div className="text-sm text-blue-100">Satisfaction Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LoginPage
