import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors hover:cursor-pointer",
            checked
              ? "bg-blue-600 border-blue-600"
              : "bg-white border-gray-300 hover:border-blue-400",
            className
          )}
        >
          {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
