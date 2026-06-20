// Genera la plantilla del import a partir del template REAL, dejando UN bloque
// limpio de listas desplegables (data validation) en Duración, Tipo de pieza,
// Tipo de Story y Anillo — compatible con Excel Y Google Sheets.
//
// Por qué manipulación directa de XML (JSZip) y no ExcelJS: ExcelJS round-trip-ea
// el bloque <dataValidations> original del XML sin exponerlo en su modelo, así que
// no se puede limpiar desde su API y quedaban validaciones DUPLICADAS/solapadas
// (D10:D105 + D6:D105) que rompen los desplegables en Google Sheets.
//
// Fuente pristina: ~/Downloads/sheets-simple-template.xlsx → salida: src/assets/plantilla-plan-windstudies.xlsx
// Correr con: node scripts/gen-plantilla.mjs  (o npm run gen:plantilla)
import JSZip from 'jszip'
import { readFileSync, writeFileSync } from 'fs'

const SRC = '/Users/martin/Downloads/sheets-simple-template.xlsx'
const OUT = new URL('../src/assets/plantilla-plan-windstudies.xlsx', import.meta.url).pathname

// Columna → lista permitida (mismas opciones que el Módulo Generador de Ideas).
// D=Tipo de pieza · E=Duración · F=Tipo de Story · G=Anillo · J=Cantidad de Slides (Carrusel) · filas 6 a 105.
const LISTAS = [
  { col: 'D', vals: 'Reel,Post,Story,Carrusel' },
  { col: 'E', vals: '20,30,45,60' },
  { col: 'F', vals: 'informativa,encuesta,caja_de_pregunta,micro_impacto' },
  { col: 'G', vals: '1,2,3,4,5' },
  { col: 'J', vals: '3,4,5,6,7,8,9,10' },
  { col: 'K', vals: 'Talking head,UGC / testimonio,Tutorial / educativo,Trend / audio viral' },
  { col: 'L', vals: 'Educativo / tips,Storytelling,Antes / después,Listicle' },
]
const FILA_INI = 6
const FILA_FIN = 105

const dvInner = LISTAS.map(({ col, vals }) =>
  `<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="${col}${FILA_INI}:${col}${FILA_FIN}">` +
  `<formula1>&quot;${vals}&quot;</formula1></dataValidation>`
).join('')
const BLOQUE = `<dataValidations count="${LISTAS.length}">${dvInner}</dataValidations>`

const zip = await JSZip.loadAsync(readFileSync(SRC))
const hojas = Object.keys(zip.files).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))

for (const nombre of hojas) {
  let xml = await zip.file(nombre).async('string')
  if (/<dataValidations[\s\S]*?<\/dataValidations>/.test(xml)) {
    // Reemplazamos el bloque existente (mantiene la posición correcta en el schema).
    xml = xml.replace(/<dataValidations[\s\S]*?<\/dataValidations>/, BLOQUE)
  } else if (xml.includes('<pageMargins')) {
    xml = xml.replace('<pageMargins', BLOQUE + '<pageMargins')
  } else {
    xml = xml.replace('</sheetData>', '</sheetData>' + BLOQUE)
  }

  // Columnas nuevas (J/K/L): headers en la fila 5 como inline string (evita tocar
  // sharedStrings). Las validaciones J/K/L ya van en el BLOQUE de arriba.
  const headersNuevos = [
    ['J5', 'Cantidad de Slides'],
    ['K5', 'Tipo de Reel'],
    ['L5', 'Tipo de Carrusel'],
  ]
  for (const [ref, label] of headersNuevos) {
    if (!xml.includes(`r="${ref}"`)) {
      xml = xml.replace(/(<row r="5"[\s\S]*?)<\/row>/, `$1<c r="${ref}" s="7" t="inlineStr"><is><t>${label}</t></is></c></row>`)
    }
  }

  zip.file(nombre, xml)
}

const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
writeFileSync(OUT, buf)
console.log(`Plantilla generada (${hojas.length} hojas, validaciones limpias) → ${OUT}`)
