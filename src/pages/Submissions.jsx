import { useState, useMemo } from 'react'
import { Search, ExternalLink, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FilterBar, { FilterGroup } from '../components/FilterBar'
import LoadingSpinner, { ErrorMessage } from '../components/LoadingSpinner'
import { useSubmissions, useSubmissionsMeta } from '../hooks/useSubmissions'
import { useBitrixUsers } from '../hooks/useBitrixUsers'
import { MONTHS, getStatusColor, formatDate, getYearRange } from '../lib/utils'

const PAGE_SIZE = 50

export default function Submissions() {
  const currentYear  = new Date().getFullYear()
  const [year,       setYear]       = useState(String(currentYear))
  const [month,      setMonth]      = useState('all')
  const [team,       setTeam]       = useState('all')
  const [status,     setStatus]     = useState('all')
  const [duplicate,  setDuplicate]  = useState('all')
  const [search,     setSearch]     = useState('')
  const [page,       setPage]       = useState(1)

  const { userMap } = useBitrixUsers()
  const { meta } = useSubmissionsMeta(userMap)

  const filters = useMemo(() => {
    const f = { year: Number(year) }
    if (month !== 'all') f.month = month
    return f
  }, [year, month])

  const { data: rawData, loading, error } = useSubmissions(filters)

  // Compute duplicates based on: same partner + listing link appearing multiple times with Source Type = "New"
  const data = useMemo(() => {
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
    // Also track the original record ID for duplicates
    const seenKeys = new Map()
    return enriched.map(r => {
      const sourceType = (r.source_type || '').trim().toLowerCase()
      if (sourceType === 'new') {
        const key = `${r.partner_name || ''}|${r.listing_link || ''}`
        if (duplicateKeys.has(key)) {
          if (seenKeys.has(key)) {
            return { ...r, is_duplicate: 'Duplicate', duplicate_of: seenKeys.get(key) }
          }
          seenKeys.set(key, r.id)
          return { ...r, is_duplicate: 'Unique' }
        }
      }
      return { ...r, is_duplicate: 'Unique' }
    })
  }, [rawData, userMap])

  const statuses = useMemo(() => {
    const s = new Set(data.map(r => r.status).filter(Boolean))
    return [...s].sort()
  }, [data])

  const filtered = useMemo(() => {
    let rows = data
    if (team      !== 'all') rows = rows.filter(r => r.team_name === team)
    if (status    !== 'all') rows = rows.filter(r => r.status === status)
    if (duplicate !== 'all') rows = rows.filter(r => r.is_duplicate === duplicate)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        r.listing_name?.toLowerCase().includes(q) ||
        r.partner_name?.toLowerCase().includes(q) ||
        r.sourcer_name?.toLowerCase().includes(q) ||
        r.brokerage?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q)
      )
    }
    return rows
  }, [data, status, duplicate, search])

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page])
  const hasMore   = paginated.length < filtered.length
  const years     = getYearRange()

  return (
    <div className="pb-10">
      <PageHeader
        title="All Submissions"
        subtitle="Full searchable submissions table"
      />

      <FilterBar>
        <FilterGroup label="Year">
          <select className="select-field" value={year} onChange={e => { setYear(e.target.value); setPage(1) }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Month">
          <select className="select-field" value={month} onChange={e => { setMonth(e.target.value); setPage(1) }}>
            <option value="all">All Months</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Team">
          <select className="select-field" value={team} onChange={e => { setTeam(e.target.value); setPage(1) }}>
            <option value="all">All Teams</option>
            {meta.teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Status">
          <select className="select-field" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="Duplicate">
          <select className="select-field" value={duplicate} onChange={e => { setDuplicate(e.target.value); setPage(1) }}>
            <option value="all">All</option>
            <option value="Unique">Unique</option>
            <option value="Duplicate">Duplicate</option>
          </select>
        </FilterGroup>
        <FilterGroup label="Search">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              className="select-field pl-8 pr-8 w-64"
              placeholder="Listing, partner, sourcer…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </FilterGroup>
      </FilterBar>

      <div className="px-6 mb-2 text-xs text-gray-500">
        Showing <strong>{paginated.length.toLocaleString()}</strong> of <strong>{filtered.length.toLocaleString()}</strong> results
      </div>

      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <div className="px-6 space-y-3">
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">ID</th>
                  <th className="table-th">Source Date</th>
                  <th className="table-th">Sourcer</th>
                  <th className="table-th">Team</th>
                  <th className="table-th">Partner</th>
                  <th className="table-th min-w-64">Listing Name</th>
                  <th className="table-th">Brokerage</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">CIM</th>
                  <th className="table-th">Duplicate?</th>
                  <th className="table-th">Duplicate Of</th>
                  <th className="table-th">Due Date</th>
                  <th className="table-th">Week</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono text-xs text-gray-400">{row.id}</td>
                    <td className="table-td whitespace-nowrap text-gray-500">{formatDate(row.source_date)}</td>
                    <td className="table-td whitespace-nowrap">{row.sourcer_name}</td>
                    <td className="table-td">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {row.team_name}
                      </span>
                    </td>
                    <td className="table-td whitespace-nowrap">{row.partner_name}</td>
                    <td className="table-td">
                      {row.listing_link
                        ? (
                          <a href={row.listing_link} target="_blank" rel="noreferrer"
                            className="text-brand-600 hover:underline flex items-start gap-1">
                            <span className="line-clamp-2 max-w-xs">{row.listing_name}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          </a>
                        )
                        : <span className="line-clamp-2 max-w-xs">{row.listing_name}</span>
                      }
                    </td>
                    <td className="table-td text-gray-500">{row.brokerage}</td>
                    <td className="table-td">
                      {row.status && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(row.status)}`}>
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="table-td text-center">{row.cim_received ? '✓' : '—'}</td>
                    <td className="table-td">
                      <span className={`text-xs font-medium ${row.is_duplicate === 'Duplicate' ? 'text-amber-600' : 'text-green-600'}`}>
                        {row.is_duplicate}
                      </span>
                    </td>
                    <td className="table-td font-mono text-xs text-gray-400">
                      {row.duplicate_of || '—'}
                    </td>
                    <td className="table-td whitespace-nowrap text-gray-500">{formatDate(row.due_date)}</td>
                    <td className="table-td text-xs text-gray-400 whitespace-nowrap">{row.week}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={13} className="table-td text-center text-gray-400 py-10">
                      No submissions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button className="btn-outline" onClick={() => setPage(p => p + 1)}>
                Load more ({(filtered.length - paginated.length).toLocaleString()} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
