import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import SurfaceCard from "@/components/ui/SurfaceCard"
import TicketSubmissionForm from "@/features/help-center/components/TicketSubmissionForm"
import TicketSubmissionHighlights from "@/features/help-center/components/TicketSubmissionHighlights"

export default function TicketSubmissionSection() {
  return (
    <PageSectionContainer as="section" className="bg-surface-muted/45 py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          title="Submit a Support Ticket"
          description="For complex issues or detailed requests, submit a support ticket. Our technical team will provide comprehensive assistance with tracking and follow-up."
          className="mb-12 items-center text-center md:items-center md:justify-center"
          titleClassName="mb-4 text-center text-4xl"
          descriptionClassName="mx-auto max-w-3xl text-center text-xl"
        />
      </div>

      <div className="mx-auto max-w-4xl">
        <SurfaceCard className="p-8">
          <TicketSubmissionHighlights />
          <TicketSubmissionForm />
        </SurfaceCard>
      </div>
    </PageSectionContainer>
  )
}
