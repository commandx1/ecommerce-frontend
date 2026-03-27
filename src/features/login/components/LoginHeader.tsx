"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import Logo from "@/components/layout/Logo"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import ActionButton from "@/components/ui/ActionButton"

interface LoginHeaderProps {
  signUpPath?: string
}

export default function LoginHeader({ signUpPath = "/register" }: LoginHeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <PageSectionContainer as="div">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <Logo />
            <span className="ml-3 text-2xl font-bold text-steel-blue">DentyPro</span>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Don't have an account?</span>
            <ActionButton type="button" onClick={() => router.push(signUpPath)} size="sm">
              Sign Up
            </ActionButton>
          </div>
        </div>
      </PageSectionContainer>
    </header>
  )
}
