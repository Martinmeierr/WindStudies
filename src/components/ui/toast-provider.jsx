import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toast({ message, type = 'success', onDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 4000)
    return () => clearTimeout(t)
  }, [onDone])

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    error:   <XCircle     className="w-4 h-4 text-destructive" />,
    loading: <Loader2     className="w-4 h-4 animate-spin text-primary" />,
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl',
        'bg-card border border-border text-sm font-medium text-foreground',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      {icons[type]}
      {message}
    </div>
  )
}
