"use client"

import { useAuthStore } from "@/stores/authStore"

const WelcomeSection = () => {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const user = useAuthStore((state) => state.user)
  const capitalize = (value: string) =>
    value
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase())
      .join(" ")
  const fullName = user ? capitalize(`${user.name} ${user.surname}`) : ""
  const displayName = fullName || user?.email || ""

  return (
    <section id="welcome-section" className="mb-8">
      <div className="home-spotlight rounded-2xl border border-border-soft bg-brand-surface p-8 text-inverse-foreground shadow-panel">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-inverse-foreground">
              {displayName ? `Welcome back, ${displayName}!` : "Welcome back!"}
            </h1>
            <p className="text-lg text-inverse-muted">
              Here&apos;s what&apos;s happening with your dental supply orders
            </p>
          </div>
          <div className="text-right">
            <div className="mb-1 text-sm text-inverse-muted">Today&apos;s Date</div>
            <div className="text-xl font-semibold">{today}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WelcomeSection
