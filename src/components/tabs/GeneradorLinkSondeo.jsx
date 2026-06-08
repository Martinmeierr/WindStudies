import { useState, useEffect } from 'react'
import { Link2, Loader2, Copy, Check, RefreshCw, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WEBHOOKS } from '@/lib/webhooks'

// Base del Sondeo Previo en windstudies-web (HashRouter → el query va DESPUÉS del #).
const SONDEO_BASE = 'https://martinmeierr.github.io/WindStudies-web/#/sondeo'

export default function GeneradorLinkSondeo({ showToast }) {
  const [clientes, setClientes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [copiado,  setCopiado]  = useState(null) // código recién copiado

  async function cargar() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(WEBHOOKS.clientes, { method: 'GET' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`)
      setClientes(Array.isArray(data.clientes) ? data.clientes : [])
    } catch {
      setError('No se pudo cargar la lista de clientes.')
      showToast?.('No se pudo cargar la lista de clientes.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const linkDe = codigo => `${SONDEO_BASE}?cliente=${encodeURIComponent(codigo)}`

  async function copiar(codigo) {
    try {
      await navigator.clipboard.writeText(linkDe(codigo))
      setCopiado(codigo)
      showToast?.(`Link del sondeo de ${codigo} copiado`, 'success')
      setTimeout(() => setCopiado(c => (c === codigo ? null : c)), 2000)
    } catch {
      showToast?.('No se pudo copiar al portapapeles.', 'error')
    }
  }

  async function copiarGenerico() {
    try {
      await navigator.clipboard.writeText(SONDEO_BASE)
      showToast?.('Link genérico copiado (sin cliente → va a Prospectos)', 'success')
    } catch {
      showToast?.('No se pudo copiar al portapapeles.', 'error')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 flex items-center gap-2">
        <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          Generá el link del <span className="font-semibold text-primary">Sondeo Previo</span> de cada cliente. El código va embebido en el link — el cliente no escribe nada.
        </p>
      </div>

      {/* Link genérico para prospectos */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Link genérico (sin cliente)</p>
          <p className="text-xs text-muted-foreground">Para prospectos — las respuestas caen en “SONDEOS PROSPECTOS”.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={copiarGenerico}>
          <Copy className="w-3.5 h-3.5" /> Copiar
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Clientes ({clientes.length})
        </p>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={cargar} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando clientes...
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-destructive">{error}</div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No hay clientes con carpeta en Drive todavía.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {clientes.map(c => {
            const isCop = copiado === c.codigo
            return (
              <div key={c.codigo} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 hover:border-primary/30 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground font-mono">({c.codigo})</p>
                </div>
                <Button
                  variant={isCop ? 'secondary' : 'outline'}
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => copiar(c.codigo)}
                >
                  {isCop
                    ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copiado</>
                    : <><Copy className="w-3.5 h-3.5" /> Copiar link</>}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
