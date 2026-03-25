import { getSelectedDocument } from "@/features/legal/getLegalDocuments"
import LegalPage from "@/features/legal/LegalPage"

export const dynamic = "force-static"

export default async function LegalRoutePage({ searchParams }: { searchParams: Promise<{ doc?: string }> }) {
  const params = await searchParams
  const { selectedId, selectedDocument } = getSelectedDocument(params.doc)

  return <LegalPage selectedId={selectedId} selectedDocument={selectedDocument} />
}
