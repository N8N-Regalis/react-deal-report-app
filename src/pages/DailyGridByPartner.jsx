import { useState, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import FilterBar, { FilterGroup } from '../components/FilterBar'
import LoadingSpinner, { ErrorMessage } from '../components/LoadingSpinner'
import { useSubmissions, useSubmissionsMeta } from '../hooks/useSubmissions'
import { useBitrixUsers } from '../hooks/useBitrixUsers'
import { MONTHS, getAllDatesInMonth, getYearRange, getWeeksInMonth } from '../lib/utils'

export default function DailyGridByPartner() {
  const currentYear  = new Date().getFullYear()
  const currentMonth = MONTHS[new Date().getMonth()]
  const [year,  setYear]  = useState(String(currentYear))
  const [month, setMonth] = useState(currentMonth)
  const [week,       setWeek]       = useState('all')
  const [team,       setTeam]       = useState('all')
  const [associate,  setAssociate]  = useState('all')
  const [partner,    setPartner]    = useState('all')

  const { userMap } = useBitrixUsers()
  const { meta } = useSubmissionsMeta(userMap)
  const filters = useMemo(() => ({ year: Number(year), month }), [year, month])

  const { data: rawData, loading, error } = useSubmissions(filters)

  // Compute duplicates based on: same partner + listing link appearing multiple times with Source Type = "New"
  const data = useMemo(() => {
    let rows = rawData.map(r => {
      const u = userMap[r.sourcer_email || '']
      return { ...r, sourcer_name: u ? u.fullName : r.user_email, team_name: u ? u.teamName : '' }
    })

    const newSourceGroups = {}
    rows.forEach(r => {
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
    rows = rows.map(r => {
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

    if (team !== 'all')      rows = rows.filter(r => r.team_name === team)
    if (associate !== 'all') rows = rows.filter(r => r.sourcer_name === associate)
    if (partner !== 'all')   rows = rows.filter(r => r.partner_name === partner)
    return rows
  }, [rawData, userMap, team, associate, partner])

  const monthNum = MONTHS.indexOf(month) + 1
  const allDates = useMemo(() => getAllDatesInMonth(Number(year), monthNum), [year, monthNum])
  const weeks    = useMemo(() => getWeeksInMonth(Number(year), monthNum), [year, monthNum])

  const filteredDates = useMemo(() => {
    if (week === 'all') return allDates
    const selected = weeks.find(w => w.label === week)
    if (!selected) return allDates
    return allDates.filter(d => d >= selected.start && d <= selected.end)
  }, [allDates, weeks, week])

  const unique = useMemo(() => data.filter(r => r.is_duplicate === 'Unique'), [data])

  const grid = useMemo(() => {
    const partnerMap = {}
    unique.forEach(r => {
      if (!r.partner_name || !r.source_date) return
      const dateKey = r.source_date
      if (!partnerMap[r.partner_name]) partnerMap[r.partner_name] = {}
      partnerMap[r.partner_name][dateKey] = (partnerMap[r.partner_name][dateKey] || 0) + 1
    })
    return Object.entries(partnerMap)
      .map(([partner, days]) => {
        const total = Object.values(days).reduce((s, v) => s + v, 0)
        return { partner, days, total }
      })
      .sort((a, b) => a.partner.localeCompare(b.partner))
  }, [unique])

  const years = getYearRange()
  const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const getDayFromDateStr = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00Z')
    return d.getUTCDay()
  }

  const getDateFromDateStr = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00Z')
    return d.getUTCDate()
  }

  return (
    <div className="pb-10">
      <PageHeader
        title="Daily Grid by Client"
        subtitle="Count of unique sourced deals per client per day"
      />
      <FilterBar>
        <FilterGroup label="Year">
          <select className="select-field" value={year} onChange={e => setYear(e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Month">
          <select className="select-field" value={month} onChange={e => setMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Week (Optional)">
          <select className="select-field" value={week} onChange={e => setWeek(e.target.value)}>
            <option value="all">All Weeks</option>
            {weeks.map(w => <option key={w.label} value={w.label}>{w.label}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Team (Optional)">
          <select className="select-field" value={team} onChange={e => setTeam(e.target.value)}>
            <option value="all">All Teams</option>
            {meta.teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="M&A Associate (Optional)">
          <select className="select-field" value={associate} onChange={e => setAssociate(e.target.value)}>
            <option value="all">All Associates</option>
            {meta.associates.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Client Name (Optional)">
          <select className="select-field" value={partner} onChange={e => setPartner(e.target.value)}>
            <option value="all">All Partners</option>
            {meta.partners.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </FilterGroup>
      </FilterBar>

      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <div className="px-6">
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th sticky left-0 bg-gray-50 z-10 min-w-48">Client Name</th>
                  <th className="table-th text-right bg-indigo-50 text-indigo-700">TOTAL</th>
                  {filteredDates.map(d => (
                    <th key={d} className="table-th text-center min-w-10">
                      <div className="text-gray-400 font-normal">{DAY_LABELS[getDayFromDateStr(d)]}</div>
                      <div>{getDateFromDateStr(d)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map(row => (
                  <tr key={row.partner} className="hover:bg-gray-50">
                    <td className="table-td sticky left-0 bg-white font-medium z-10">{row.partner}</td>
                    <td className="table-td text-right font-bold text-indigo-700 bg-indigo-50">{row.total}</td>
                    {filteredDates.map(d => {
                      const val = row.days[d] || 0
                      return (
                        <td key={d} className={`table-td text-center ${val > 0 ? 'font-medium text-gray-900' : 'text-gray-300'}`}>
                          {val > 0 ? val : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {grid.length === 0 && (
                  <tr>
                    <td colSpan={filteredDates.length + 2} className="table-td text-center text-gray-400 py-8">
                      No data for selected filters
                    </td>
                  </tr>
                )}
                {/* Totals row */}
                {grid.length > 0 && (
                  <tr className="bg-gray-50 font-semibold">
                    <td className="table-td sticky left-0 bg-gray-50 z-10">TOTAL</td>
                    <td className="table-td text-right text-indigo-700 bg-indigo-50">
                      {grid.reduce((s, r) => s + r.total, 0)}
                    </td>
                    {filteredDates.map(d => {
                      const total = grid.reduce((s, r) => s + (r.days[d] || 0), 0)
                      return (
                        <td key={d} className={`table-td text-center ${total > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                          {total > 0 ? total : '—'}
                        </td>
                      )
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
