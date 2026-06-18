export default function FilterBar({ children }) {
  return (
    <div className="flex flex-wrap items-end gap-3 px-6 pb-4">
      {children}
    </div>
  )
}

export function FilterGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  )
}
