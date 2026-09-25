import { AlertCircle } from "lucide-react"

export default function AuthRequiredNotice({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="bg-surface-elevated rounded-2xl shadow-lg p-12 text-center max-w-md">
        <div className="w-20 h-20 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-warning" />
        </div>
        <h2 className="text-2xl font-bold text-brand mb-4">Authentication Required</h2>
        <p className="text-text-secondary mb-6">You need to be logged in to create a product.</p>
        <button
          type="button"
          onClick={onLogin}
          className="w-full bg-brand text-white py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}
