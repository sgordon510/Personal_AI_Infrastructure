import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#2e7de9] text-white",
        secondary: "border-transparent bg-gray-100 text-gray-900",
        destructive: "border-transparent bg-[#f52a65] text-white",
        warning: "border-transparent bg-[#f0a020] text-white",
        success: "border-transparent bg-[#33b579] text-white",
        outline: "text-gray-900",
        critical: "border-transparent bg-[#f52a65] text-white",
        high: "border-transparent bg-[#f0a020] text-white",
        medium: "border-transparent bg-[#2e7de9] text-white",
        low: "border-transparent bg-[#33b579] text-white",
        none: "border-transparent bg-gray-400 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
