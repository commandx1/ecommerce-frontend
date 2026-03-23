export default function VerifyEmailSkeleton() {
  return (
    <div className="min-h-screen bg-light-mint-gray font-inter flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-40 bg-gray-200 rounded mx-auto mb-3 animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded mx-auto animate-pulse" />
          </div>

          <div className="mb-6">
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
            <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
          </div>

          <div className="h-12 w-full bg-gray-200 rounded-lg mb-4 animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded mx-auto animate-pulse" />

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="h-4 w-56 bg-gray-100 rounded mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
