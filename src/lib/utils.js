import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export const QUARTERS = ['Q1','Q2','Q3','Q4']

export const TEAMS = ['EA','Lemon','Racquel','Rox']

export const STATUS_COLORS = {
  'Inquired':             'bg-blue-100 text-blue-800',
  'NDA Signed':           'bg-green-100 text-green-800',
  'Axed':                 'bg-red-100 text-red-800',
  'Pending NDA':          'bg-yellow-100 text-yellow-800',
  'Follow up':            'bg-purple-100 text-purple-800',
  'For Broker Intro Call':'bg-orange-100 text-orange-800',
  'Added in Bitrix':      'bg-teal-100 text-teal-800',
  'CIM Received':         'bg-indigo-100 text-indigo-800',
  'Resourced':            'bg-pink-100 text-pink-800',
}

export function getStatusColor(status) {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getDaysInMonth(year, month) {
  // month is 1-indexed
  return new Date(year, month, 0).getDate()
}

export function getAllDatesInMonth(year, month) {
  const days = getDaysInMonth(year, month)
  const dates = []
  for (let d = 1; d <= days; d++) {
    dates.push(new Date(year, month - 1, d))
  }
  return dates
}

export function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
}

export function getDayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

export function getMonthNum(monthName) {
  return MONTHS.indexOf(monthName) + 1
}

export function getYearRange() {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = 2024; y <= currentYear + 1; y++) {
    years.push(y)
  }
  return years
}

export function getWeeksInMonth(year, month) {
  const dates = getAllDatesInMonth(year, month)
  const weekMap = {}
  dates.forEach(d => {
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const key = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    if (!weekMap[key]) weekMap[key] = { start: monday, end: sunday, label: key }
  })
  return Object.values(weekMap)
}
