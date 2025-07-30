import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <Loader2 aria-label="Loading" className={cn("animate-spin", className)} {...props} />
  )
}

export default Spinner
