"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useBuyerOrdersPage, type UseBuyerOrdersPageResult } from "../hooks/use-buyer-orders-page"

type BuyerOrdersAuthState = Pick<UseBuyerOrdersPageResult, "isAuthenticated">
type BuyerOrdersTabsState = Pick<UseBuyerOrdersPageResult, "selectedTab">
type BuyerOrdersTabsActions = Pick<UseBuyerOrdersPageResult, "handleTabChange">

type BuyerOrdersTableState = Pick<
  UseBuyerOrdersPageResult,
  | "cancelingItemId"
  | "cancelingSellerKey"
  | "dateSortDir"
  | "expandedState"
  | "filteredOrders"
  | "isLoading"
  | "reorderingItemId"
  | "summariesByOrderId"
>

type BuyerOrdersTableActions = Pick<
  UseBuyerOrdersPageResult,
  | "handleDateSortToggle"
  | "handleExpandedChange"
  | "handleReorder"
  | "requestCancelAction"
  | "requestRefundAction"
  | "setTrackingModalLinks"
>

type BuyerOrdersPaginationState = Pick<UseBuyerOrdersPageResult, "currentPage" | "pageSize" | "totalElements" | "totalPages">

type BuyerOrdersPaginationActions = Pick<UseBuyerOrdersPageResult, "handlePageChange">

type BuyerOrdersCancelModalState = Pick<UseBuyerOrdersPageResult, "isConfirmingCancel" | "pendingCancelAction">

type BuyerOrdersCancelModalActions = Pick<UseBuyerOrdersPageResult, "confirmPendingCancelAction" | "setPendingCancelAction">

type BuyerOrdersRefundModalState = Pick<UseBuyerOrdersPageResult, "isSubmittingRefund" | "pendingRefundOrder">

type BuyerOrdersRefundModalActions = Pick<
  UseBuyerOrdersPageResult,
  "requestRefundAction" | "setPendingRefundOrder" | "submitRefundOrder"
>

type BuyerOrdersTrackingModalState = Pick<UseBuyerOrdersPageResult, "trackingModalLinks">

type BuyerOrdersTrackingModalActions = Pick<UseBuyerOrdersPageResult, "setTrackingModalLinks">

export const BuyerOrdersAuthStateContext = createContext<BuyerOrdersAuthState | null>(null)
export const BuyerOrdersTabsStateContext = createContext<BuyerOrdersTabsState | null>(null)
export const BuyerOrdersTabsActionsContext = createContext<BuyerOrdersTabsActions | null>(null)
export const BuyerOrdersTableStateContext = createContext<BuyerOrdersTableState | null>(null)
export const BuyerOrdersTableActionsContext = createContext<BuyerOrdersTableActions | null>(null)
export const BuyerOrdersPaginationStateContext = createContext<BuyerOrdersPaginationState | null>(null)
export const BuyerOrdersPaginationActionsContext = createContext<BuyerOrdersPaginationActions | null>(null)
export const BuyerOrdersCancelModalStateContext = createContext<BuyerOrdersCancelModalState | null>(null)
export const BuyerOrdersCancelModalActionsContext = createContext<BuyerOrdersCancelModalActions | null>(null)
export const BuyerOrdersRefundModalStateContext = createContext<BuyerOrdersRefundModalState | null>(null)
export const BuyerOrdersRefundModalActionsContext = createContext<BuyerOrdersRefundModalActions | null>(null)
export const BuyerOrdersTrackingModalStateContext = createContext<BuyerOrdersTrackingModalState | null>(null)
export const BuyerOrdersTrackingModalActionsContext = createContext<BuyerOrdersTrackingModalActions | null>(null)

function useRequiredContext<T>(context: React.Context<T | null>, name: string): T {
  const value = useContext(context)
  if (!value) {
    throw new Error(`${name} must be used within BuyerOrdersProvider.`)
  }
  return value
}

interface BuyerOrdersProviderProps {
  children: ReactNode
}

interface ProviderComposerItem {
  render: (children: ReactNode) => ReactNode
}

function composeProviders(items: ProviderComposerItem[], children: ReactNode): ReactNode {
  return items.reduceRight<ReactNode>((acc, item) => item.render(acc), children)
}

export function BuyerOrdersProvider({ children }: BuyerOrdersProviderProps) {
  const buyerOrders = useBuyerOrdersPage()

  const authState = useMemo<BuyerOrdersAuthState>(
    () => ({
      isAuthenticated: buyerOrders.isAuthenticated,
    }),
    [buyerOrders.isAuthenticated],
  )

  const tabsState = useMemo<BuyerOrdersTabsState>(
    () => ({
      selectedTab: buyerOrders.selectedTab,
    }),
    [buyerOrders.selectedTab],
  )

  const tabsActions = useMemo<BuyerOrdersTabsActions>(
    () => ({
      handleTabChange: buyerOrders.handleTabChange,
    }),
    [buyerOrders.handleTabChange],
  )

  const tableState = useMemo<BuyerOrdersTableState>(
    () => ({
      cancelingItemId: buyerOrders.cancelingItemId,
      cancelingSellerKey: buyerOrders.cancelingSellerKey,
      dateSortDir: buyerOrders.dateSortDir,
      expandedState: buyerOrders.expandedState,
      filteredOrders: buyerOrders.filteredOrders,
      isLoading: buyerOrders.isLoading,
      reorderingItemId: buyerOrders.reorderingItemId,
      summariesByOrderId: buyerOrders.summariesByOrderId,
    }),
    [
      buyerOrders.cancelingItemId,
      buyerOrders.cancelingSellerKey,
      buyerOrders.dateSortDir,
      buyerOrders.expandedState,
      buyerOrders.filteredOrders,
      buyerOrders.isLoading,
      buyerOrders.reorderingItemId,
      buyerOrders.summariesByOrderId,
    ],
  )

  const tableActions = useMemo<BuyerOrdersTableActions>(
    () => ({
      handleDateSortToggle: buyerOrders.handleDateSortToggle,
      handleExpandedChange: buyerOrders.handleExpandedChange,
      handleReorder: buyerOrders.handleReorder,
      requestCancelAction: buyerOrders.requestCancelAction,
      requestRefundAction: buyerOrders.requestRefundAction,
      setTrackingModalLinks: buyerOrders.setTrackingModalLinks,
    }),
    [
      buyerOrders.handleDateSortToggle,
      buyerOrders.handleExpandedChange,
      buyerOrders.handleReorder,
      buyerOrders.requestCancelAction,
      buyerOrders.requestRefundAction,
      buyerOrders.setTrackingModalLinks,
    ],
  )

  const paginationState = useMemo<BuyerOrdersPaginationState>(
    () => ({
      currentPage: buyerOrders.currentPage,
      pageSize: buyerOrders.pageSize,
      totalElements: buyerOrders.totalElements,
      totalPages: buyerOrders.totalPages,
    }),
    [buyerOrders.currentPage, buyerOrders.pageSize, buyerOrders.totalElements, buyerOrders.totalPages],
  )

  const paginationActions = useMemo<BuyerOrdersPaginationActions>(
    () => ({
      handlePageChange: buyerOrders.handlePageChange,
    }),
    [buyerOrders.handlePageChange],
  )

  const cancelModalState = useMemo<BuyerOrdersCancelModalState>(
    () => ({
      isConfirmingCancel: buyerOrders.isConfirmingCancel,
      pendingCancelAction: buyerOrders.pendingCancelAction,
    }),
    [buyerOrders.isConfirmingCancel, buyerOrders.pendingCancelAction],
  )

  const cancelModalActions = useMemo<BuyerOrdersCancelModalActions>(
    () => ({
      confirmPendingCancelAction: buyerOrders.confirmPendingCancelAction,
      setPendingCancelAction: buyerOrders.setPendingCancelAction,
    }),
    [buyerOrders.confirmPendingCancelAction, buyerOrders.setPendingCancelAction],
  )

  const trackingModalState = useMemo<BuyerOrdersTrackingModalState>(
    () => ({
      trackingModalLinks: buyerOrders.trackingModalLinks,
    }),
    [buyerOrders.trackingModalLinks],
  )

  const refundModalState = useMemo<BuyerOrdersRefundModalState>(
    () => ({
      isSubmittingRefund: buyerOrders.isSubmittingRefund,
      pendingRefundOrder: buyerOrders.pendingRefundOrder,
    }),
    [buyerOrders.isSubmittingRefund, buyerOrders.pendingRefundOrder],
  )

  const refundModalActions = useMemo<BuyerOrdersRefundModalActions>(
    () => ({
      requestRefundAction: buyerOrders.requestRefundAction,
      setPendingRefundOrder: buyerOrders.setPendingRefundOrder,
      submitRefundOrder: buyerOrders.submitRefundOrder,
    }),
    [buyerOrders.requestRefundAction, buyerOrders.setPendingRefundOrder, buyerOrders.submitRefundOrder],
  )

  const trackingModalActions = useMemo<BuyerOrdersTrackingModalActions>(
    () => ({
      setTrackingModalLinks: buyerOrders.setTrackingModalLinks,
    }),
    [buyerOrders.setTrackingModalLinks],
  )

  return composeProviders(
    [
    {
      render: (providerChildren) => (
        <BuyerOrdersAuthStateContext.Provider value={authState}>{providerChildren}</BuyerOrdersAuthStateContext.Provider>
      ),
    },
    {
      render: (providerChildren) => (
        <BuyerOrdersTabsStateContext.Provider value={tabsState}>{providerChildren}</BuyerOrdersTabsStateContext.Provider>
      ),
    },
    {
      render: (providerChildren) => (
        <BuyerOrdersTabsActionsContext.Provider value={tabsActions}>
          {providerChildren}
        </BuyerOrdersTabsActionsContext.Provider>
      ),
    },
    {
      render: (providerChildren) => (
        <BuyerOrdersTableStateContext.Provider value={tableState}>{providerChildren}</BuyerOrdersTableStateContext.Provider>
      ),
    },
    {
      render: (providerChildren) => (
        <BuyerOrdersTableActionsContext.Provider value={tableActions}>
          {providerChildren}
        </BuyerOrdersTableActionsContext.Provider>
      ),
    },
    {
      render: (providerChildren) => (
        <BuyerOrdersPaginationStateContext.Provider value={paginationState}>
          {providerChildren}
        </BuyerOrdersPaginationStateContext.Provider>
      ),
    },
    {
      render: (providerChildren) => (
        <BuyerOrdersPaginationActionsContext.Provider value={paginationActions}>
          {providerChildren}
        </BuyerOrdersPaginationActionsContext.Provider>
      ),
    },
    {
      render: (providerChildren) => (
        <BuyerOrdersCancelModalStateContext.Provider value={cancelModalState}>
          {providerChildren}
        </BuyerOrdersCancelModalStateContext.Provider>
      ),
    },
    {
      render: (providerChildren) => (
        <BuyerOrdersCancelModalActionsContext.Provider value={cancelModalActions}>
          {providerChildren}
        </BuyerOrdersCancelModalActionsContext.Provider>
      ),
    },
    {
      render: (providerChildren) => (
        <BuyerOrdersRefundModalStateContext.Provider value={refundModalState}>
          {providerChildren}
        </BuyerOrdersRefundModalStateContext.Provider>
      ),
    },
    {
      render: (providerChildren) => (
        <BuyerOrdersRefundModalActionsContext.Provider value={refundModalActions}>
          {providerChildren}
        </BuyerOrdersRefundModalActionsContext.Provider>
      ),
    },
    {
      render: (providerChildren) => (
        <BuyerOrdersTrackingModalStateContext.Provider value={trackingModalState}>
          {providerChildren}
        </BuyerOrdersTrackingModalStateContext.Provider>
      ),
    },
    {
      render: (providerChildren) => (
        <BuyerOrdersTrackingModalActionsContext.Provider value={trackingModalActions}>
          {providerChildren}
        </BuyerOrdersTrackingModalActionsContext.Provider>
      ),
    },
  ],
    children,
  )
}

export function useBuyerOrdersAuthState(): BuyerOrdersAuthState {
  return useRequiredContext(BuyerOrdersAuthStateContext, "useBuyerOrdersAuthState")
}

export function useBuyerOrdersTabsState(): BuyerOrdersTabsState {
  return useRequiredContext(BuyerOrdersTabsStateContext, "useBuyerOrdersTabsState")
}

export function useBuyerOrdersTabsActions(): BuyerOrdersTabsActions {
  return useRequiredContext(BuyerOrdersTabsActionsContext, "useBuyerOrdersTabsActions")
}

export function useBuyerOrdersTableState(): BuyerOrdersTableState {
  return useRequiredContext(BuyerOrdersTableStateContext, "useBuyerOrdersTableState")
}

export function useBuyerOrdersTableActions(): BuyerOrdersTableActions {
  return useRequiredContext(BuyerOrdersTableActionsContext, "useBuyerOrdersTableActions")
}

export function useBuyerOrdersPaginationState(): BuyerOrdersPaginationState {
  return useRequiredContext(BuyerOrdersPaginationStateContext, "useBuyerOrdersPaginationState")
}

export function useBuyerOrdersPaginationActions(): BuyerOrdersPaginationActions {
  return useRequiredContext(BuyerOrdersPaginationActionsContext, "useBuyerOrdersPaginationActions")
}

export function useBuyerOrdersCancelModalState(): BuyerOrdersCancelModalState {
  return useRequiredContext(BuyerOrdersCancelModalStateContext, "useBuyerOrdersCancelModalState")
}

export function useBuyerOrdersCancelModalActions(): BuyerOrdersCancelModalActions {
  return useRequiredContext(BuyerOrdersCancelModalActionsContext, "useBuyerOrdersCancelModalActions")
}

export function useBuyerOrdersRefundModalState(): BuyerOrdersRefundModalState {
  return useRequiredContext(BuyerOrdersRefundModalStateContext, "useBuyerOrdersRefundModalState")
}

export function useBuyerOrdersRefundModalActions(): BuyerOrdersRefundModalActions {
  return useRequiredContext(BuyerOrdersRefundModalActionsContext, "useBuyerOrdersRefundModalActions")
}

export function useBuyerOrdersTrackingModalState(): BuyerOrdersTrackingModalState {
  return useRequiredContext(BuyerOrdersTrackingModalStateContext, "useBuyerOrdersTrackingModalState")
}

export function useBuyerOrdersTrackingModalActions(): BuyerOrdersTrackingModalActions {
  return useRequiredContext(BuyerOrdersTrackingModalActionsContext, "useBuyerOrdersTrackingModalActions")
}

export function useBuyerOrdersTableSelector<T>(selector: (state: BuyerOrdersTableState) => T): T {
  return selector(useBuyerOrdersTableState())
}

export function useBuyerOrdersPaginationSelector<T>(selector: (state: BuyerOrdersPaginationState) => T): T {
  return selector(useBuyerOrdersPaginationState())
}

export function useBuyerOrdersCancelModalSelector<T>(selector: (state: BuyerOrdersCancelModalState) => T): T {
  return selector(useBuyerOrdersCancelModalState())
}

export function useBuyerOrdersTrackingModalSelector<T>(selector: (state: BuyerOrdersTrackingModalState) => T): T {
  return selector(useBuyerOrdersTrackingModalState())
}
