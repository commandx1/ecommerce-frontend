import type { SystemAnnouncementItem, SystemStatusItem } from "@/features/help-center/types"

export const SYSTEM_STATUS_ITEMS: SystemStatusItem[] = [
  { name: "Website & Platform", status: "Operational", color: "green" },
  { name: "Order Processing", status: "Operational", color: "green" },
  { name: "Payment Gateway", status: "Operational", color: "green" },
  { name: "Mobile App", status: "Minor Issues", color: "yellow" },
  { name: "Support Systems", status: "Operational", color: "green" },
]

export const SYSTEM_ANNOUNCEMENTS: SystemAnnouncementItem[] = [
  {
    type: "Platform Update",
    dotColor: "bg-blue-500",
    date: "Nov 1, 2024",
    title: "Enhanced Search Functionality",
    description: "New advanced filters and AI-powered search suggestions now available across all product categories.",
  },
  {
    type: "New Feature",
    dotColor: "bg-green-500",
    date: "Oct 28, 2024",
    title: "Mobile App 2.0 Released",
    description: "Redesigned mobile experience with faster performance and new inventory management features.",
  },
  {
    type: "Maintenance",
    dotColor: "bg-yellow-500",
    date: "Oct 25, 2024",
    title: "Scheduled Maintenance - Nov 15",
    description: "Platform will be offline from 2-4 AM EST for routine maintenance and performance improvements.",
  },
  {
    type: "Partnership",
    dotColor: "bg-purple-500",
    date: "Oct 20, 2024",
    title: "New Supplier Partners Added",
    description: "Welcome 15 new certified suppliers specializing in orthodontic and endodontic products.",
  },
]
