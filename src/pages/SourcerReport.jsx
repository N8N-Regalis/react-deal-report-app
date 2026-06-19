import { useState, useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FilterBar, { FilterGroup } from '../components/FilterBar'
import LoadingSpinner, { ErrorMessage } from '../components/LoadingSpinner'
import { useSubmissions, useSubmissionsMeta } from '../hooks/useSubmissions'
import { useBitrixUsers } from '../hooks/useBitrixUsers'
import { MONTHS, getStatusColor, formatDate, getYearRange } from '../lib/utils'

const PAGE_SIZE = 50

export default function SourcerReport() {
  const currentYear  = new Date().getFullYear()
  const currentMonth = MONTHS[new Date().getMonth()]
  const today        = new Date().toISOString().split('T')[0]

  const [year,       setYear]       = useState(String(currentYear))
  const [month,      setMonth]      = useState(currentMonth)
  const [team,       setTeam]       = useState('all')
  const [associate,  setAssociate]  = useState('all')
  const [partner,    setPartner]    = useState('all')
  const [shiftDate,  setShiftDate]  = useState("")
  const [page,       setPage]       = useState(1)

  const { userMap, users } = useBitrixUsers()
  const { meta } = useSubmissionsMeta(userMap)

  const filters = useMemo(() => {
    const f = { year: Number(year), month }
    if (partner !== 'all')   f.partnerName  = partner
    if (shiftDate)           f.sourceDate   = shiftDate
    return f
  }, [year, month, partner, shiftDate])

  const { data: rawData, loading, error } = useSubmissions(filters)
  const data = useMemo(() => {
    let rows = rawData.map(r => {
      const u = userMap[r.sourcer_email || '']
      return { ...r, sourcer_name: u ? u.fullName : r.user_email, team_name: u ? u.teamName : '' }
    })
    if (team !== 'all')      rows = rows.filter(r => r.team_name === team)
    if (associate !== 'all') rows = rows.filter(r => r.sourcer_name === associate)
    return rows
  }, [rawData, userMap, team, associate])

  const paginated = useMemo(() => data.slice(0, page * PAGE_SIZE), [data, page])
  const hasMore   = paginated.length < data.length

  const years = getYearRange()

  return (
    <div className="pb-10">
      <PageHeader
        title="Sourcer Report"
        subtitle="Individual sourcer submissions filtered by shift details"
      />

      {/* Header filter section styled like the sheet */}
      <div className="mx-6 mb-4 card p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Year</p>
            <select className="select-field w-full" value={year} onChange={e => { setYear(e.target.value); setPage(1) }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Month</p>
            <select className="select-field w-full" value={month} onChange={e => { setMonth(e.target.value); setPage(1) }}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Team Name</p>
            <select className="select-field w-full" value={team} onChange={e => { setTeam(e.target.value); setPage(1) }}>
              <option value="all">All Teams</option>
              {meta.teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">M&A Associate</p>
            <select className="select-field w-full" value={associate} onChange={e => { setAssociate(e.target.value); setPage(1) }}>
              <option value="all">All Associates</option>
              {meta.associates.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Partner Name</p>
            <select className="select-field w-full" value={partner} onChange={e => { setPartner(e.target.value); setPage(1) }}>
              <option value="all">All Partners</option>
              {meta.partners.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Shift Date</p>
            <input
              type="date"
              className="select-field w-full"
              value={shiftDate}
              onChange={e => { setShiftDate(e.target.value); setPage(1) }}
            />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
          <span>Showing <strong className="text-gray-900">{paginated.length.toLocaleString()}</strong> of <strong className="text-gray-900">{data.length.toLocaleString()}</strong> submissions</span>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <div className="px-6">
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Submission ID</th>
                  <th className="table-th">Source Date</th>
                  <th className="table-th">Sourcer Name</th>
                  <th className="table-th">Partner Name</th>
                  <th className="table-th min-w-64">Listing Name</th>
                  <th className="table-th">Brokerage</th>
                  <th className="table-th">Broker Name</th>
                  <th className="table-th">Broker Email</th>
                  <th className="table-th">Source Type</th>
                  <th className="table-th">CIM</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Due Date</th>
                  <th className="table-th min-w-48">Notes/Details</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono text-xs text-gray-500">{row.id}</td>
                    <td className="table-td whitespace-nowrap">{formatDate(row.source_date)}</td>
                    <td className="table-td whitespace-nowrap">{row.sourcer_name}</td>
                    <td className="table-td whitespace-nowrap">{row.partner_name}</td>
                    <td className="table-td">
                      {row.listing_link
                        ? (
                          <a href={row.listing_link} target="_blank" rel="noreferrer"
                            className="text-brand-600 hover:underline flex items-start gap-1 max-w-xs">
                            <span className="line-clamp-2">{row.listing_name}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          </a>
                        )
                        : <span className="max-w-xs line-clamp-2">{row.listing_name}</span>
                      }
                    </td>
                    <td className="table-td">{row.brokerage}</td>
                    <td className="table-td">{row.broker_name}</td>
                    <td className="table-td text-xs text-gray-500">{row.broker_email}</td>
                    <td className="table-td">{row.source_type}</td>
                    <td className="table-td text-center">{row.cim_received ? '✓' : '—'}</td>
                    <td className="table-td">
                      {row.status && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(row.status)}`}>
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="table-td whitespace-nowrap text-gray-500">{formatDate(row.due_date)}</td>
                    <td className="table-td text-xs text-gray-500 max-w-xs">{row.notes}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={13} className="table-td text-center text-gray-400 py-10">
                      No submissions found for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button className="btn-outline" onClick={() => setPage(p => p + 1)}>
                Load more ({(data.length - paginated.length).toLocaleString()} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
