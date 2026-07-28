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

export const TEAMS = ['EA','Lemon','Racquel','Rox','Moeez','Unassigned']

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
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
  const d = dateOnly ? new Date(dateStr + 'T00:00:00') : new Date(dateStr)
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
    const monthStr = String(month).padStart(2, '0')
    const dayStr = String(d).padStart(2, '0')
    dates.push(`${year}-${monthStr}-${dayStr}`)
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
  const weeks = []
  
  if (dates.length === 0) return weeks
  
  // Find the Monday before or on the first day of the month
  const firstDay = new Date(dates[0] + 'T00:00:00Z')
  const firstDayOfWeek = firstDay.getUTCDay()
  const daysToMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  const firstMonday = new Date(firstDay)
  firstMonday.setUTCDate(firstDay.getUTCDate() - daysToMonday)
  
  // Find the Sunday after or on the last day of the month
  const lastDay = new Date(dates[dates.length - 1] + 'T00:00:00Z')
  const lastDayOfWeek = lastDay.getUTCDay()
  const daysToSunday = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek
  const lastSunday = new Date(lastDay)
  lastSunday.setUTCDate(lastDay.getUTCDate() + daysToSunday)
  
  // Generate Monday-Sunday weeks
  let currentMonday = new Date(firstMonday)
  while (currentMonday <= lastSunday) {
    const currentSunday = new Date(currentMonday)
    currentSunday.setUTCDate(currentMonday.getUTCDate() + 6)
    
    const startStr = `${currentMonday.getUTCFullYear()}-${String(currentMonday.getUTCMonth() + 1).padStart(2, '0')}-${String(currentMonday.getUTCDate()).padStart(2, '0')}`
    const endStr = `${currentSunday.getUTCFullYear()}-${String(currentSunday.getUTCMonth() + 1).padStart(2, '0')}-${String(currentSunday.getUTCDate()).padStart(2, '0')}`
    const key = `${currentMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} - ${currentSunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
    weeks.push({ start: startStr, end: endStr, label: key })
    
    // Move to next Monday
    currentMonday.setUTCDate(currentMonday.getUTCDate() + 7)
  }
  
  return weeks
}
