import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PageHeader from '../components/PageHeader'
import FilterBar, { FilterGroup } from '../components/FilterBar'
import LoadingSpinner, { ErrorMessage } from '../components/LoadingSpinner'
import { useSubmissions } from '../hooks/useSubmissions'
import { useBitrixUsers } from '../hooks/useBitrixUsers'
import { MONTHS, TEAMS, getYearRange } from '../lib/utils'

const TEAM_COLORS = { EA: '#6366f1', Lemon: '#f59e0b', Racquel: '#10b981', Rox: '#f43f5e', Unassigned: '#9ca3af' }

export default function MonthlyTeamSummary() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))

  const { userMap } = useBitrixUsers()
  const { data: rawData, loading, error } = useSubmissions({ year: Number(year) })

  // Compute duplicates based on: same partner + listing link appearing multiple times with Source Type = "New"
  const data = useMemo(() => {
    const enriched = rawData.map(r => {
      const u = userMap[r.sourcer_email || '']
      return { ...r, sourcer_name: u ? u.fullName : r.user_email, team_name: u ? u.teamName : 'Unassigned' }
    })

    const newSourceGroups = {}
    enriched.forEach(r => {
      const sourceType = (r.source_type || '').trim().toLowerCase()
      if (sourceType === 'new') {
        const key = `${r.partner_name || ''}|${r.listing_link || ''}`
        if (!newSourceGroups[key]) newSourceGroups[key] = []
        newSourceGroups[key].push(r)
      }
    })

    const duplicateKeys = new Set(
      Object.entries(newSourceGroups)
        .filter(([_, items]) => items.length > 1)
        .map(([key, _]) => key)
    )

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

  const unique = useMemo(() => data.filter(r => r.is_duplicate === 'Unique'), [data])

  const monthlyTotals = useMemo(() => {
    const map = {}
    MONTHS.forEach(m => { map[m] = 0 })
    unique.forEach(r => { if (r.month) map[r.month] = (map[r.month] || 0) + 1 })
    return map
  }, [unique])

  const teamMonthlyData = useMemo(() => {
    const map = {}
    MONTHS.forEach(m => {
      map[m] = {}
      TEAMS.forEach(t => { map[m][t] = 0 })
    })
    unique.forEach(r => {
      if (r.month && r.team_name) {
        map[r.month][r.team_name] = (map[r.month][r.team_name] || 0) + 1
      }
    })
    return map
  }, [unique])

  const chartData = useMemo(() =>
    MONTHS.map(m => ({
      name: m.slice(0, 3),
      ...TEAMS.reduce((acc, t) => ({ ...acc, [t]: teamMonthlyData[m]?.[t] || 0 }), {}),
      Total: monthlyTotals[m] || 0,
    })),
    [teamMonthlyData, monthlyTotals]
  )

  const grandTotal = useMemo(() => Object.values(monthlyTotals).reduce((s, v) => s + v, 0), [monthlyTotals])

  const years = getYearRange()

  return (
    <div className="pb-10">
      <PageHeader
        title="Monthly Team Summary"
        subtitle="Monthly deal sourcing count broken down by team"
      />
      <FilterBar>
        <FilterGroup label="Report Year">
          <select className="select-field" value={year} onChange={e => setYear(e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </FilterGroup>
      </FilterBar>

      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <div className="px-6 space-y-6">

          {/* Stacked bar chart */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Deals by Team — {year}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 0, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {TEAMS.map(t => (
                  <Bar key={t} dataKey={t} stackId="a" fill={TEAM_COLORS[t]} radius={t === TEAMS[TEAMS.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Data table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Month</th>
                  {TEAMS.map(t => (
                    <th key={t} className="table-th text-right" style={{ color: TEAM_COLORS[t] }}>{t}</th>
                  ))}
                  <th className="table-th text-right bg-indigo-50 text-indigo-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map(m => (
                  <tr key={m} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{m}</td>
                    {TEAMS.map(t => (
                      <td key={t} className="table-td text-right">
                        {teamMonthlyData[m]?.[t]
                          ? <span className="font-medium">{teamMonthlyData[m][t].toLocaleString()}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className="table-td text-right font-bold text-indigo-700 bg-indigo-50">
                      {monthlyTotals[m] > 0 ? monthlyTotals[m].toLocaleString() : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className="table-td">TOTAL</td>
                  {TEAMS.map(t => {
                    const total = MONTHS.reduce((s, m) => s + (teamMonthlyData[m]?.[t] || 0), 0)
                    return <td key={t} className="table-td text-right">{total.toLocaleString()}</td>
                  })}
                  <td className="table-td text-right text-indigo-700 bg-indigo-100">{grandTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
