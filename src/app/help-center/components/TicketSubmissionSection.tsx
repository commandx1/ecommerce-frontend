"use client"

import {
  Bold,
  Clock,
  CloudUpload,
  Info,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Ticket,
  TrendingUp,
  User,
} from "lucide-react"

export default function TicketSubmissionSection() {
  return (
    <section id="ticket-submission" className="py-16 bg-light-mint-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">Submit a Support Ticket</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            For complex issues or detailed requests, submit a support ticket. Our technical team will provide
            comprehensive assistance with tracking and follow-up.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-green-600 w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-steel-blue mb-2">Quick Response</h3>
                <p className="text-gray-600">Average response time: 2 hours</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="text-blue-600 w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-steel-blue mb-2">Expert Support</h3>
                <p className="text-gray-600">Dental industry specialists</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-purple-600 w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-steel-blue mb-2">Full Tracking</h3>
                <p className="text-gray-600">Track your ticket status</p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ticket Priority *</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                    required
                  >
                    <option value="">Select priority level...</option>
                    <option value="low">Low - General inquiry</option>
                    <option value="normal">Normal - Standard support</option>
                    <option value="high">High - Business impacting</option>
                    <option value="urgent">Urgent - Critical issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Category *</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                    required
                  >
                    <option value="">Select category...</option>
                    <option value="order-issue">Order Issues</option>
                    <option value="product-defect">Product Defect</option>
                    <option value="billing-dispute">Billing Dispute</option>
                    <option value="account-access">Account Access</option>
                    <option value="shipping-problem">Shipping Problem</option>
                    <option value="website-bug">Website Bug</option>
                    <option value="feature-request">Feature Request</option>
                    <option value="partnership">Partnership Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Order Number (if applicable)</label>
                <input
                  type="text"
                  placeholder="e.g., DH-2024-001234"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ticket Title *</label>
                <input
                  type="text"
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Description *</label>
                <div className="border border-gray-300 rounded-lg">
                  <div className="border-b border-gray-200 px-4 py-2 flex items-center space-x-2 bg-gray-50">
                    <button type="button" className="p-1 text-gray-500 hover:text-gray-700 rounded">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-1 text-gray-500 hover:text-gray-700 rounded">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-1 text-gray-500 hover:text-gray-700 rounded">
                      <List className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-1 text-gray-500 hover:text-gray-700 rounded">
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-1 text-gray-500 hover:text-gray-700 rounded">
                      <LinkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-steel-blue resize-none rounded-b-lg"
                    placeholder={`Please provide detailed information about your issue, including:
• What you were trying to do
• What happened instead
• Any error messages you received
• Steps you've already tried
• When the issue first occurred`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Attachments</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-steel-blue transition-colors">
                  <CloudUpload className="text-gray-400 w-10 h-10 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop files here or{" "}
                    <button type="button" className="text-steel-blue hover:underline font-medium">
                      browse your computer
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">
                    Screenshots, documents, or other relevant files (Max 25MB total)
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="text-blue-500 mt-0.5 w-5 h-5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Tips for faster resolution:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Include screenshots or photos when relevant</li>
                      <li>• Provide your order number for order-related issues</li>
                      <li>• Be specific about error messages or unexpected behavior</li>
                      <li>• Mention your browser/device if experiencing website issues</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="urgent-callback"
                    className="w-4 h-4 text-steel-blue border-gray-300 rounded focus:ring-steel-blue"
                  />
                  <label htmlFor="urgent-callback" className="text-sm text-gray-600">
                    Request urgent callback (for high/urgent priority tickets)
                  </label>
                </div>
                <button
                  type="submit"
                  className="bg-steel-blue text-white px-8 py-3 rounded-lg hover:bg-opacity-90 font-semibold transition-colors flex items-center"
                >
                  Submit Ticket
                  <Ticket className="ml-2 w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
