"use client"

import type { ChangeEventHandler, FormEventHandler } from "react"
import { useId } from "react"

import legalAdditionalData from "@/data/legal-additional.json"
import { useContactSupportForm } from "@/features/legal/hooks/useContactSupportForm"

const ContactSupportForm = () => {
  const { formData, handleChange, handleSubmit } = useContactSupportForm()
  const id = useId()

  const onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = handleChange
  const onSubmit: FormEventHandler<HTMLFormElement> = handleSubmit

  return (
    <div className="bg-white rounded-2xl p-8 shadow-2xl">
      <h3 className="text-2xl font-bold text-steel-blue mb-6">Request Legal Consultation</h3>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${id}-first-name`} className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              id={`${id}-first-name`}
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor={`${id}-last-name`} className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              id={`${id}-last-name`}
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            value={formData.email}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor={`${id}-topic`} className="block text-sm font-medium text-gray-700 mb-2">
            Legal Topic
          </label>
          <select
            id={`${id}-topic`}
            name="topic"
            value={formData.topic}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
          >
            <option value="">Select a topic</option>
            {legalAdditionalData.contactInfo.topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-message`} className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            id={`${id}-message`}
            name="message"
            rows={4}
            value={formData.message}
            onChange={onChange}
            placeholder="Please describe your legal question or concern..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-steel-blue text-white py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
        >
          Submit Request
        </button>
      </form>
    </div>
  )
}

export default ContactSupportForm
