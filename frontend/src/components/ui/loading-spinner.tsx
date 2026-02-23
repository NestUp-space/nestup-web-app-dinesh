import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const

interface LoadingSpinnerProps {
  size?: keyof typeof sizeClasses
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)}
    />
  )
}
