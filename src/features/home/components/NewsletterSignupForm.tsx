"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNewsletterSignup } from "@/features/home/hooks/useNewsletterSignup"

export default function NewsletterSignupForm() {
  const { email, isSubmitting, handleChange, handleSubmit } = useNewsletterSignup()

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6">
      <Label htmlFor="newsletter-email" className="sr-only">
        Email address
      </Label>
      <div className="flex gap-4 flex-wrap">
        <Input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={handleChange}
          placeholder="Enter your email address"
          className="flex-1 px-4 py-3 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue text-gray-700"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-steel-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-50"
        >
          Subscribe
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-3">
        By subscribing, you agree to our Privacy Policy and Terms of Service.
      </p>
    </form>
  )
}
