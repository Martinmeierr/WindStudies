import { useState } from 'react'
import { FolderOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { callWebhook, WebhookError, WEBHOOKS } from '@/lib/webhooks'

export default function WF3Onboarding({ showToast }) {
  const [cliente, setCliente] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const text = `Onboarding: ${cliente.trim()}`
    setLoading(true)
    try {
      const res = await callWebhook(WEBHOOKS.wf3, { text, chat_id: 'web' })
      showToast(res.message ?? `Onboarding procesado para ${cliente.trim()}`, 'success')
      setCliente('')
    } catch (err) {
      showToast(err instanceof WebhookError ? err.message : 'No se pudo conectar con n8n.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7 animate-fade-in">
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">¿Qué hace este flujo?</p>
        <p>
          Busca la carpeta del cliente en Google Drive, lee los documentos de onboarding
          y extrae el contexto estratégico hacia Notion automáticamente.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wf3-cliente">Cliente</Label>
        <Input
          id="wf3-cliente"
          value={cliente}
          onChange={e => setCliente(e.target.value)}
          placeholder="Ej: Nike"
          required
        />
        <p className="text-xs text-muted-foreground">
          Tiene que coincidir exactamente con el nombre de la carpeta en Google Drive.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full gap-2" disabled={loading || !cliente.trim()}>
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
          : <><FolderOpen className="w-4 h-4" /> Procesar Onboarding</>
        }
      </Button>
    </form>
  )
}
