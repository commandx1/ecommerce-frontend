export default function VerifyEmailSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 font-inter">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl bg-surface-elevated p-6 shadow-2xl sm:p-8 lg:p-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-surface-muted rounded-full mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-40 bg-surface-muted rounded mx-auto mb-3 animate-pulse" />
            <div className="h-4 w-64 bg-surface-muted/70 rounded mx-auto animate-pulse" />
          </div>

          <div className="mb-6">
            <div className="h-4 w-32 bg-surface-muted rounded mx-auto mb-2 animate-pulse" />
            <div className="h-12 w-full bg-surface-muted/70 rounded-lg animate-pulse" />
          </div>

          <div className="h-12 w-full bg-surface-muted rounded-lg mb-4 animate-pulse" />
          <div className="h-4 w-48 bg-surface-muted/70 rounded mx-auto animate-pulse" />

          <div className="mt-8 pt-8 border-t border-border-soft">
            <div className="h-4 w-56 bg-surface-muted/70 rounded mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
