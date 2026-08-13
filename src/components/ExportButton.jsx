import { useEffect, useRef, useState } from 'react'
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from 'lucide-react'
import { exportToCSV, exportToXLSX } from '../lib/export'

/**
 * Dropdown button offering CSV / Excel export of the given data.
 * `headers` is an array of column labels; `rows` is an array of value arrays
 * in the same column order (already formatted the way they should appear
 * on the sheet).
 */
export default function ExportButton({ headers, rows, filename, sheetName }) {
  const [open, setOpen] = useState(false)
  const [xlsxLoading, setXlsxLoading] = useState(false)
  const containerRef = useRef(null)
  const disabled = !rows || rows.length === 0

  const handleExportXLSX = async () => {
    setXlsxLoading(true)
    try {
      await exportToXLSX(headers, rows, filename, sheetName)
    } finally {
      setXlsxLoading(false)
      setOpen(false)
    }
  }

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        title="Export data"
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => { exportToCSV(headers, rows, filename); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileText className="w-4 h-4 text-gray-400" />
            Export CSV
          </button>
          <button
            onClick={handleExportXLSX}
            disabled={xlsxLoading}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {xlsxLoading
              ? <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
              : <FileSpreadsheet className="w-4 h-4 text-green-600" />}
            Export Excel
          </button>
        </div>
      )}
    </div>
  )
}
