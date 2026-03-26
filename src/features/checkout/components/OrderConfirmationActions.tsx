import { Home, Package } from "lucide-react"
import Link from "next/link"
import ActionButton from "@/components/ui/ActionButton"

interface OrderConfirmationActionsProps {
  onContinueShopping: () => void
}

export default function OrderConfirmationActions({ onContinueShopping }: OrderConfirmationActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <ActionButton asChild intent="outline">
        <Link href="/buyer-dashboard/orders">
          <Package className="mr-2 w-5 h-5" />
          View Orders
        </Link>
      </ActionButton>
      <ActionButton type="button" onClick={onContinueShopping}>
        <Home className="mr-2 w-5 h-5" />
        Continue Shopping
      </ActionButton>
    </div>
  )
}
