import FormAttachmentDropzone from "@/features/help-center/components/FormAttachmentDropzone"

export default function TicketFormAttachmentField() {
  return (
    <div>
      <p className="mb-2 block text-sm font-semibold text-text-primary">Attachments</p>
      <FormAttachmentDropzone
        title="Drag and drop files here or"
        actionLabel="browse your computer"
        helperText="Screenshots, documents, or other relevant files (Max 25MB total)"
      />
    </div>
  )
}
