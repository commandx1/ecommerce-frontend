"use client"

import type { ChangeEventHandler, FormEventHandler } from "react"
import ActionButton from "@/components/ui/ActionButton"
import { Input } from "@/components/ui/input"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import legalAdditionalData from "@/data/legal-additional.json"
import { useContactSupportForm } from "@/features/legal/hooks/useContactSupportForm"

const ContactSupportForm = () => {
  const { formData, handleChange, handleTopicChange, handleSubmit } = useContactSupportForm()
  const idPrefix = "legal-support-form"

  const onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = handleChange
  const onSubmit: FormEventHandler<HTMLFormElement> = handleSubmit

  return (
    <SurfaceCard className="p-8 shadow-panel">
      <h3 className="mb-6 text-2xl font-semibold text-text-primary">Request Legal Consultation</h3>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={`${idPrefix}-first-name`} className="mb-2 block text-sm font-medium text-text-primary">
              First Name
            </label>
            <Input
              id={`${idPrefix}-first-name`}
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={onChange}
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-last-name`} className="mb-2 block text-sm font-medium text-text-primary">
              Last Name
            </label>
            <Input
              id={`${idPrefix}-last-name`}
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={onChange}
            />
          </div>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-email`} className="mb-2 block text-sm font-medium text-text-primary">
            Email Address
          </label>
          <Input id={`${idPrefix}-email`} name="email" type="email" value={formData.email} onChange={onChange} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-topic`} className="mb-2 block text-sm font-medium text-text-primary">
            Legal Topic
          </label>
          <Select name="topic" value={formData.topic} onValueChange={handleTopicChange}>
            <SelectTrigger id={`${idPrefix}-topic`} className="w-full">
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent id={`${idPrefix}-topic-content`}>
              {legalAdditionalData.contactInfo.topics.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-message`} className="mb-2 block text-sm font-medium text-text-primary">
            Message
          </label>
          <Textarea
            id={`${idPrefix}-message`}
            name="message"
            rows={4}
            value={formData.message}
            onChange={onChange}
            placeholder="Please describe your legal question or concern..."
          />
        </div>
        <ActionButton type="submit" fullWidth>
          Submit Request
        </ActionButton>
      </form>
    </SurfaceCard>
  )
}

export default ContactSupportForm
