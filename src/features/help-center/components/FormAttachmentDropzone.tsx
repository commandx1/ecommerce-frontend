import { CloudUpload } from "lucide-react"

interface FormAttachmentDropzoneProps {
  title: string
  helperText: string
  actionLabel: string
}

const FormAttachmentDropzone = ({ title, helperText, actionLabel }: FormAttachmentDropzoneProps) => {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border-strong p-6 text-center transition-colors hover:border-brand/40">
      <CloudUpload className="mx-auto mb-2 h-8 w-8 text-text-muted" />
      <p className="text-text-secondary">
        {title}{" "}
        <button type="button" className="text-brand hover:underline">
          {actionLabel}
        </button>
      </p>
      <p className="mt-1 text-sm text-text-muted">{helperText}</p>
    </div>
  )
}

export default FormAttachmentDropzone
