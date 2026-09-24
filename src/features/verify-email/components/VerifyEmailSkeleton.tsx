import { Skeleton } from "@/components/ui/skeleton"

export default function VerifyEmailSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 font-inter" aria-busy="true">
      <span className="sr-only">Loading verification page…</span>
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl bg-surface-elevated p-6 shadow-2xl sm:p-8 lg:p-12">
          <div className="text-center mb-8">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-40 rounded mx-auto mb-3" />
            <Skeleton className="h-4 w-64 rounded mx-auto" />
          </div>

          <div className="mb-6">
            <Skeleton className="h-4 w-32 rounded mx-auto mb-2" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          <Skeleton className="h-12 w-full rounded-lg mb-4" />
          <Skeleton className="h-4 w-48 rounded mx-auto" />

          <div className="mt-8 pt-8 border-t border-border-soft">
            <Skeleton className="h-4 w-56 rounded mx-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
