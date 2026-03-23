"use client"

import { CloudUpload } from "lucide-react"

interface FormAttachmentDropzoneProps {
  title: string
  helperText: string
  actionLabel: string
}

const FormAttachmentDropzone = ({ title, helperText, actionLabel }: FormAttachmentDropzoneProps) => {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-steel-blue transition-colors">
      <CloudUpload className="text-gray-400 w-8 h-8 mx-auto mb-2" />
      <p className="text-gray-600">
        {title}{" "}
        <button type="button" className="text-steel-blue hover:underline">
          {actionLabel}
        </button>
      </p>
      <p className="text-sm text-gray-500 mt-1">{helperText}</p>
    </div>
  )
}

export default FormAttachmentDropzone
