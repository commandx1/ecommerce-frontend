"use client"

import { useRouter } from "next/navigation"
import Logo from "@/components/layout/Logo"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import ActionButton from "@/components/ui/ActionButton"

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
            <span className="ml-3 text-2xl font-bold text-neutral-700">DentyPro</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Already have an account?</span>
            <ActionButton type="button" onClick={() => router.push(signInPath)} size="sm">
              Sign In
            </ActionButton>
          </div>
        </div>
      </PageSectionContainer>
    </header>
  )
}
