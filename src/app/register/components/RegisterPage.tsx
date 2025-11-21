"use client"

import { Award, Percent, Shield, TrendingUp, Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Logo from "@/app/components/Logo"
// import { authAPI, type RegisterPayload } from "@/lib/api/auth"
import { authAPIDirect as authAPI, type RegisterPayload } from "@/lib/api/auth-direct"
import { useAuthStore } from "@/stores/authStore"

const RegisterPage = () => {
  const router = useRouter()
  const { setError } = useAuthStore()

  const [formData, setFormData] = useState<RegisterPayload>({
    name: "",
    surname: "",
    email: "",
    password: "",
    phoneNumber: "",
  })

  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "First name is required"
    }

    if (!formData.surname.trim()) {
      newErrors.surname = "Last name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required"
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber.replace(/\s/g, ""))) {
      newErrors.phoneNumber = "Please enter a valid 10-digit phone number"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await authAPI.register(formData)
      // Kayıt başarılı, email verification sayfasına yönlendir
      //router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      router.push("/login")
    } catch (error: unknown) {
      const err = error as { message?: string; password?: string }
      if (err.message) {
        setErrors({ submit: err.message })
      } else if (err.password) {
        setErrors({ password: err.password })
      } else {
        setErrors({ submit: "An error occurred during registration" })
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
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <div className="min-h-screen bg-light-mint-gray font-inter">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Logo />
              <span className="ml-3 text-2xl font-bold text-steel-blue">DentyPro</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Already have an account?</span>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Registration Form */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Side - Form */}
              <div className="p-12">
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-steel-blue mb-3">Professional Registration</h1>
                  <p className="text-gray-600 text-lg">Please provide your information to create your account</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          id="name"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border ${
                            errors.name ? "border-red-500" : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                          placeholder="Enter your first name"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          id="surname"
                          type="text"
                          name="surname"
                          value={formData.surname}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border ${
                            errors.surname ? "border-red-500" : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                          placeholder="Enter your last name"
                        />
                        {errors.surname && <p className="text-red-500 text-sm mt-1">{errors.surname}</p>}
                      </div>
                    </div>

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
                        className={`w-full px-4 py-3 border ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                        placeholder="professional@example.com"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        id="phoneNumber"
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${
                          errors.phoneNumber ? "border-red-500" : "border-gray-300"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                        placeholder="(555) 123-4567"
                      />
                      {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
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
                          className={`w-full px-4 py-3 pr-12 border ${
                            errors.password ? "border-red-500" : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                          placeholder="Enter a strong password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            if (errors.confirmPassword) {
                              setErrors((prev) => {
                                const newErrors = { ...prev }
                                delete newErrors.confirmPassword
                                return newErrors
                              })
                            }
                          }}
                          className={`w-full px-4 py-3 pr-12 border ${
                            errors.confirmPassword ? "border-red-500" : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                    </div>

                    {errors.submit && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{errors.submit}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side - Visual and Info */}
              <div className="bg-linear-to-br from-steel-blue to-blue-800 p-12 flex flex-col justify-center">
                <div className="text-white mb-8">
                  <h2 className="text-3xl font-bold mb-4">Join the Professional Network</h2>
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

export default RegisterPage
