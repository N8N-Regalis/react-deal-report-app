export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

export function ErrorMessage({ message }) {
  return (
    <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-sm text-red-700 font-medium">Error loading data</p>
      <p className="text-xs text-red-500 mt-1">{message}</p>
    </div>
  )
}
