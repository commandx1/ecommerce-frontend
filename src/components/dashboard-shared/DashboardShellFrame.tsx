import type { ReactNode } from "react"
import { useId } from "react"
import { cn } from "@/lib/utils"

interface DashboardShellFrameProps {
  header: ReactNode
  sidebar: ReactNode
  mainClassName?: string
  children: ReactNode
}

/**
 * Shared chrome for the buyer and vendor dashboard layouts (design doc §3, Phase 4 C2): backdrop,
 * header, sidebar and the `<main>` region. Providers (`DashboardMobileSidebarProvider`,
 * `CompanyRoleProvider`), `NotificationSocketBridge` and `ImpersonationTabTitle` stay in the
 * layouts, since this component must not import features.
 */
export default function DashboardShellFrame({ header, sidebar, mainClassName, children }: DashboardShellFrameProps) {
  const mainContentId = useId()

  return (
    <div data-theme-scope="dashboard" className="relative isolate flex min-h-screen flex-col">
      <div className="dashboard-backdrop" aria-hidden />
      {header}
      <div className="flex flex-1">
        {sidebar}
        <main id={mainContentId} className={cn("min-w-0 flex-1 p-4 md:p-6", mainClassName)}>
          {children}
        </main>
      </div>
    </div>
  )
}
