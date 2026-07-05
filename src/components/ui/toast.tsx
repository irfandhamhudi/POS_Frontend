import * as React from "react"
import { X } from "lucide-react"
import { cn } from "src/lib/utils"

export interface ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export const ToastViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col p-4 sm:right-0 sm:top-0 md:max-w-[420px] gap-3",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

export const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onClose?: () => void
  }
>(({ className, onClose, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border border-[#EBEAE4] bg-white p-6 pr-8 shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-top-4",
        className
      )}
      {...props}
    >
      <div className="grid gap-1">{props.children}</div>
      <button
        onClick={onClose}
        className="absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:text-gray-900 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
})
Toast.displayName = "Toast"

export const ToastTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("text-sm font-bold text-gray-950 text-left", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

export const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-gray-500 font-medium text-left", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"
