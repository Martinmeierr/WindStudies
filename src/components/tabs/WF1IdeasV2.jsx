import { useState, useEffect } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { Button }  from '@/components/ui/button'
import { Label }   from '@/components/ui/label'
import HelpV2      from '@/components/ui/HelpV2'
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

// Duraciones (segundos) — sólo aplican a Reels. Viajan como "Duración: N" en el
// payload; WF1 las parsea (duracion_seg) y bajan al guion/contenido vía la idea.
const DURACIONES = [20, 30, 45, 60]
// Subtipos por pieza (mismas opciones que el import). En el Modo Manual son GLOBALES:
// el valor elegido aplica a TODAS las piezas de ese tipo del lote.
const TIPOS_STORY    = ['informativa', 'encuesta', 'caja_de_pregunta', 'micro_impacto']
const TIPOS_REEL     = ['Talking head', 'UGC / testimonio', 'Tutorial / educativo', 'Trend / audio viral']
const TIPOS_CARRUSEL = ['Educativo / tips', 'Storytelling', 'Antes / después', 'Listicle']
const SLIDES         = [3, 4, 5, 6, 7, 8, 9, 10]

const defaultChecked = { reel: true, post: false, story: false, carrusel: false }
const defaultCounts  = { reel: 1,    post: 1,     story: 1,     carrusel: 1    }

export default function WF1IdeasV2({ showToast }) {
  const [anillo,   setAnillo]   = useState(1)
  const [clienteCodigo, setClienteCodigo] = useState('')
  const [clientes,        setClientes]        = useState([])
  const [clientesLoading, setClientesLoading] = useState(true)
  const [clientesError,   setClientesError]   = useState(false)
  const [contexto, setContexto] = useState('')
  const [checked,  setChecked]  = useState(defaultChecked)
  const [counts,   setCounts]   = useState(defaultCounts)
  const [duracion, setDuracion] = useState(30)
  const [tipoStory,    setTipoStory]    = useState('')
  const [tipoReel,     setTipoReel]     = useState('')
  const [tipoCarrusel, setTipoCarrusel] = useState('')
  const [slides,       setSlides]       = useState('')
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
    // La duración sólo tiene sentido para Reels. WF1 la parsea como "Duración: N".
    if (checked.reel) text += `\nDuración: ${duracion}`
    // Subtipos globales: aplican a todas las piezas de ese tipo.
    if (checked.reel && tipoReel)         text += `\nTipoReel: ${tipoReel}`
    if (checked.story && tipoStory)       text += `\nTipoStory: ${tipoStory}`
    if (checked.carrusel && tipoCarrusel) text += `\nTipoCarrusel: ${tipoCarrusel}`
    if (checked.carrusel && slides)       text += `\nSlides: ${slides}`

    setLoading(true)
    try {
      const res = await callWebhook(WEBHOOKS.wf1v2, { text, chat_id: 'web' })
      showToast(res.message ?? `Ideas generadas para ${clienteSel.nombre} (Anillo ${anillo})`, 'success')
      setClienteCodigo(''); setContexto('')
      setChecked(defaultChecked); setCounts(defaultCounts); setDuracion(30)
      setTipoStory(''); setTipoReel(''); setTipoCarrusel(''); setSlides('')
    } catch (err) {
      showToast(err instanceof WebhookError ? err.message : 'No se pudo conectar con n8n.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectCls = 'w-full rounded-lg border border-input bg-background pl-3 pr-9 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent transition-all'

  return (
    <form onSubmit={handleSubmit} className="space-y-7 animate-fade-in">

      {/* Helper — explica el comportamiento real del módulo v2 (Generador manual) */}
      <HelpV2
        title="Cómo funciona este módulo v2"
        items={[
          <>Usa <span className="font-semibold text-foreground">4 agentes dedicados</span>, uno por tipo de pieza (Reel, Story, Carrusel, Post). Cada uno genera su contenido con su propio criterio.</>,
          <>Ya <span className="font-semibold text-foreground">no</span> se autogeneran 2 Stories por cada Reel/Post: se crea sólo la cantidad que pidas de cada tipo.</>,
          <>Escribe <span className="font-semibold text-foreground">directo en la tabla Contenido</span> (estado Borrador). No pasa por la tabla de Ideas ni por la aprobación: el contenido queda listo para producción.</>,
          <>Si la pieza es un Reel, además genera su <span className="font-semibold text-foreground">Guion</span> automáticamente (tabla Guiones, Borrador / No grabado).</>,
        ]}
      />

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
            'w-full rounded-lg border border-input bg-background pl-3 pr-9 py-2 text-sm',
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
        <p className="text-xs text-muted-foreground">
          v2: cada tipo lo genera un agente dedicado. Las Stories ya no se autogeneran por Reel/Post; se crea sólo lo que pidas. Cada Reel genera además su guion.
        </p>
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

      {/* Duración del Reel — sólo aparece si hay Reels seleccionados */}
      {checked.reel && (
        <div className="space-y-3 animate-fade-in">
          <Label>
            Duración de los Reels{' '}
            <span className="normal-case font-normal text-muted-foreground/60">(segundos)</span>
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {DURACIONES.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDuracion(d)}
                className={cn(
                  'flex items-center justify-center rounded-xl border py-3 text-sm font-bold transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  duracion === d
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                {d}s
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Se respeta en la idea, el <span className="font-semibold text-foreground">guion</span> y el contenido del Reel.
          </p>
        </div>
      )}

      {/* Tipo de Reel — global, aplica a todos los Reels */}
      {checked.reel && (
        <div className="space-y-1.5 animate-fade-in">
          <Label>Tipo de Reel <span className="normal-case font-normal text-muted-foreground/60">(aplica a todos los Reels)</span></Label>
          <select value={tipoReel} onChange={e => setTipoReel(e.target.value)} className={selectCls}>
            <option value="">Sin especificar (el agente elige)</option>
            {TIPOS_REEL.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      {/* Tipo de Story — global, aplica a todas las Stories */}
      {checked.story && (
        <div className="space-y-1.5 animate-fade-in">
          <Label>Tipo de Story <span className="normal-case font-normal text-muted-foreground/60">(aplica a todas las Stories)</span></Label>
          <select value={tipoStory} onChange={e => setTipoStory(e.target.value)} className={selectCls}>
            <option value="">Sin especificar (el agente elige)</option>
            {TIPOS_STORY.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      )}

      {/* Tipo de Carrusel + Cantidad de Slides — globales, aplican a todos los Carruseles */}
      {checked.carrusel && (
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <div className="space-y-1.5">
            <Label>Tipo de Carrusel <span className="normal-case font-normal text-muted-foreground/60">(todos)</span></Label>
            <select value={tipoCarrusel} onChange={e => setTipoCarrusel(e.target.value)} className={selectCls}>
              <option value="">Sin especificar</option>
              {TIPOS_CARRUSEL.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Cantidad de Slides <span className="normal-case font-normal text-muted-foreground/60">(todos)</span></Label>
            <select value={slides} onChange={e => setSlides(e.target.value)} className={selectCls}>
              <option value="">Sin especificar</option>
              {SLIDES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full gap-2" disabled={loading || !clienteCodigo}>
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
          : <><Sparkles className="w-4 h-4" /> Generar Ideas</>
        }
      </Button>
    </form>
  )
}
