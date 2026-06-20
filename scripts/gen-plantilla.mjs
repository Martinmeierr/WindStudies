// Genera la plantilla del import a partir del template REAL, reconstruyendo la
// fila de headers en el orden deseado (los campos de tipo agrupados después de
// TIPO DE STORY), en MAYÚSCULA y con el mismo estilo (s="7"), + listas desplegables
// (data validation) compatibles con Excel y Google Sheets.
//
// Manipulación directa de XML con JSZip (no ExcelJS) porque ExcelJS round-trip-ea
// las validaciones originales y duplica/solapa rangos que rompen Google Sheets.
//
// Fuente pristina: ~/Downloads/sheets-simple-template.xlsx → salida: src/assets/plantilla-plan-windstudies.xlsx
// Correr con: node scripts/gen-plantilla.mjs  (o npm run gen:plantilla)
import JSZip from 'jszip'
import { readFileSync, writeFileSync } from 'fs'

const SRC = '/Users/martin/Downloads/sheets-simple-template.xlsx'
const OUT = new URL('../src/assets/plantilla-plan-windstudies.xlsx', import.meta.url).pathname

// Orden FINAL de columnas (A..L). Los campos de tipo van juntos, después de TIPO DE STORY.
const HEADERS = [
  'DÍA', 'FECHA DE PUBLICACIÓN', 'N°', 'TIPO DE PIEZA', 'DURACIÓN', 'TIPO DE STORY',
  'TIPO DE REEL', 'TIPO DE CARRUSEL', 'CANTIDAD DE SLIDES', 'ANILLO', 'PARA AD', 'OBSERVACIONES ESTRATÉGICAS',
]
const ANCHOS = [10, 16, 5, 13, 11, 17, 17, 17, 13, 8, 10, 36] // ancho por columna (A..L)

// Columna → lista permitida (mismas opciones que el Módulo Generador de Ideas).
const LISTAS = [
  { col: 'D', vals: 'Reel,Post,Story,Carrusel' },                                              // TIPO DE PIEZA
  { col: 'E', vals: '20,30,45,60' },                                                           // DURACIÓN
  { col: 'F', vals: 'informativa,encuesta,caja_de_pregunta,micro_impacto' },                   // TIPO DE STORY
  { col: 'G', vals: 'Talking head,UGC / testimonio,Tutorial / educativo,Trend / audio viral' },// TIPO DE REEL
  { col: 'H', vals: 'Educativo / tips,Storytelling,Antes / después,Listicle' },                 // TIPO DE CARRUSEL
  { col: 'I', vals: '3,4,5,6,7,8,9,10' },                                                       // CANTIDAD DE SLIDES
  { col: 'J', vals: '1,2,3,4,5' },                                                              // ANILLO
]
const FILA_INI = 6
const FILA_FIN = 105

const colLetter = n => String.fromCharCode(64 + n) // 1→A ... 12→L

const dvInner = LISTAS.map(({ col, vals }) =>
  `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${col}${FILA_INI}:${col}${FILA_FIN}">` +
  `<formula1>&quot;${vals}&quot;</formula1></dataValidation>`
).join('')
const BLOQUE = `<dataValidations count="${LISTAS.length}">${dvInner}</dataValidations>`

// Fila de header reconstruida: 12 celdas inline string, mayúscula, estilo s="7".
const headerCells = HEADERS.map((h, i) =>
  `<c r="${colLetter(i + 1)}5" s="7" t="inlineStr"><is><t>${h}</t></is></c>`
).join('')

// <cols> nuevo con los anchos del orden nuevo + default para el resto.
const colsXml = '<cols>' +
  ANCHOS.map((w, i) => `<col customWidth="1" min="${i + 1}" max="${i + 1}" width="${w}.0"/>`).join('') +
  '<col min="13" max="26" width="9.0"/></cols>'

const zip = await JSZip.loadAsync(readFileSync(SRC))
const hojas = Object.keys(zip.files).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))

for (const nombre of hojas) {
  let xml = await zip.file(nombre).async('string')

  // 1) Reescribir la fila de header (5) completa con el orden/mayúsculas nuevos (preservando attrs de la fila).
  xml = xml.replace(/<row r="5"([^>]*)>[\s\S]*?<\/row>/, `<row r="5"$1>${headerCells}</row>`)

  // 2) Anchos de columna para el orden nuevo.
  if (/<cols>[\s\S]*?<\/cols>/.test(xml)) xml = xml.replace(/<cols>[\s\S]*?<\/cols>/, colsXml)

  // 3) Extender los merges del preámbulo a la nueva última columna (L).
  xml = xml.replace('ref="A1:I1"', 'ref="A1:L1"')
           .replace('ref="F2:I2"', 'ref="F2:L2"')
           .replace('ref="A3:I3"', 'ref="A3:L3"')

  // 4) Validaciones (reemplaza el bloque existente, manteniendo posición en el schema).
  if (/<dataValidations[\s\S]*?<\/dataValidations>/.test(xml)) {
    xml = xml.replace(/<dataValidations[\s\S]*?<\/dataValidations>/, BLOQUE)
  } else if (xml.includes('<pageMargins')) {
    xml = xml.replace('<pageMargins', BLOQUE + '<pageMargins')
  } else {
    xml = xml.replace('</sheetData>', '</sheetData>' + BLOQUE)
  }

  zip.file(nombre, xml)
}

const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
writeFileSync(OUT, buf)
console.log(`Plantilla generada (${hojas.length} hojas, headers reordenados en mayúscula + validaciones) → ${OUT}`)
