import { useState } from 'react'
import { Wind, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login({ onLogin }) {
  const [pwd, setPwd]     = useState('')
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (onLogin(pwd)) return
    setError('Contraseña incorrecta')
    setPwd('')
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 pointer-events-none" />

      <div
        className={`
          relative w-full max-w-sm
          rounded-3xl border border-border bg-card shadow-2xl
          p-8 flex flex-col items-center gap-8
          animate-slide-up
          ${shaking ? 'animate-[wiggle_.4s_ease-in-out]' : ''}
        `}
        style={shaking ? { animation: 'wiggle .4s ease-in-out' } : {}}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
            <Wind className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              WindStudies
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Panel de Control</p>
          </div>
        </div>

        {/* Form */}
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="pwd">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="pwd"
                type="password"
                value={pwd}
                onChange={e => { setPwd(e.target.value); setError('') }}
                placeholder="••••••••"
                className="pl-9"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-destructive animate-fade-in">{error}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-11 text-base" disabled={!pwd}>
            Ingresar
          </Button>
        </form>

        {/* Footer */}
        <p className="text-xs text-muted-foreground/50">
          WindStudies © {new Date().getFullYear()}
        </p>
      </div>

      <style>{`
        @keyframes wiggle {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
