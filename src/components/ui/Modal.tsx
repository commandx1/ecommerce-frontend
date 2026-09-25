"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

/** Re-exported so a caller that opts into `customTitle` can supply its own visible heading as
 * the dialog's accessible title (via `<ModalTitle asChild><h2>...</h2></ModalTitle>`) instead of
 * the invisible one `Modal` renders by default. */
export const ModalTitle = DialogTitle

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  /**
   * Every Radix Dialog needs exactly one `DialogTitle` for accessibility. By default `Modal`
   * renders one itself (visually hidden, from `title`). Some callers already render their own
   * visible heading as the dialog's title; set this to skip Modal's own title and render that
   * heading via `<ModalTitle asChild>` in `children` instead, so there is still exactly one.
   */
  customTitle?: boolean
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
  /**
   * Radix's default `modal` Dialog locks focus inside itself and disables pointer events on the
   * rest of the page. That trap fights a `Select`/other Radix popover rendered inside the dialog
   * (both portal to `document.body`), so a dialog that hosts one of those needs this set to
   * `false`. Losing the strict trap for that one dialog is an accepted trade-off, not a bug: the
   * overlay, Esc-to-close and outside-click-to-close all keep working either way.
   */
  trapFocus?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title = "Dialog",
  customTitle = false,
  footer,
  maxWidthClassName = "max-w-md",
  contentClassName,
  bodyClassName,
  footerClassName,
  overlayClassName,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventAutoFocus = false,
  trapFocus = true,
}: ModalProps) {
  return (
    <Dialog
      modal={trapFocus}
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
        {customTitle ? null : <DialogTitle className="sr-only">{title}</DialogTitle>}
        <div className={cn("w-full", bodyClassName)}>{children}</div>
        {footer ? <div className={cn("border-t border-border-soft p-4 sm:p-6", footerClassName)}>{footer}</div> : null}
      </DialogContent>
    </Dialog>
  )
}
