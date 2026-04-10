import { Download, Phone, Scale } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

const LegalHero = () => {
  return (
    <section className="bg-brand text-inverse-foreground dark:bg-brand-surface">
      <PageSectionContainer
        as="div"
        className="flex min-h-[400px] items-center"
        containerClassName="flex w-full justify-center"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center text-inverse-foreground">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/14">
            <Scale className="h-10 w-10 text-inverse-foreground" />
          </div>
          <h1 className="mb-6 text-5xl font-bold text-inverse-muted">Legal & Compliance Center</h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-inverse-muted">
            Access comprehensive legal documents, compliance guidelines, and regulatory information for your dental
            practice operations on DentyPro.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              className="flex items-center rounded-full bg-accent-strong px-8 py-3 font-semibold text-accent-foreground transition-colors hover:brightness-105"
            >
              <Download className="mr-2 h-5 w-5" />
              Download All Documents
            </button>
            <Link
              href="/help-center"
              className="flex items-center rounded-full border border-white/18 bg-white/8 px-8 py-3 font-semibold text-inverse-foreground transition-colors hover:bg-white/14"
            >
              <Phone className="mr-2 h-5 w-5" />
              Legal Support
            </Link>
          </div>
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default LegalHero
