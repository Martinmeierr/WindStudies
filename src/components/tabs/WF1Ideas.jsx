import { useState, useEffect } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { Button }  from '@/components/ui/button'
import { Label }   from '@/components/ui/label'
import { cn }      from '@/lib/utils'
import { callWebhook, WebhookError, WEBHOOKS } from '@/lib/webhooks'

const ANILLOS = [
  { n: 1, label: 'Emoción',   desc: 'Audiencia fría — VSL, identificación inmediata' },
  { n: 2, label: 'Confianza', desc: 'Humanización — historia del fundador, UGC' },
  { n: 3, label: 'Educación', desc: 'Interesada — mecanismo, demos, FAQ' },
  { n: 4, label: 'Objeciones',desc: 'Tibia — romper frenos con lógica honesta' },
  { n: 5, label: 'Cierre',    desc: 'Caliente — oferta, CTA, conversión' },
]

const TIPOS = [
  { id: 'reel',     label: 'Reels',      key: 'Reels'     },
  { id: 'post',     label: 'Posts',      key: 'Posts'     },
  { id: 'story',    label: 'Stories',    key: 'Stories'   },
  { id: 'carrusel', label: 'Carruseles', key: 'Carrusel'  },
]

const defaultChecked = { reel: true, post: false, story: false, carrusel: false }
const defaultCounts  = { reel: 1,    post: 1,     story: 1,     carrusel: 1    }

export default function WF1Ideas({ showToast }) {
  const [anillo,   setAnillo]   = useState(1)
  const [clienteCodigo, setClienteCodigo] = useState('')
  const [clientes,        setClientes]        = useState([])
  const [clientesLoading, setClientesLoading] = useState(true)
  const [clientesError,   setClientesError]   = useState(false)
  const [contexto, setContexto] = useState('')
  const [checked,  setChecked]  = useState(defaultChecked)
  const [counts,   setCounts]   = useState(defaultCounts)
  const [loading,  setLoading]  = useState(false)

  const selectedAnillo = ANILLOS.find(a => a.n === anillo)
  const clienteSel     = clientes.find(c => c.codigo === clienteCodigo)

  async function cargarClientes() {
    setClientesLoading(true)
    setClientesError(false)
    try {
      const res  = await fetch(WEBHOOKS.clientes, { method: 'GET' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`)
      setClientes(Array.isArray(data.clientes) ? data.clientes : [])
    } catch {
      setClientesError(true)
      showToast?.('No se pudo cargar la lista de clientes.', 'error')
    } finally {
      setClientesLoading(false)
    }
  }

  useEffect(() => { cargarClientes() }, [])

  function toggleTipo(id) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function setCount(id, val) {
    setCounts(prev => ({ ...prev, [id]: Math.max(1, Math.min(10, Number(val))) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!clienteSel) {
      showToast('Seleccioná un cliente.', 'error')
      return
    }
    const activeTipos = TIPOS.filter(t => checked[t.id])
    if (!activeTipos.length) {
      showToast('Seleccioná al menos un tipo de idea.', 'error')
      return
    }

    const ideasStr = activeTipos.map(t => `${t.key} ${counts[t.id]}`).join(', ')
    // Mandamos "COD Nombre" (ej "NK Nike") para que WF1 resuelva el cliente con
    // match exacto contra la carpeta/página "(COD) Nombre" y sin ambigüedad (el COD es único).
    const clienteText = `${clienteSel.codigo} ${clienteSel.nombre}`
    let text = `Anillo: ${anillo}\nCliente: ${clienteText}`
    if (contexto.trim()) text += `\nContexto: ${contexto.trim()}`
    text += `\nIdeas: ${ideasStr}`

    setLoading(true)
    try {
      const res = await callWebhook(WEBHOOKS.wf1, { text, chat_id: 'web' })
      showToast(res.message ?? `Ideas generadas para ${clienteSel.nombre} (Anillo ${anillo})`, 'success')
      setClienteCodigo(''); setContexto('')
      setChecked(defaultChecked); setCounts(defaultCounts)
    } catch (err) {
      showToast(err instanceof WebhookError ? err.message : 'No se pudo conectar con n8n.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7 animate-fade-in">

      {/* Anillo */}
      <div className="space-y-3">
        <Label>Anillo estratégico</Label>
        <div className="grid grid-cols-5 gap-2">
          {ANILLOS.map(a => (
            <button
              key={a.n}
              type="button"
              onClick={() => setAnillo(a.n)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl border py-3 text-sm font-bold transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                anillo === a.n
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              <span className="text-lg leading-none">{a.n}</span>
              <span className="text-[10px] font-medium hidden sm:block">{a.label}</span>
            </button>
          ))}
        </div>
        {selectedAnillo && (
          <p className="text-xs text-muted-foreground animate-fade-in">
            <span className="font-semibold text-foreground">{selectedAnillo.label}:</span>{' '}
            {selectedAnillo.desc}
          </p>
        )}
      </div>

      {/* Cliente (selector — manda COD + nombre para resolución determinística) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="wf1-cliente">Cliente</Label>
          <button
            type="button"
            onClick={cargarClientes}
            disabled={clientesLoading}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={cn('w-3 h-3', clientesLoading && 'animate-spin')} /> Actualizar
          </button>
        </div>
        <select
          id="wf1-cliente"
          value={clienteCodigo}
          onChange={e => setClienteCodigo(e.target.value)}
          required
          disabled={clientesLoading || clientesError}
          className={cn(
            'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
            'transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
          )}
        >
          <option value="" disabled>
            {clientesLoading
              ? 'Cargando clientes...'
              : clientesError
                ? 'Error al cargar — tocá Actualizar'
                : 'Seleccioná un cliente'}
          </option>
          {clientes.map(c => (
            <option key={c.codigo} value={c.codigo}>
              {c.nombre} ({c.codigo})
            </option>
          ))}
        </select>
      </div>

      {/* Contexto */}
      <div className="space-y-1.5">
        <Label>
          Contexto{' '}
          <span className="normal-case font-normal text-muted-foreground/60">
            (opcional)
          </span>
        </Label>
        <textarea
          value={contexto}
          onChange={e => setContexto(e.target.value)}
          placeholder="Estrategia, diferencial, observaciones de sesión..."
          rows={3}
          className={cn(
            'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
            'placeholder:text-muted-foreground resize-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
            'transition-all duration-200'
          )}
        />
      </div>

      {/* Tipos de ideas */}
      <div className="space-y-3">
        <Label>Ideas a generar</Label>
        <div className="grid grid-cols-2 gap-3">
          {TIPOS.map(t => (
            <div
              key={t.id}
              onClick={() => toggleTipo(t.id)}
              className={cn(
                'flex items-center justify-between gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200 select-none',
                checked[t.id]
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-border/80'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0',
                  checked[t.id]
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/40'
                )}>
                  {checked[t.id] && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  checked[t.id] ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {t.label}
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={10}
                value={counts[t.id]}
                onClick={e => e.stopPropagation()}
                onChange={e => setCount(t.id, e.target.value)}
                className={cn(
                  'w-14 h-8 text-center rounded-lg border text-sm font-semibold',
                  'bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all',
                  checked[t.id] ? 'border-primary/50 text-primary' : 'border-border text-muted-foreground'
                )}
              />
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full gap-2" disabled={loading || !clienteCodigo}>
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
          : <><Sparkles className="w-4 h-4" /> Generar Ideas</>
        }
      </Button>
    </form>
  )
}
