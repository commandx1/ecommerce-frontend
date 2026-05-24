"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-brand-strong/30 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        className,
      )}
      {...props}
    />
  )
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  hideCloseButton?: boolean
  overlayClassName?: string
}

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  ({ className, children, hideCloseButton = true, overlayClassName, ...props }, ref) => {
    return (
      <DialogPortal>
        <DialogOverlay className={overlayClassName} />
        <DialogPrimitive.Content
          ref={ref}
          data-slot="dialog-content"
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-4xl border border-border-soft bg-surface-elevated p-0 shadow-floating duration-200 sm:max-w-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            "data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-2",
            className,
          )}
          {...props}
        >
          {children}
          {!hideCloseButton ? (
            <DialogPrimitive.Close
              className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPortal>
    )
  },
)
DialogContent.displayName = DialogPrimitive.Content.displayName

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
