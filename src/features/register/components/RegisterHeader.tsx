"use client"

import { useRouter } from "next/navigation"
import Logo from "@/components/layout/Logo"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import ThemeToggle from "@/components/theme/ThemeToggle"
import ActionButton from "@/components/ui/ActionButton"

interface RegisterHeaderProps {
  signInPath?: string
}

export default function RegisterHeader({ signInPath = "/login" }: RegisterHeaderProps) {
  const router = useRouter()

  return (
    <header className="border-b border-border-soft bg-surface-elevated shadow-soft">
      <PageSectionContainer as="div">
        <div className="flex h-16 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center">
            <Logo />
            <span className="ml-3 truncate text-lg font-bold text-text-primary sm:text-2xl">DentyPro</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <span className="hidden text-text-secondary sm:inline">Already have an account?</span>
            <ActionButton type="button" onClick={() => router.push(signInPath)} size="sm">
              Sign In
            </ActionButton>
          </div>
        </div>
      </PageSectionContainer>
    </header>
  )
}
