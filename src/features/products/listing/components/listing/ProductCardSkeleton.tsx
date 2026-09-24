import { Skeleton } from "@/components/ui/skeleton"

// Mirrors ProductCard's outer shell (rounded mat, photo aspect, body slots) so the initial
// load doesn't jump in size once real cards replace it.
export default function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-[1.75rem] bg-surface-elevated p-2 shadow-soft">
      <Skeleton className="aspect-[4/3] rounded-[1.25rem]" />
      <div className="flex flex-1 flex-col gap-3 px-3 pb-3 pt-4">
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-24" />
        <div className="mt-auto flex flex-col gap-3 pt-4">
          <Skeleton className="h-8 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 flex-1 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
