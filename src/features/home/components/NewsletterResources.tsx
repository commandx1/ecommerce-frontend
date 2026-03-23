import resourcesData from "@/data/newsletter-resources.json"
import NewsletterSignupForm from "@/features/home/components/NewsletterSignupForm"
import ResourceCard from "@/features/home/components/ResourceCard"

export default function NewsletterResources() {
  return (
    <section id="newsletter-resources" className="py-16 bg-steel-blue">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <h2 className="text-4xl font-bold mb-6">Stay Updated with Industry Insights</h2>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Get the latest news, product updates, and exclusive offers delivered to your inbox. Join over 15,000
              dental professionals who trust our insights.
            </p>
            <NewsletterSignupForm />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {resourcesData.map((resource) => (
              <ResourceCard key={resource.id} {...resource} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
