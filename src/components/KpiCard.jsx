import { useState } from 'react'
import { cn } from '../lib/utils'

export default function KpiCard({ label, value, sub, color = 'indigo', icon: Icon, description }) {
  const [isHovered, setIsHovered] = useState(false)
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    green:  'bg-green-50  text-green-700  border-green-100',
    red:    'bg-red-50    text-red-700    border-red-100',
    blue:   'bg-blue-50   text-blue-700   border-blue-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  }
  return (
    <div 
      className={cn('card p-5 border relative', colors[color])}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
          <p className="text-3xl font-bold mt-1">{value?.toLocaleString() ?? '—'}</p>
          {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center">
            <Icon className="w-5 h-5 opacity-70" />
          </div>
        )}
      </div>
      {description && isHovered && (
        <div className="absolute bottom-full left-0 mb-2 w-full z-10">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
            {description}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  )
}
