"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  footer?: React.ReactNode
  maxWidthClassName?: string
  contentClassName?: string
  bodyClassName?: string
  footerClassName?: string
  overlayClassName?: string
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  /**
   * By default Radix moves focus to the first focusable element inside the dialog when it opens.
   * If that element is something like a tooltip trigger, this steals focus and can pop the tooltip
   * open unintentionally. Set this to opt out of that automatic focus for dialogs whose content
   * doesn't need (or would be harmed by) an autofocused control.
   */
  preventAutoFocus?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title = "Dialog",
  footer,
  maxWidthClassName = "max-w-md",
  contentClassName,
  bodyClassName,
  footerClassName,
  overlayClassName,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventAutoFocus = false,
}: ModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent
        hideCloseButton
        overlayClassName={overlayClassName}
        className={cn(
          "max-h-[90vh] overflow-y-auto p-0 transition-all duration-200",
          "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
          "data-[state=open]:scale-100 data-[state=closed]:scale-95",
          maxWidthClassName,
          contentClassName,
        )}
        onEscapeKeyDown={(event) => {
          if (!closeOnEscape) {
            event.preventDefault()
          }
        }}
        onPointerDownOutside={(event) => {
          if (!closeOnOverlayClick) {
            event.preventDefault()
          }
        }}
        onOpenAutoFocus={(event) => {
          if (preventAutoFocus) {
            event.preventDefault()
          }
        }}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className={cn("w-full", bodyClassName)}>{children}</div>
        {footer ? <div className={cn("border-t border-border-soft p-4 sm:p-6", footerClassName)}>{footer}</div> : null}
      </DialogContent>
    </Dialog>
  )
}
