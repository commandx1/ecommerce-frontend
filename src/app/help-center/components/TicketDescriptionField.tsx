"use client"

import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from "lucide-react"
import type { ChangeEventHandler } from "react"
import { Textarea } from "@/components/ui/textarea"

interface TicketDescriptionFieldProps {
  value: string
  onChange: ChangeEventHandler<HTMLTextAreaElement>
}

const TicketDescriptionField = ({ value, onChange }: TicketDescriptionFieldProps) => {
  return (
    <div>
      <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
        Detailed Description *
      </label>
      <div className="border border-gray-300 rounded-lg">
        <div className="border-b border-gray-200 px-4 py-2 flex items-center space-x-2 bg-gray-50">
          <button type="button" className="p-1 text-gray-500 hover:text-gray-700 rounded">
            <Bold className="w-4 h-4" />
          </button>
          <button type="button" className="p-1 text-gray-500 hover:text-gray-700 rounded">
            <Italic className="w-4 h-4" />
          </button>
          <button type="button" className="p-1 text-gray-500 hover:text-gray-700 rounded">
            <List className="w-4 h-4" />
          </button>
          <button type="button" className="p-1 text-gray-500 hover:text-gray-700 rounded">
            <ListOrdered className="w-4 h-4" />
          </button>
          <button type="button" className="p-1 text-gray-500 hover:text-gray-700 rounded">
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>
        <Textarea
          id="description"
          name="description"
          rows={6}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-steel-blue resize-none rounded-b-lg"
          placeholder={`Please provide detailed information about your issue, including:
• What you were trying to do
• What happened instead
• Any error messages you received
• Steps you've already tried
• When the issue first occurred`}
          required
        />
      </div>
    </div>
  )
}

export default TicketDescriptionField
