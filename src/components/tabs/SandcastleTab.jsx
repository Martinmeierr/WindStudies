import { useState, useEffect } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { cn }     from '@/lib/utils'
import { callWebhook, WebhookError, WEBHOOKS, fetchClientes } from '@/lib/webhooks'

export default function SandcastleTab({ showToast }) {
  const [clientes,         setClientes]         = useState([])
  const [clientesLoading,  setClientesLoading]  = useState(true)
  const [clientesFallback, setClientesFallback] = useState(false)
  const [cliente,          setCliente]          = useState('')
  const [tipo,             setTipo]             = useState('04_analisis')
  const [data,             setData]             = useState('')
  const [loading,          setLoading]          = useState(false)

  useEffect(() => {
    fetchClientes()
      .then(list => {
        setClientes(list)
        setClientesLoading(false)
      })
      .catch(() => {
        setClientesFallback(true)
        setClientesLoading(false)
        showToast('No se pudo cargar la lista de clientes.', 'error')
      })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await callWebhook(WEBHOOKS.sandcastle, {
        cliente,
        tipo,
        data: data.trim(),
        chat_id: 'web',
      })
      showToast(res.message ?? 'Análisis guardado', 'success')
      setData('')
    } catch (err) {
      showToast(err instanceof WebhookError ? err.message : 'No se pudo conectar con n8n.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const textareaClass = cn(
    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
    'placeholder:text-muted-foreground resize-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
    'transition-all duration-200'
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-7 animate-fade-in">

      {/* Info card */}
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">¿Qué hace este flujo?</p>
        <p>
          La IA analiza los datos de Sandcastle y los escribe dentro del archivo seleccionado
          en la carpeta ONBOARDING del cliente. Acepta CSV o JSON.
        </p>
      </div>

      {/* Cliente */}
      <div className="space-y-1.5">
        <Label htmlFor="sandcastle-cliente">Cliente</Label>

        {clientesFallback ? (
          <Input
            id="sandcastle-cliente"
            value={cliente}
            onChange={e => setCliente(e.target.value)}
            placeholder="Nombre exacto del cliente"
            required
          />
        ) : (
          <select
            id="sandcastle-cliente"
            value={cliente}
            onChange={e => setCliente(e.target.value)}
            disabled={clientesLoading}
            required
            className={cn(
              'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
              'transition-all duration-200',
              clientesLoading ? 'text-muted-foreground' : ''
            )}
          >
            {clientesLoading ? (
              <option value="" disabled>Cargando clientes...</option>
            ) : (
              <>
                <option value="" disabled>Seleccioná un cliente...</option>
                {clientes.map(c => (
                  <option key={c.codigo ?? c.nombre} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </>
            )}
          </select>
        )}
      </div>

      {/* Tipo de archivo */}
      <div className="space-y-2">
        <Label>Tipo de archivo</Label>
        <div className="flex gap-2">
          {[
            { value: '03_redes',   label: '03_REDES'   },
            { value: '04_analisis', label: '04_ANALISIS' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTipo(opt.value)}
              className={cn(
                'flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                tipo === opt.value
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">03_REDES</span> = informe de performance (método Callaway).{' '}
          <span className="font-medium text-foreground">04_ANALISIS</span> = JSON estructurado de hooks/formatos para el guionista.
        </p>
      </div>

      {/* Data */}
      <div className="space-y-1.5">
        <Label htmlFor="sandcastle-data">Datos exportados de Sandcastle</Label>
        <textarea
          id="sandcastle-data"
          value={data}
          onChange={e => setData(e.target.value)}
          placeholder="Pegá acá el CSV o JSON exportado de Sandcastle..."
          rows={10}
          className={textareaClass}
          required
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2"
        disabled={loading || !cliente || !data.trim()}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Analizando...</>
          : <><BarChart3 className="w-4 h-4" /> Analizar y guardar</>
        }
      </Button>
    </form>
  )
}
