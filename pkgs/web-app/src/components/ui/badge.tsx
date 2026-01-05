import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary hover:bg-primary/20",
        secondary: "bg-secondary/50 text-secondary-foreground hover:bg-secondary/70",
        success: "bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-500",
        warning: "bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-500",
        error: "bg-error-50 text-error-700 dark:bg-error-700/20 dark:text-error-500",
        outline: "border border-input bg-transparent text-foreground hover:bg-accent"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
