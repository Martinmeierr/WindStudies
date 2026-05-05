import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-primary/15 text-primary',
        secondary:   'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive/15 text-destructive',
        success:     'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
