import { useState } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { callWebhook, WebhookError, WEBHOOKS } from '@/lib/webhooks'

export default function WF4NuevoCliente({ showToast }) {
  const [nombre,  setNombre]  = useState('')
  const [codigo,  setCodigo]  = useState('')
  const [rubro,   setRubro]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const cod  = codigo.trim().toUpperCase()
    const text = `Nuevo cliente: ${nombre.trim()} / ${cod} / ${rubro.trim()}`
    setLoading(true)
    try {
      const res = await callWebhook(WEBHOOKS.wf4, { text, chat_id: 'web' })
      showToast(res.message ?? `${nombre.trim()} dado de alta correctamente`, 'success')
      setNombre(''); setCodigo(''); setRubro('')
    } catch (err) {
      showToast(err instanceof WebhookError ? err.message : 'No se pudo conectar con n8n.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const preview = nombre && codigo && rubro
    ? `(${codigo.toUpperCase()}) ${nombre}`
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-7 animate-fade-in">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Nombre */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="wf4-nombre">Nombre del cliente</Label>
          <Input
            id="wf4-nombre"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Nike"
            required
          />
        </div>

        {/* Código */}
        <div className="space-y-1.5">
          <Label htmlFor="wf4-codigo">Código</Label>
          <Input
            id="wf4-codigo"
            value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ej: NK"
            maxLength={10}
            required
          />
          <p className="text-xs text-muted-foreground">Se usa en el nombre de carpeta.</p>
        </div>

        {/* Rubro */}
        <div className="space-y-1.5">
          <Label htmlFor="wf4-rubro">Rubro</Label>
          <Input
            id="wf4-rubro"
            value={rubro}
            onChange={e => setRubro(e.target.value)}
            placeholder="Ej: Ropa deportiva"
            required
          />
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 animate-fade-in">
          <p className="text-xs text-muted-foreground mb-0.5">Nombre de carpeta en Drive</p>
          <p className="text-sm font-semibold text-primary font-mono">{preview}</p>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2"
        disabled={loading || !nombre.trim() || !codigo.trim() || !rubro.trim()}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Dando de alta...</>
          : <><UserPlus className="w-4 h-4" /> Dar de Alta</>
        }
      </Button>
    </form>
  )
}
