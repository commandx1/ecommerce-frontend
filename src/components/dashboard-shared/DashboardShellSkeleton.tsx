import type { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface DashboardShellSkeletonProps {
  /** The sr-only h1 text. Buyer and vendor keep their own wording (design doc §3): the vendor
   * heading is deliberately worded so it cannot match the real "Vendor Dashboard" heading early. */
  heading: string
  /** Number of nav-dot placeholders in the sidebar skeleton (5 for buyer, 6 for vendor). */
  navCount: number
  /** Full className for the header brand skeleton (sizes differ per role). */
  brandClassName: string
  /** ClassName applied to the `<main>` region; each role supplies its own body via `children`. */
  mainClassName?: string
  children: ReactNode
}

/**
 * Shared chrome for the buyer and vendor dashboard layout skeletons (design doc §3, Phase 4 C2):
 * backdrop, sr-only h1, header strip and nav-dot sidebar. Each role passes its own main-body
 * placeholders as `children` so the visible skeleton content is unchanged.
 */
export default function DashboardShellSkeleton({
  heading,
  navCount,
  brandClassName,
  mainClassName,
  children,
}: DashboardShellSkeletonProps) {
  const navSkeletonIds = Array.from({ length: navCount }, (_, index) => `nav-${index + 1}`)

  return (
    <div data-theme-scope="dashboard" className="relative isolate flex min-h-screen flex-col">
      <div className="dashboard-backdrop" aria-hidden />
      <h1 className="sr-only">{heading}</h1>
      <header className="h-16 glass-strip px-6">
        <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center justify-between">
          <Skeleton className={brandClassName} />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-[3.05rem] shrink-0 md:mt-3 md:ml-3 md:block md:h-[calc(100vh-5.5rem)] glass-panel p-2">
          <div className="flex flex-col items-center gap-2">
            {navSkeletonIds.map((id) => (
              <Skeleton key={id} className="h-8 w-8 rounded-md" />
            ))}
          </div>
        </aside>

        <main className={cn("flex-1", mainClassName)}>{children}</main>
      </div>
    </div>
  )
}
