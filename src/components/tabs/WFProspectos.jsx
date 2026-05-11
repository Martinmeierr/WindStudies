import { useState } from 'react'
import { Search, Loader2, MapPin, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { callWebhook, WebhookError, WEBHOOKS } from '@/lib/webhooks'

export default function WFProspectos({ showToast }) {
  const [nicho,   setNicho]   = useState('')
  const [zona,    setZona]    = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await callWebhook(WEBHOOKS.prospectos, {
        nicho: nicho.trim(),
        zona:  zona.trim(),
      })
      showToast('Búsqueda iniciada — los resultados van llegando a Notion', 'success')
      setNicho('')
      setZona('')
    } catch (err) {
      showToast(
        err instanceof WebhookError ? err.message : 'No se pudo conectar con n8n.',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const ready = nicho.trim() && zona.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-7 animate-fade-in">

      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ingresá el rubro y la ciudad. El flujo busca empresas en Google Maps,
          extrae sus emails y los guarda en Notion con estado{' '}
          <span className="font-semibold text-foreground">Pendiente</span>.
          Desde ahí aprobás cuáles contactar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="pros-nicho">
            <Tag className="inline w-3.5 h-3.5 mr-1 opacity-60" />
            Nicho / Rubro
          </Label>
          <Input
            id="pros-nicho"
            value={nicho}
            onChange={e => setNicho(e.target.value)}
            placeholder="Ej: Clínica dental, Agencia inmobiliaria"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pros-zona">
            <MapPin className="inline w-3.5 h-3.5 mr-1 opacity-60" />
            Zona / Ciudad
          </Label>
          <Input
            id="pros-zona"
            value={zona}
            onChange={e => setZona(e.target.value)}
            placeholder="Ej: Buenos Aires, Palermo"
            required
          />
        </div>
      </div>

      {ready && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 animate-fade-in">
          <p className="text-xs text-muted-foreground mb-0.5">Búsqueda a ejecutar</p>
          <p className="text-sm font-semibold text-primary">
            {nicho.trim()} en {zona.trim()}
          </p>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2"
        disabled={loading || !ready}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Buscando prospectos...</>
          : <><Search className="w-4 h-4" /> Buscar Prospectos</>
        }
      </Button>
    </form>
  )
}
