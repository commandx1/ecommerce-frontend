"use client"

import { useId } from "react"
import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNewsletterSignup } from "@/features/home/hooks/useNewsletterSignup"

export default function NewsletterSignupForm() {
  const { email, isSubmitting, handleChange, handleSubmit } = useNewsletterSignup()
  const id = useId()

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6">
      <Label htmlFor={id} className="sr-only">
        Email address
      </Label>
      <div className="flex gap-4 flex-wrap">
        <Input
          id={id}
          type="email"
          value={email}
          onChange={handleChange}
          placeholder="Enter your email address"
          className="flex-1 px-4 py-3 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue text-gray-700"
          disabled={isSubmitting}
        />
        <AsyncSubmitButton
          idleText="Subscribe"
          submittingText="Subscribing..."
          isSubmitting={isSubmitting}
          type="submit"
          fullWidth={false}
        />
      </div>
      <p className="text-sm text-gray-600 mt-3">
        By subscribing, you agree to our Privacy Policy and Terms of Service.
      </p>
    </form>
  )
}
