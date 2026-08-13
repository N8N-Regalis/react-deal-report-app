function escapeCSVValue(value) {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function withExtension(filename, ext) {
  const base = filename.toLowerCase().endsWith(`.${ext}`) ? filename.slice(0, -(ext.length + 1)) : filename
  const stamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD, so repeat exports don't collide/overwrite
  return `${base}_${stamp}.${ext}`
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Downloads a CSV file built from a header row and an array of value rows.
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 * @param {string} filename
 */
export function exportToCSV(headers, rows, filename) {
  const lines = [headers, ...rows].map(row => row.map(escapeCSVValue).join(','))
  // Leading BOM so Excel opens the UTF-8 file with correct encoding
  const csvContent = '﻿' + lines.join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, withExtension(filename, 'csv'))
}

/**
 * Downloads an .xlsx workbook built from a header row and an array of value rows.
 * The `xlsx` library (~300kB) is only ever needed for this one action, so it's
 * loaded on demand instead of bloating the main app bundle for every user.
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 * @param {string} filename
 * @param {string} [sheetName]
 */
export async function exportToXLSX(headers, rows, filename, sheetName = 'Sheet1') {
  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  // Reasonable column widths based on content length, capped so long URLs don't blow out the sheet
  worksheet['!cols'] = headers.map((header, colIndex) => {
    const maxLen = rows.reduce((max, row) => {
      const cell = row[colIndex]
      const len = cell === null || cell === undefined ? 0 : String(cell).length
      return Math.max(max, len)
    }, header.length)
    return { wch: Math.min(Math.max(maxLen + 2, 8), 60) }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31)) // sheet names capped at 31 chars
  XLSX.writeFile(workbook, withExtension(filename, 'xlsx'))
}
