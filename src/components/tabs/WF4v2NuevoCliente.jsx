import { useState } from 'react'
import { Rocket, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { callWebhook, WebhookError, WEBHOOKS } from '@/lib/webhooks'

export default function WF4v2NuevoCliente({ showToast }) {
  const [nombre,  setNombre]  = useState('')
  const [codigo,  setCodigo]  = useState('')
  const [rubro,   setRubro]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)

  const cod = codigo.trim().toUpperCase()
  const nom = nombre.trim()
  const rub = rubro.trim()

  // HU-001: validación de cliente más estricta que el v1.
  const codigoCorto = cod.length > 0 && cod.length < 2
  const formValido  = nom && cod.length >= 2 && rub

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formValido) return
    setLoading(true)
    setResult(null)
    try {
      // Backward-compat: el WF4 actual parsea el string `text`.
      // Los campos estructurados quedan listos para el futuro WF4 v2.
      const res = await callWebhook(WEBHOOKS.wf4v2, {
        text:    `Nuevo cliente: ${nom} / ${cod} / ${rub}`,
        chat_id: 'web',
        nombre:  nom,
        codigo:  cod,
        rubro:   rub,
        version: 'v2',
      })
      setResult({ folder: `(${cod}) ${nom}`, message: res.message })
      showToast(res.message ?? `${nom} dado de alta correctamente`, 'success')
      setNombre(''); setCodigo(''); setRubro('')
    } catch (err) {
      showToast(err instanceof WebhookError ? err.message : 'No se pudo conectar con n8n.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const preview = nom && cod && rub
    ? `(${cod}) ${nom}`
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-7 animate-fade-in">

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 flex items-center gap-2">
        <Rocket className="w-3.5 h-3.5 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          Alta <span className="font-semibold text-primary">v2</span> — payload estructurado y validación reforzada.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Nombre */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="wf4v2-nombre">Nombre del cliente</Label>
          <Input
            id="wf4v2-nombre"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Nike"
            required
          />
        </div>

        {/* Código */}
        <div className="space-y-1.5">
          <Label htmlFor="wf4v2-codigo">Código</Label>
          <Input
            id="wf4v2-codigo"
            value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="Ej: NK"
            maxLength={10}
            required
          />
          <p className={`text-xs ${codigoCorto ? 'text-destructive' : 'text-muted-foreground'}`}>
            {codigoCorto
              ? 'El código necesita al menos 2 caracteres.'
              : 'Solo letras y números. Se usa en el nombre de carpeta.'}
          </p>
        </div>

        {/* Rubro */}
        <div className="space-y-1.5">
          <Label htmlFor="wf4v2-rubro">Rubro</Label>
          <Input
            id="wf4v2-rubro"
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
        disabled={loading || !formValido}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Dando de alta...</>
          : <><Rocket className="w-4 h-4" /> Dar de Alta (v2)</>
        }
      </Button>

      {/* Resultado */}
      {result && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-start gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-500">Alta enviada</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {result.message ?? <>Se disparó la estructura para <span className="font-mono">{result.folder}</span>.</>}
            </p>
          </div>
        </div>
      )}
    </form>
  )
}
