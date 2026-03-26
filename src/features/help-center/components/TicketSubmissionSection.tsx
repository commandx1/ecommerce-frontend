import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import SurfaceCard from "@/components/ui/SurfaceCard"
import TicketSubmissionForm from "@/features/help-center/components/TicketSubmissionForm"
import TicketSubmissionHighlights from "@/features/help-center/components/TicketSubmissionHighlights"

export default function TicketSubmissionSection() {
  return (
    <PageSectionContainer as="section" className="py-16 bg-light-mint-gray">
      <SectionHeading
        title="Submit a Support Ticket"
        description="For complex issues or detailed requests, submit a support ticket. Our technical team will provide comprehensive assistance with tracking and follow-up."
        className="mb-12 justify-center"
        titleClassName="text-4xl text-center mb-4"
        descriptionClassName="text-xl max-w-3xl mx-auto text-center"
      />

      <div className="max-w-4xl mx-auto">
        <SurfaceCard className="p-8">
          <TicketSubmissionHighlights />
          <TicketSubmissionForm />
        </SurfaceCard>
      </div>
    </PageSectionContainer>
  )
}
