import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FilterBar, { FilterGroup } from '../components/FilterBar'
import KpiCard from '../components/KpiCard'
import LoadingSpinner, { ErrorMessage } from '../components/LoadingSpinner'
import { useSubmissions, useSubmissionsMeta } from '../hooks/useSubmissions'
import { useBitrixUsers } from '../hooks/useBitrixUsers'
import { MONTHS, QUARTERS, getStatusColor, formatDate, getYearRange } from '../lib/utils'

const TEAM_COLORS = { EA: '#6366f1', Lemon: '#f59e0b', Racquel: '#10b981', Rox: '#f43f5e' }
const QUARTER_MAP = { 1:'Q1',2:'Q1',3:'Q1', 4:'Q2',5:'Q2',6:'Q2', 7:'Q3',8:'Q3',9:'Q3', 10:'Q4',11:'Q4',12:'Q4' }

export default function Dashboard() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))
  const { userMap, loading: usersLoading } = useBitrixUsers()
  const { meta } = useSubmissionsMeta(userMap)
  const { data: rawData, loading: dataLoading, error } = useSubmissions({ year: Number(year) })
  const loading = usersLoading || dataLoading
  // Compute duplicates based on: same partner + listing link appearing multiple times with Source Type = "New"
  const dataWithDuplicates = useMemo(() => {
    // First, enrich with user data
    const enriched = rawData.map(r => {
      const u = userMap[r.sourcer_email || '']
      return { ...r, sourcer_name: u ? u.fullName : r.user_email, team_name: u ? u.teamName : '' }
    })

    // Group by partner + listing link for "New" source types
    const newSourceGroups = {}
    enriched.forEach(r => {
      const sourceType = (r.source_type || '').trim().toLowerCase()
      if (sourceType === 'new') {
        const key = `${r.partner_name || ''}|${r.listing_link || ''}`
        if (!newSourceGroups[key]) newSourceGroups[key] = []
        newSourceGroups[key].push(r)
      }
    })

    // Find keys that have multiple "New" entries (these are duplicates)
    const duplicateKeys = new Set(
      Object.entries(newSourceGroups)
        .filter(([_, items]) => items.length > 1)
        .map(([key, _]) => key)
    )

    // Assign is_duplicate: first occurrence = Unique, rest = Duplicate
    const seenKeys = new Set()
    return enriched.map(r => {
      const sourceType = (r.source_type || '').trim().toLowerCase()
      if (sourceType === 'new') {
        const key = `${r.partner_name || ''}|${r.listing_link || ''}`
        if (duplicateKeys.has(key)) {
          if (seenKeys.has(key)) {
            return { ...r, is_duplicate: 'Duplicate' }
          }
          seenKeys.add(key)
          return { ...r, is_duplicate: 'Unique' }
        }
      }
      return { ...r, is_duplicate: 'Unique' }
    })
  }, [rawData, userMap])

  const data = dataWithDuplicates

  const unique = useMemo(() => data.filter(r => r.is_duplicate === 'Unique'), [data])

  const byQuarter = useMemo(() => {
    const map = {}
    QUARTERS.forEach(q => { map[q] = 0 })
    unique.forEach(r => {
      const q = r.quarter || (r.month_num && QUARTER_MAP[r.month_num])
      if (q) map[q] = (map[q] || 0) + 1
    })
    return QUARTERS.map(q => ({ name: q, count: map[q] || 0 }))
  }, [unique])

  const byMonth = useMemo(() => {
    const map = {}
    MONTHS.forEach(m => { map[m] = 0 })
    unique.forEach(r => {
      const month = r.month || (r.timestamp && MONTHS[new Date(r.timestamp).getMonth()])
      if (month) map[month] = (map[month] || 0) + 1
    })
    return MONTHS.map(m => ({ name: m.slice(0, 3), count: map[m] || 0 }))
  }, [unique])

  const byWeek = useMemo(() => {
    const map = {}
    unique.forEach(r => { if (r.week) map[r.week] = (map[r.week] || 0) + 1 })
    return Object.entries(map).map(([name, count]) => ({ name, count }))
      .sort((a, b) => new Date(a.name.split(' - ')[0]) - new Date(b.name.split(' - ')[0]))
  }, [unique])

  const byTeam = useMemo(() => {
    const map = {}
    unique.forEach(r => {
      const team = r.team_name || (r.sourcer_email && userMap[r.sourcer_email]?.teamName)
      if (team) map[team] = (map[team] || 0) + 1
    })
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [unique])

  const byAssociate = useMemo(() => {
    const map = {}
    unique.forEach(r => { if (r.sourcer_name) map[r.sourcer_name] = (map[r.sourcer_name] || 0) + 1 })
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [unique])

  const bySourceType = useMemo(() => {
    const map = {}
    unique.forEach(r => {
      const st = r.source_type || r.sourceType || r['Source Type']
      if (st) map[st] = (map[st] || 0) + 1
    })
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [unique])

  const byStatus = useMemo(() => {
    const map = {}
    data.forEach(r => { if (r.status) map[r.status] = (map[r.status] || 0) + 1 })
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [data])

  const byPartner = useMemo(() => {
    const map = {}
    unique.forEach(r => {
      if (!r.partner_name) return
      map[r.partner_name] = (map[r.partner_name] || 0) + 1
    })
    return Object.entries(map).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [unique])

  const overdue = useMemo(() => data.filter(r => r.overdue === true || r.overdue === 'TRUE'), [data])

  const duplicateCount = useMemo(() => data.filter(r => r.is_duplicate === 'Duplicate').length, [data])

  const years = getYearRange()

  return (
    <div className="pb-10">
      <PageHeader title="Dashboard" subtitle="Deal sourcing summary and analytics" />

      <FilterBar>
        <FilterGroup label="Year">
          <select className="select-field" value={year} onChange={e => setYear(e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </FilterGroup>
      </FilterBar>

      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <div className="px-6 space-y-6">

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard label="Total Submissions" value={data.length}    color="indigo" icon={FileText}       description="All deal submissions including duplicates" />
            <KpiCard label="Unique Deals"      value={unique.length}  color="blue"   icon={CheckCircle}    description="Unique deal sourced for the Client" />
            <KpiCard label="Duplicates"        value={duplicateCount} color="yellow" icon={XCircle}        description="Duplicate submissions (same client + listing link)" />
            <KpiCard label="NDA Signed"        value={byStatus.find(s => s.name === 'NDA Signed')?.count ?? 0} color="green" icon={CheckCircle} description="Deals where NDA has been signed" />
            <KpiCard label="Axed"              value={byStatus.find(s => s.name === 'Axed')?.count ?? 0}       color="red"   icon={XCircle}     description="Deals that have been rejected/axed" />
            <KpiCard label="Overdue"           value={overdue.length} color="purple" icon={AlertTriangle}  description="Deals past their set due date" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Deals by Month</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byMonth} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Deals by Team</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byTeam} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {byTeam.map(entry => (
                      <Cell key={entry.name} fill={TEAM_COLORS[entry.name] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryTable title="By Quarter" rows={byQuarter} />
            <SummaryTable title="By Source Type" rows={bySourceType} />
            <SummaryTable title="By Status" rows={byStatus} colored />
            <SummaryTable title="By Team" rows={byTeam} />
          </div>

          {/* By Week + By Partner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* By Week */}
          <div className="card lg:col-span-2">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Deals by Week</h3>
            </div>
            <div className="overflow-x-auto overflow-y-auto h-[90vh]">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">Week</th>
                    <th className="table-th text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {byWeek.map(row => (
                    <tr key={row.name} className="hover:bg-gray-50">
                      <td className="table-td">{row.name}</td>
                      <td className="table-td text-right font-medium">{row.count.toLocaleString()}</td>
                    </tr>
                  ))}
                  {byWeek.length === 0 && <tr><td colSpan={2} className="table-td text-center text-gray-400">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* By Partner */}
          <div className="card lg:col-span-1">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">By Client / Partner</h3>
              <span className="text-xs text-gray-400 font-medium">{byPartner.length} clients</span>
            </div>
            <div className="overflow-x-auto overflow-y-auto h-[90vh]">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="table-th w-8">#</th>
                    <th className="table-th">Client Name</th>
                    <th className="table-th text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {byPartner.map((row, i) => {
                    const maxCount = byPartner[0]?.count || 1
                    const barPct = Math.round((row.count / maxCount) * 100)
                    return (
                      <tr key={row.name} className="hover:bg-gray-50 group">
                        <td className="table-td text-gray-400 text-xs w-8">{i + 1}</td>
                        <td className="table-td">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-gray-800">{row.name}</span>
                            <div className="h-1 w-full max-w-xs rounded-full bg-gray-100">
                              <div className="h-1 rounded-full bg-indigo-400 transition-all" style={{ width: `${barPct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="table-td text-right font-semibold text-gray-800">{row.count.toLocaleString()}</td>
                      </tr>
                    )
                  })}
                  {byPartner.length === 0 && (
                    <tr><td colSpan={3} className="table-td text-center text-gray-400">No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          </div>{/* end By Week + By Partner grid */}

          {/* By Associate */}
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">By M&A Associate</h3>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0">
                  <tr>
                    <th className="table-th">Associate</th>
                    <th className="table-th text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {byAssociate.map(row => (
                    <tr key={row.name} className="hover:bg-gray-50">
                      <td className="table-td">{row.name}</td>
                      <td className="table-td text-right font-medium">{row.count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overdue Deals */}
          {overdue.length > 0 && (
            <div className="card border-red-200">
              <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-semibold text-red-700">Overdue Deals ({overdue.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-th">Submission ID</th>
                      <th className="table-th">Partner</th>
                      <th className="table-th">Listing Name</th>
                      <th className="table-th">Source Date</th>
                      <th className="table-th">Sourcer</th>
                      <th className="table-th">Due Date</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">CIM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdue.map(row => (
                      <tr key={row.id} className="hover:bg-red-50">
                        <td className="table-td font-mono text-xs">{row.id}</td>
                        <td className="table-td">{row.partner_name}</td>
                        <td className="table-td max-w-xs truncate">
                          {row.listing_link
                            ? <a href={row.listing_link} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">{row.listing_name}</a>
                            : row.listing_name}
                        </td>
                        <td className="table-td text-gray-500">{formatDate(row.source_date)}</td>
                        <td className="table-td">{row.sourcer_name}</td>
                        <td className="table-td text-red-600 font-medium">{formatDate(row.due_date)}</td>
                        <td className="table-td">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="table-td">{row.cim_received ? '✓' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryTable({ title, rows, colored }) {
  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="overflow-y-auto max-h-64">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.name} className="hover:bg-gray-50">
                <td className="table-td">
                  {colored
                    ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(row.name)}`}>{row.name}</span>
                    : row.name}
                </td>
                <td className="table-td text-right font-medium">{row.count.toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={2} className="table-td text-center text-gray-400">No data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
