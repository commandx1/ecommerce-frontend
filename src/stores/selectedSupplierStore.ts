import { create } from "zustand"

interface Supplier {
  id: number
  userProductId?: string
  name: string
  price: string
  stockCount: number
}

interface SelectedSupplierState {
  selectedSupplier: Supplier | null
  setSelectedSupplier: (supplier: Supplier | null) => void
}

export const useSelectedSupplierStore = create<SelectedSupplierState>((set) => ({
  selectedSupplier: null,
  setSelectedSupplier: (supplier) => set({ selectedSupplier: supplier }),
}))
