import FormAttachmentDropzone from "@/features/help-center/components/FormAttachmentDropzone"

export default function ContactFormAttachmentField() {
  return (
    <div>
      <p className="mb-2 block text-sm font-semibold text-gray-700">Attachment (Optional)</p>
      <FormAttachmentDropzone
        title="Drop files here or"
        actionLabel="browse"
        helperText="Max file size: 10MB. Supported formats: PDF, JPG, PNG, DOC"
      />
    </div>
  )
}
