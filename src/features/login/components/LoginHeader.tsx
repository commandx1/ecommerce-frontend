"use client"

import { useRouter } from "next/navigation"
import Logo from "@/app/components/Logo"

interface LoginHeaderProps {
  signUpPath?: string
}

export default function LoginHeader({ signUpPath = "/register" }: LoginHeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Logo />
            <span className="ml-3 text-2xl font-bold text-steel-blue">DentyPro</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Don't have an account?</span>
            <button
              type="button"
              onClick={() => router.push(signUpPath)}
              className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
