import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Download, FileSpreadsheet, AlertTriangle, Loader2, RefreshCw, Sparkles, X } from 'lucide-react'
import plantillaUrl from '@/assets/plantilla-plan-windstudies.xlsx?url'
import { Button } from '@/components/ui/button'
import { Label }  from '@/components/ui/label'
import { cn }     from '@/lib/utils'
import { callWebhook, WebhookError, WEBHOOKS } from '@/lib/webhooks'

// ── Dominio (mismas opciones que el Módulo Generador de Ideas) ──────────────
const TIPOS_PIEZA = ['Reel', 'Post', 'Story', 'Carrusel']
const TIPOS_STORY = ['informativa', 'encuesta', 'caja_de_pregunta', 'micro_impacto']
const DURACIONES  = [20, 30, 45, 60]            // sólo Reels (escala nueva)
const SLIDES      = [3, 4, 5, 6, 7, 8, 9, 10]   // sólo Carrusel
const TIPOS_REEL     = ['Talking head', 'UGC / testimonio', 'Tutorial / educativo', 'Trend / audio viral'] // sólo Reel
const TIPOS_CARRUSEL = ['Educativo / tips', 'Storytelling', 'Antes / después', 'Listicle']                 // sólo Carrusel
const ANILLOS     = [
  { n: 1, label: 'Emoción' }, { n: 2, label: 'Confianza' }, { n: 3, label: 'Educación' },
  { n: 4, label: 'Objeciones' }, { n: 5, label: 'Cierre' },
]
// PARA AD: 3 estados. '' / no = orgánico · C1/C2/C3 = set 3:2:2 · tofu/retargeting/bofu = funnel.
const PARA_AD_PAUTA = ['C1', 'C2', 'C3', 'tofu', 'retargeting', 'bofu']

// Headers que buscamos en la hoja (la fila de encabezados puede no ser la primera).
const H = {
  tipo_pieza:    'TIPO DE PIEZA',
  duracion:      'DURACIÓN',
  tipo_story:    'TIPO DE STORY',
  anillo:        'ANILLO',
  para_ad:       'PARA AD',
  slides:        'Cantidad de Slides',
  tipo_reel:     'Tipo de Reel',
  tipo_carrusel: 'Tipo de Carrusel',
  observaciones: 'OBSERVACIONES ESTRATÉGICAS',
}

// Normaliza un header/valor para matchear sin importar acentos, mayúsculas ni espacios.
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')

// Canoniza el valor de Tipo de Story ("caja de pregunta" → "caja_de_pregunta").
const canonStory = v => norm(v) ? String(v).trim().toLowerCase().replace(/\s+/g, '_').replace('caja_pregunta', 'caja_de_pregunta') : ''

// Valida una fila. Devuelve { errores[], avisos[] }. Error bloquea; aviso no.
function validar(f) {
  const errores = [], avisos = []
  const pieza  = norm(f.tipo_pieza)
  const anillo = parseInt(f.anillo, 10)
  const esPauta = PARA_AD_PAUTA.map(norm).includes(norm(f.para_ad))

  if (!pieza)                                       errores.push('Falta Tipo de pieza')
  else if (!TIPOS_PIEZA.map(norm).includes(pieza))  errores.push(`Tipo de pieza inválido: "${f.tipo_pieza}"`)

  if (!f.anillo)                                    errores.push('Falta Anillo')
  else if (!ANILLOS.some(a => a.n === anillo))      errores.push(`Anillo inválido: "${f.anillo}" (1 a 5)`)

  // REGLA DURA: pauta ⟹ Anillo 1, 2 o 3.
  if (esPauta && (anillo === 4 || anillo === 5))
    errores.push(`Para Ad "${f.para_ad}" es pauta, pero el Anillo es ${anillo} — la pauta sólo va en Anillos 1, 2 o 3`)

  if (f.para_ad && norm(f.para_ad) !== 'no' && !esPauta)
    avisos.push(`Para Ad "${f.para_ad}" no es un valor conocido (vacío/no, C1/C2/C3, tofu/retargeting/bofu)`)

  if (f.tipo_story && pieza !== 'story')
    errores.push(`Tipo de Story "${f.tipo_story}" pero la pieza no es Story`)
  if (f.tipo_story && !TIPOS_STORY.includes(f.tipo_story))
    errores.push(`Tipo de Story inválido: "${f.tipo_story}"`)
  if (pieza === 'story' && !f.tipo_story)
    avisos.push('Story sin Tipo de Story — el agente la tratará como informativa')

  if (f.duracion && pieza !== 'reel')
    avisos.push(`Duración "${f.duracion}" se ignora (sólo aplica a Reels)`)
  if (pieza === 'reel' && f.duracion && !DURACIONES.includes(parseInt(f.duracion, 10)))
    avisos.push(`Duración "${f.duracion}" fuera de 20/30/45/60`)

  // Cantidad de Slides sólo aplica a Carrusel.
  if (f.slides && pieza !== 'carrusel')
    avisos.push(`Cantidad de Slides "${f.slides}" se ignora (sólo aplica a Carrusel)`)
  if (pieza === 'carrusel' && f.slides && !SLIDES.includes(parseInt(f.slides, 10)))
    avisos.push(`Cantidad de Slides "${f.slides}" fuera de 3-10`)
  if (pieza === 'carrusel' && !f.slides)
    avisos.push('Carrusel sin cantidad de slides — el agente la elige')

  // Tipo de Reel sólo aplica a Reel; Tipo de Carrusel sólo a Carrusel.
  if (f.tipo_reel && pieza !== 'reel')
    avisos.push(`Tipo de Reel "${f.tipo_reel}" se ignora (sólo aplica a Reel)`)
  if (f.tipo_reel && !TIPOS_REEL.map(norm).includes(norm(f.tipo_reel)))
    avisos.push(`Tipo de Reel "${f.tipo_reel}" no es un valor conocido`)
  if (f.tipo_carrusel && pieza !== 'carrusel')
    avisos.push(`Tipo de Carrusel "${f.tipo_carrusel}" se ignora (sólo aplica a Carrusel)`)
  if (f.tipo_carrusel && !TIPOS_CARRUSEL.map(norm).includes(norm(f.tipo_carrusel)))
    avisos.push(`Tipo de Carrusel "${f.tipo_carrusel}" no es un valor conocido`)

  return { errores, avisos }
}

export default function ImportarPlan({ showToast }) {
  const [clientes,        setClientes]        = useState([])
  const [clientesLoading, setClientesLoading] = useState(true)
  const [clientesError,   setClientesError]   = useState(false)
  const [clienteCodigo,   setClienteCodigo]   = useState('')
  const [filas,    setFilas]    = useState([])     // [{...campos, hoja, _val}]
  const [fileName, setFileName] = useState('')
  const [loading,  setLoading]  = useState(false)
  const fileRef = useRef(null)

  const clienteSel = clientes.find(c => c.codigo === clienteCodigo)
  const totalErrores = filas.reduce((a, f) => a + f._val.errores.length, 0)
  const totalAvisos  = filas.reduce((a, f) => a + f._val.avisos.length, 0)
  const puedeImportar = clienteSel && filas.length > 0 && totalErrores === 0

  async function cargarClientes() {
    setClientesLoading(true); setClientesError(false)
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

  // Descarga la plantilla real (bundleada tal cual). Idéntica a la del planificador.
  function descargarPlantilla() {
    const a = document.createElement('a')
    a.href = plantillaUrl
    a.download = 'plantilla-plan-windstudies.xlsx'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const wb = XLSX.read(await file.arrayBuffer())
      // Leemos TODAS las hojas. En cada una buscamos la fila de headers (la real tiene
      // preámbulo arriba), y de ahí para abajo leemos las piezas.
      const parsed = wb.SheetNames.flatMap(hoja => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[hoja], { header: 1, defval: '' })
        const headerIdx = rows.findIndex(r =>
          Array.isArray(r) && r.map(norm).includes(norm(H.tipo_pieza)) && r.map(norm).includes(norm(H.anillo))
        )
        if (headerIdx === -1) return []
        const headers = rows[headerIdx].map(norm)
        const col = key => headers.indexOf(norm(H[key]))
        const idx = Object.fromEntries(Object.keys(H).map(k => [k, col(k)]))
        const at = (row, i) => (i >= 0 && row[i] != null ? String(row[i]).trim() : '')
        return rows.slice(headerIdx + 1)
          .map(row => ({
            tipo_pieza:    at(row, idx.tipo_pieza),
            duracion:      at(row, idx.duracion),
            tipo_story:    canonStory(at(row, idx.tipo_story)),
            anillo:        at(row, idx.anillo),
            para_ad:       at(row, idx.para_ad),
            slides:        at(row, idx.slides),
            tipo_reel:     at(row, idx.tipo_reel),
            tipo_carrusel: at(row, idx.tipo_carrusel),
            observaciones: at(row, idx.observaciones),
          }))
          .filter(f => f.tipo_pieza || f.anillo)   // descartamos preámbulo/filas vacías
          .map(f => ({ ...f, hoja, _val: validar(f) }))
      })
      if (parsed.length === 0) {
        showToast?.('No encontré filas con piezas. ¿El archivo tiene las columnas de la plantilla?', 'error')
        return
      }
      setFilas(parsed)
      setFileName(file.name)
    } catch {
      showToast?.('No se pudo leer el archivo. ¿Es un .xlsx válido?', 'error')
    } finally {
      if (fileRef.current) fileRef.current.value = ''   // permite re-subir el mismo archivo
    }
  }

  function limpiar() { setFilas([]); setFileName('') }

  // Edición inline: cambia un campo de una fila y re-valida esa fila.
  function updateFila(i, field, value) {
    setFilas(prev => prev.map((f, j) => {
      if (j !== i) return f
      const upd = { ...f, [field]: value }
      return { ...upd, _val: validar(upd) }
    }))
  }

  async function handleSubmit() {
    if (!puedeImportar) return
    const payload = {
      cliente: `${clienteSel.codigo} ${clienteSel.nombre}`,
      filas: filas.map(f => ({
        hoja:          f.hoja,
        tipo_pieza:    f.tipo_pieza,
        duracion:      f.duracion,
        tipo_story:    f.tipo_story,
        anillo:        f.anillo,
        para_ad:       f.para_ad,
        slides:        f.slides,
        tipo_reel:     f.tipo_reel,
        tipo_carrusel: f.tipo_carrusel,
        observaciones: f.observaciones,
      })),
    }
    setLoading(true)
    try {
      const res = await callWebhook(WEBHOOKS.import, payload)
      showToast(res.message ?? `${filas.length} ideas generadas en Notion en estado Borrador`, 'success')
      limpiar(); setClienteCodigo('')
    } catch (err) {
      showToast(err instanceof WebhookError ? err.message : 'No se pudo conectar con n8n.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // clases compartidas de los <select> del preview
  const selCls = 'w-full rounded border border-input bg-background pl-1.5 pr-6 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40'

  return (
    <div className="space-y-7 animate-fade-in">

      {/* Descargar plantilla — arriba a la derecha */}
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={descargarPlantilla}>
          <Download className="w-4 h-4" /> Descargar plantilla
        </Button>
      </div>

      {/* Cliente */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="imp-cliente">Cliente</Label>
          <button
            type="button" onClick={cargarClientes} disabled={clientesLoading}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={cn('w-3 h-3', clientesLoading && 'animate-spin')} /> Actualizar
          </button>
        </div>
        <select
          id="imp-cliente" value={clienteCodigo} onChange={e => setClienteCodigo(e.target.value)}
          required disabled={clientesLoading || clientesError}
          className={cn(
            'w-full rounded-lg border border-input bg-background pl-3 pr-9 py-2 text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
            'transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
          )}
        >
          <option value="" disabled>
            {clientesLoading ? 'Cargando clientes...' : clientesError ? 'Error al cargar — tocá Actualizar' : 'Seleccioná un cliente'}
          </option>
          {clientes.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre} ({c.codigo})</option>)}
        </select>
      </div>

      {/* Importador */}
      <div className="space-y-3">
        <Label>Plan mensual (XLSX)</Label>
        <Button type="button" variant="outline" className="gap-2 w-full" onClick={() => fileRef.current?.click()}>
          <Upload className="w-4 h-4" /> Subir archivo
        </Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.numbers" onChange={handleFile} className="hidden" />
        <p className="text-xs text-muted-foreground">
          Una fila por pieza. Lee todas las hojas del archivo. Podés corregir cada fila con los
          selectores antes de generar.
        </p>
      </div>

      {/* Preview — editable */}
      {filas.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">{fileName}</span>
              <span className="text-muted-foreground">· {filas.length} pieza(s)</span>
            </div>
            <button onClick={limpiar} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3 h-3" /> Quitar
            </button>
          </div>

          {totalErrores > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <span className="text-destructive">{totalErrores} error(es) — corregilos con los selectores. No se puede importar con errores.</span>
            </div>
          )}
          {totalErrores === 0 && totalAvisos > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
              <span className="text-yellow-700 dark:text-yellow-500">{totalAvisos} aviso(s) — se puede importar igual.</span>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  {['Hoja', 'Tipo de pieza', 'Duración', 'Tipo de Story', 'Slides', 'Tipo de Reel', 'Tipo de Carrusel', 'Anillo', 'Para Ad', 'Observaciones', 'Estado'].map(h => (
                    <th key={h} className="px-2 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => {
                  const err = f._val.errores.length > 0
                  const avi = !err && f._val.avisos.length > 0
                  const esReel     = norm(f.tipo_pieza) === 'reel'
                  const esStory    = norm(f.tipo_pieza) === 'story'
                  const esCarrusel = norm(f.tipo_pieza) === 'carrusel'
                  return (
                    <tr key={i} className={cn('border-t border-border', err && 'bg-destructive/5', avi && 'bg-yellow-500/5')}>
                      <td className="px-2 py-1 whitespace-nowrap text-muted-foreground">{f.hoja}</td>

                      {/* Tipo de pieza */}
                      <td className="px-2 py-1 min-w-[110px]">
                        <select className={selCls} value={TIPOS_PIEZA.find(t => norm(t) === norm(f.tipo_pieza)) || ''} onChange={e => updateFila(i, 'tipo_pieza', e.target.value)}>
                          <option value="">—</option>
                          {TIPOS_PIEZA.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>

                      {/* Duración (sólo Reel) */}
                      <td className="px-2 py-1 min-w-[80px]">
                        <select className={selCls} disabled={!esReel} value={DURACIONES.includes(parseInt(f.duracion, 10)) ? String(parseInt(f.duracion, 10)) : ''} onChange={e => updateFila(i, 'duracion', e.target.value)}>
                          <option value="">—</option>
                          {DURACIONES.map(d => <option key={d} value={d}>{d}s</option>)}
                        </select>
                      </td>

                      {/* Tipo de Story (sólo Story) */}
                      <td className="px-2 py-1 min-w-[140px]">
                        <select className={selCls} disabled={!esStory} value={TIPOS_STORY.includes(f.tipo_story) ? f.tipo_story : ''} onChange={e => updateFila(i, 'tipo_story', e.target.value)}>
                          <option value="">—</option>
                          {TIPOS_STORY.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                        </select>
                      </td>

                      {/* Slides (sólo Carrusel) */}
                      <td className="px-2 py-1 min-w-[70px]">
                        <select className={selCls} disabled={!esCarrusel} value={SLIDES.includes(parseInt(f.slides, 10)) ? String(parseInt(f.slides, 10)) : ''} onChange={e => updateFila(i, 'slides', e.target.value)}>
                          <option value="">—</option>
                          {SLIDES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      {/* Tipo de Reel (sólo Reel) */}
                      <td className="px-2 py-1 min-w-[150px]">
                        <select className={selCls} disabled={!esReel} value={TIPOS_REEL.find(t => norm(t) === norm(f.tipo_reel)) || ''} onChange={e => updateFila(i, 'tipo_reel', e.target.value)}>
                          <option value="">—</option>
                          {TIPOS_REEL.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>

                      {/* Tipo de Carrusel (sólo Carrusel) */}
                      <td className="px-2 py-1 min-w-[150px]">
                        <select className={selCls} disabled={!esCarrusel} value={TIPOS_CARRUSEL.find(t => norm(t) === norm(f.tipo_carrusel)) || ''} onChange={e => updateFila(i, 'tipo_carrusel', e.target.value)}>
                          <option value="">—</option>
                          {TIPOS_CARRUSEL.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>

                      {/* Anillo */}
                      <td className="px-2 py-1 min-w-[120px]">
                        <select className={selCls} value={ANILLOS.some(a => a.n === parseInt(f.anillo, 10)) ? String(parseInt(f.anillo, 10)) : ''} onChange={e => updateFila(i, 'anillo', e.target.value)}>
                          <option value="">—</option>
                          {ANILLOS.map(a => <option key={a.n} value={a.n}>{a.n} · {a.label}</option>)}
                        </select>
                      </td>

                      <td className="px-2 py-1 whitespace-nowrap">{f.para_ad || <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-2 py-1 max-w-[16rem] truncate" title={f.observaciones}>{f.observaciones}</td>
                      <td className="px-2 py-1">
                        {err
                          ? <span className="text-destructive font-medium" title={f._val.errores.join('\n')}>● Error</span>
                          : avi
                            ? <span className="text-yellow-600 font-medium" title={f._val.avisos.join('\n')}>● Aviso</span>
                            : <span className="text-emerald-600 font-medium">● OK</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {(totalErrores > 0 || totalAvisos > 0) && (
            <p className="text-[11px] text-muted-foreground">Pasá el mouse sobre "Error"/"Aviso" para ver el detalle de cada fila.</p>
          )}
        </div>
      )}

      <Button size="lg" className="w-full gap-2" disabled={!puedeImportar || loading} onClick={handleSubmit}>
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando ideas...</>
          : <><Sparkles className="w-4 h-4" /> Importar y generar {filas.length > 0 ? `(${filas.length})` : ''}</>}
      </Button>
    </div>
  )
}
