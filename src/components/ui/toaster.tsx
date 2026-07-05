import {
  Toast,
  ToastDescription,
  ToastTitle,
  ToastViewport,
} from "./toast"
import { useToast } from "src/hooks/use-toast"
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastViewport>
      {toasts.map(function ({ id, title, description, variant = 'default', ...props }) {
        const isError = variant === 'error'
        const isAmber = variant === 'amber'
        return (
          <Toast key={id} onClose={() => dismiss(id)} {...props}>
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center size-8 rounded-full shrink-0 ${isError ? 'bg-red-50 text-red-600' : isAmber ? 'bg-amber-50 text-amber-700' : 'bg-[#E6F3EE] text-[#0A422D]'}`}>
                {isError ? <XCircle className="size-5" /> : isAmber ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
              </div>
              <div className="flex flex-col text-left">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
          </Toast>
        )
      })}
    </ToastViewport>
  )
}
