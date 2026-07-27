"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import Logo from "@/components/layout/Logo"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import ThemeToggle from "@/components/theme/ThemeToggle"
import ActionButton from "@/components/ui/ActionButton"

interface LoginHeaderProps {
  signUpPath?: string
}

export default function LoginHeader({ signUpPath = "/register" }: LoginHeaderProps) {
  const router = useRouter()

  return (
    <header className="border-b border-border-soft bg-surface-elevated shadow-soft">
      <PageSectionContainer as="div">
        <div className="flex h-16 items-center justify-between gap-2">
          <Link href="/" className="flex min-w-0 items-center">
            <Logo />
            <span className="ml-3 truncate text-lg font-bold text-text-primary sm:text-2xl">DentyPro</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <span className="hidden text-text-secondary sm:inline">Don't have an account?</span>
            <ActionButton type="button" onClick={() => router.push(signUpPath)} size="sm">
              Sign Up
            </ActionButton>
          </div>
        </div>
      </PageSectionContainer>
    </header>
  )
}
