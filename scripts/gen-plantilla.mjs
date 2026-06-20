// Genera la plantilla del import a partir del template REAL, agregándole
// listas desplegables (data validation) en Duración, Tipo de pieza, Tipo de Story y Anillo.
// Fuente pristina: ~/Downloads/sheets-simple-template.xlsx → salida: src/assets/plantilla-plan-windstudies.xlsx
// Correr con: node scripts/gen-plantilla.mjs
import ExcelJS from 'exceljs'

const SRC = '/Users/martin/Downloads/sheets-simple-template.xlsx'
const OUT = new URL('../src/assets/plantilla-plan-windstudies.xlsx', import.meta.url).pathname

// Columna (1-indexed) → lista permitida. Mismas opciones que el Módulo Generador de Ideas.
// D=Tipo de pieza · E=Duración · F=Tipo de Story · G=Anillo
const LISTAS = {
  4: '"Reel,Post,Story,Carrusel"',
  5: '"20,30,45,60"',
  6: '"informativa,encuesta,caja_de_pregunta,micro_impacto"',
  7: '"1,2,3,4,5"',
}
const FILAS_VALIDADAS = 100   // cuántas filas debajo del header llevan desplegable

const wb = new ExcelJS.Workbook()
await wb.xlsx.readFile(SRC)

for (const ws of wb.worksheets) {
  // Buscar la fila de headers (la que tiene "TIPO DE PIEZA")
  let headerRow = 5
  ws.eachRow((row, rn) => {
    const vals = (row.values || []).map(v => String(v ?? '').toUpperCase())
    if (vals.some(v => v.includes('TIPO DE PIEZA'))) headerRow = rn
  })

  for (let r = headerRow + 1; r <= headerRow + FILAS_VALIDADAS; r++) {
    for (const [col, formula] of Object.entries(LISTAS)) {
      ws.getCell(r, Number(col)).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [formula],
        showErrorMessage: true,
        errorStyle: 'warning',
        errorTitle: 'Valor no válido',
        error: 'Elegí un valor de la lista desplegable.',
      }
    }
  }
}

await wb.xlsx.writeFile(OUT)
console.log('Plantilla generada con desplegables →', OUT)
