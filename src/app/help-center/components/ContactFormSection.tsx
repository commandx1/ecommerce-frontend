"use client"

import { CloudUpload, Mail, MessageCircle, Phone, Send } from "lucide-react"

export default function ContactFormSection() {
  return (
    <section id="contact-form" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl font-bold text-steel-blue mb-6">Get in Touch</h2>
            <p className="text-xl text-gray-600 mb-8">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help. Send us a message and
              we&apos;ll get back to you within 2 hours during business hours.
            </p>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="text-white w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-steel-blue mb-1">Phone Support</h3>
                  <p className="text-gray-600">1-800-DENTAL-1 (1-800-336-8251)</p>
                  <p className="text-sm text-gray-500">
                    Monday - Friday: 6 AM - 8 PM EST
                    <br />
                    Saturday - Sunday: 8 AM - 5 PM EST
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="text-white w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-steel-blue mb-1">Email Support</h3>
                  <p className="text-gray-600">support@dentalhub.com</p>
                  <p className="text-sm text-gray-500">Response within 2 hours during business hours</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center shrink-0">
                  <MessageCircle className="text-white w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-steel-blue mb-1">Live Chat</h3>
                  <p className="text-gray-600">Available 24/7 on our website</p>
                  <p className="text-sm text-gray-500">Instant responses from our support team</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-light-mint-gray rounded-2xl p-8">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Practice/Company Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                <select
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  required
                >
                  <option value="">Select a topic...</option>
                  <option value="order">Order Issues</option>
                  <option value="product">Product Questions</option>
                  <option value="account">Account Support</option>
                  <option value="billing">Billing & Payment</option>
                  <option value="shipping">Shipping & Delivery</option>
                  <option value="returns">Returns & Exchanges</option>
                  <option value="technical">Technical Support</option>
                  <option value="partnership">Partnership Inquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent resize-none"
                  placeholder="Please provide as much detail as possible about your inquiry..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Attachment (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-steel-blue transition-colors">
                  <CloudUpload className="text-gray-400 w-8 h-8 mx-auto mb-2" />
                  <p className="text-gray-600">
                    Drop files here or{" "}
                    <button type="button" className="text-steel-blue hover:underline">
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Max file size: 10MB. Supported formats: PDF, JPG, PNG, DOC
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="newsletter"
                  className="w-4 h-4 bg-white text-steel-blue border-gray-300 rounded focus:ring-steel-blue"
                />
                <label htmlFor="newsletter" className="text-sm text-gray-600">
                  Subscribe to our newsletter for updates and exclusive offers
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold text-lg transition-colors flex items-center justify-center"
              >
                Send Message
                <Send className="ml-2 w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
