import { useState } from 'react'
import { Info, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Panel de ayuda colapsable para los módulos v2.
// Cerrado por defecto; se abre con el botón "ⓘ Cómo funciona este módulo v2".
// `items` es un array de strings (cada uno se muestra como bullet).
export default function HelpV2({
  title = 'Cómo funciona este módulo v2',
  items = [],
  className,
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('rounded-xl border border-border bg-muted/40 overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium',
          'text-muted-foreground hover:text-foreground transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl'
        )}
      >
        <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
        <span className="flex-1">{title}</span>
        <ChevronDown
          className={cn('w-4 h-4 shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="border-t border-border px-4 py-3 animate-fade-in">
          <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            {items.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
