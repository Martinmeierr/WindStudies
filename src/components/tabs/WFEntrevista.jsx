import { useState, useEffect } from 'react'
import { Mic, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label }  from '@/components/ui/label'
import { cn }     from '@/lib/utils'
import { callWebhook, WebhookError, WEBHOOKS } from '@/lib/webhooks'

export default function WFEntrevista({ showToast }) {
  const [clienteCodigo,   setClienteCodigo]   = useState('')
  const [clientes,        setClientes]        = useState([])
  const [clientesLoading, setClientesLoading] = useState(true)
  const [clientesError,   setClientesError]   = useState(false)
  const [notas,   setNotas]   = useState('')
  const [loading, setLoading] = useState(false)

  const clienteSel = clientes.find(c => c.codigo === clienteCodigo)

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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!clienteSel) {
      showToast('Seleccioná un cliente.', 'error')
      return
    }
    if (!notas.trim()) {
      showToast('Pegá las notas de la entrevista.', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await callWebhook(WEBHOOKS.entrevista, {
        codigo: clienteSel.codigo,
        nombre: clienteSel.nombre,
        notas: notas.trim(),
        chat_id: 'web',
      })
      showToast(res.message ?? `02_ENTREVISTA generado para ${clienteSel.nombre}`, 'success')
      setNotas(''); setClienteCodigo('')
    } catch (err) {
      showToast(err instanceof WebhookError ? err.message : 'No se pudo conectar con n8n.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7 animate-fade-in">

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 flex items-start gap-2">
        <Mic className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Pegá las notas crudas de la entrevista (las de <span className="font-semibold text-primary">Gemini</span> o las tuyas). Claude las resume y las guarda como{' '}
          <span className="font-mono text-foreground">02_ENTREVISTA</span> en la carpeta ONBOARDING del cliente (sobrescribe si ya existe).
        </p>
      </div>

      {/* Cliente */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="ent-cliente">Cliente</Label>
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
          id="ent-cliente"
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

      {/* Notas */}
      <div className="space-y-1.5">
        <Label htmlFor="ent-notas">Notas de la entrevista</Label>
        <textarea
          id="ent-notas"
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder="Pegá acá las notas / transcript crudo de la entrevista..."
          rows={12}
          required
          className={cn(
            'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
            'placeholder:text-muted-foreground resize-y min-h-[200px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
            'transition-all duration-200'
          )}
        />
      </div>

      <Button type="submit" size="lg" className="w-full gap-2" disabled={loading || !clienteCodigo || !notas.trim()}>
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
          : <><Mic className="w-4 h-4" /> Generar 02_ENTREVISTA</>
        }
      </Button>
    </form>
  )
}
