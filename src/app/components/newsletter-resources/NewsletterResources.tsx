import resourcesData from "@/data/newsletter-resources.json"
import ResourceCard from "./ResourceCard"

const NewsletterResources = () => {
  return (
    <section id="newsletter-resources" className="py-16 bg-steel-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <h2 className="text-4xl font-bold mb-6">Stay Updated with Industry Insights</h2>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Get the latest news, product updates, and exclusive offers delivered to your inbox. Join over 15,000
              dental professionals who trust our insights.
            </p>
            <div className="bg-white rounded-xl p-6">
              <div className="flex space-x-4">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue text-gray-700"
                />
                <button
                  type="button"
                  className="bg-steel-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
                >
                  Subscribe
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                By subscribing, you agree to our Privacy Policy and Terms of Service.
              </p>
            </div>
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

export default NewsletterResources
