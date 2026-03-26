"use client"

import { useRouter } from "next/navigation"
import Logo from "@/components/layout/Logo"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

interface RegisterHeaderProps {
  signInPath?: string
}

export default function RegisterHeader({ signInPath = "/login" }: RegisterHeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <PageSectionContainer as="div">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Logo />
            <span className="ml-3 text-2xl font-bold text-steel-blue">DentyPro</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Already have an account?</span>
            <button
              type="button"
              onClick={() => router.push(signInPath)}
              className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </PageSectionContainer>
    </header>
  )
}
