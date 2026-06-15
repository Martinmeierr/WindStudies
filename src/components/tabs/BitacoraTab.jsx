import { useState, useEffect } from 'react'
import { BookText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { cn }     from '@/lib/utils'
import { callWebhook, WebhookError, WEBHOOKS, fetchClientes } from '@/lib/webhooks'

export default function BitacoraTab({ showToast }) {
  const [clientes,         setClientes]         = useState([])
  const [clientesLoading,  setClientesLoading]  = useState(true)
  const [clientesFallback, setClientesFallback] = useState(false)
  const [cliente,          setCliente]          = useState('')
  const [texto,            setTexto]            = useState('')
  const [modo,             setModo]             = useState('actualizar')
  const [loading,          setLoading]          = useState(false)

  useEffect(() => {
    fetchClientes()
      .then(data => {
        setClientes(data)
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
      const res = await callWebhook(WEBHOOKS.bitacora, {
        cliente,
        texto: texto.trim(),
        modo,
        chat_id: 'web',
      })
      showToast(res.message ?? 'Bitácora actualizada', 'success')
      setTexto('')
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

      {/* Info */}
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">¿Qué hace este flujo?</p>
        <p>
          Archiva la bitácora actual con la fecha del mes y crea una nueva con el texto
          integrado. Si el cliente todavía no tiene bitácora, se rechaza.
        </p>
      </div>

      {/* Cliente */}
      <div className="space-y-1.5">
        <Label htmlFor="bitacora-cliente">Cliente</Label>

        {clientesFallback ? (
          <Input
            id="bitacora-cliente"
            value={cliente}
            onChange={e => setCliente(e.target.value)}
            placeholder="Nombre exacto del cliente"
            required
          />
        ) : (
          <select
            id="bitacora-cliente"
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

      {/* Texto */}
      <div className="space-y-1.5">
        <Label htmlFor="bitacora-texto">Texto para la bitácora</Label>
        <textarea
          id="bitacora-texto"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Pegá acá lo que querés sumar a la bitácora..."
          rows={6}
          className={textareaClass}
          required
        />
      </div>

      {/* Modo */}
      <div className="space-y-2">
        <Label>Modo</Label>
        <div className="flex gap-2">
          {[
            { value: 'actualizar', label: 'Actualizar existente' },
            { value: 'crear',      label: 'Crear nueva'          },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setModo(opt.value)}
              className={cn(
                'flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                modo === opt.value
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2"
        disabled={loading || !cliente || !texto.trim()}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
          : <><BookText className="w-4 h-4" /> Guardar en Bitácora</>
        }
      </Button>
    </form>
  )
}
