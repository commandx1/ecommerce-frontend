import { getSelectedDocument } from "@/features/legal/getLegalDocuments"
import LegalPage from "@/features/legal/LegalPage"
import { unstable_noStore } from "next/cache"

// `?doc=` query parametresine göre SSR içerik üretmek için sayfayı dinamik tutuyoruz.
// Aksi halde Next, bazı senaryolarda statik optimize edip `searchParams` değişse bile
// içerik/doküman seçimini güncellemeyebiliyor.
export const dynamic = "force-dynamic"

interface LegalRoutePageProps {
  searchParams?: {
    doc?: string | string[]
  }
}

export default async function LegalRoutePage({ searchParams }: LegalRoutePageProps) {
  // Bu sayfa `?doc=` query parametresine göre SSR içerik üretir.
  // Bazı Next cache optimizasyonlarında query değişse bile aynı HTML dönebildiği için no-store kullanıyoruz.
  unstable_noStore()

  const rawDoc = (await searchParams)?.doc
  const docId = Array.isArray(rawDoc) ? rawDoc[0] : rawDoc

  const { selectedId, selectedDocument } = getSelectedDocument(docId)

  return <LegalPage selectedId={selectedId} selectedDocument={selectedDocument} />
}
