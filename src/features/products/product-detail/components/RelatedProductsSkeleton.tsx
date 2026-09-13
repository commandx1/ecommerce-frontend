export default function RelatedProductsSkeleton() {
  return (
    <div className="bg-surface py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="skeleton-white h-9 w-48 rounded-xl" />
          <div className="skeleton-white h-5 w-44 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl bg-light-mint-gray">
              <div className="skeleton-mint h-48" />
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="skeleton-white h-6 w-24 rounded-full" />
                  <div className="skeleton-white h-6 w-6 rounded-full" />
                </div>
                <div className="skeleton-white h-5 w-40 rounded-full" />
                <div className="skeleton-white h-4 w-full rounded-full" />
                <div className="flex items-center justify-between pt-1">
                  <div className="skeleton-white h-7 w-20 rounded-full" />
                  <div className="skeleton-white h-9 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
