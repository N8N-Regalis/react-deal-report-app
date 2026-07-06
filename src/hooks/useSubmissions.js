import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { MONTHS } from '../lib/utils'

const TABLE = 'submissions'

const QUARTER_MAP = { 1:'Q1',2:'Q1',3:'Q1', 4:'Q2',5:'Q2',6:'Q2', 7:'Q3',8:'Q3',9:'Q3', 10:'Q4',11:'Q4',12:'Q4' }

function getWeekLabel(utcDateStr) {
  const d = new Date(utcDateStr + 'T00:00:00Z')
  const day = d.getUTCDay()
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7))
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  const fmt = (dt) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `${fmt(monday)} - ${fmt(sunday)}`
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export function enrichRowWithDates(row) {
  if (!row.timestamp) return row
  const d = new Date(row.timestamp)
  const utcDateStr  = d.toISOString().split('T')[0]
  const utcYear     = parseInt(utcDateStr.split('-')[0])
  const utcMonthNum = parseInt(utcDateStr.split('-')[1])
  return {
    ...row,
    source_date:   utcDateStr,
    year:          utcYear,
    month:         MONTHS[utcMonthNum - 1],
    month_num:     utcMonthNum,
    quarter:       QUARTER_MAP[utcMonthNum],
    week:          getWeekLabel(utcDateStr),
    day:           DAY_NAMES[d.getDay()],
    sourcer_email: (row.user_email || '').toLowerCase().trim(),
  }
}

let _allCache = null
let _allCachePromise = null

async function fetchAllRows() {
  if (_allCache) return _allCache
  if (_allCachePromise) return _allCachePromise

  _allCachePromise = (async () => {
    const PAGE = 1000
    let from = 0
    const all = []
    while (true) {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('timestamp', { ascending: false })
        .range(from, from + PAGE - 1)
      if (error) throw error
      all.push(...(data || []))
      if (!data || data.length < PAGE) break
      from += PAGE
    }
    _allCache = all.map(enrichRowWithDates)
    return _allCache
  })()

  return _allCachePromise
}

export function useSubmissions(filters = {}) {
  const [allData, setAllData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const fetchData = useCallback(() => {
    let cancelled = false
    setLoading(true)
    fetchAllRows()
      .then(rows => { if (!cancelled) { setAllData(rows); setLoading(false); setLastRefreshed(new Date()) } })
      .catch(e  => { if (!cancelled) { setError(e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    invalidateCache()
    fetchData()
  }, [fetchData])

  const data = useMemo(() => {
    let rows = allData
    if (filters.year)         rows = rows.filter(r => r.year === filters.year)
    if (filters.month)        rows = rows.filter(r => r.month === filters.month)
    if (filters.quarter)      rows = rows.filter(r => r.quarter === filters.quarter)
    if (filters.week)         rows = rows.filter(r => r.week === filters.week)
    if (filters.sourceDate) {
      rows = rows.filter(r => r.source_date === filters.sourceDate)
    }
    if (filters.partnerName)  rows = rows.filter(r => r.partner_name === filters.partnerName)
    if (filters.sourcerEmail) rows = rows.filter(r => r.sourcer_email === filters.sourcerEmail)
    return rows
  }, [allData, JSON.stringify(filters)])

  return { data, loading, error, lastRefreshed, refetch }
}

export function useSubmissionsMeta(userMap = {}) {
  const [allData, setAllData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllRows()
      .then(rows => { setAllData(rows); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const meta = useMemo(() => {
    const unique = (arr) => [...new Set(arr.filter(Boolean))].sort()
    const teams = unique(
      allData.map(r => {
        const u = userMap[(r.sourcer_email || '')]
        return u ? u.teamName : 'Unassigned'
      })
    )
    const associates = unique(
      allData.map(r => {
        const u = userMap[(r.sourcer_email || '')]
        return u ? u.fullName : r.sourcer_email
      })
    )
    return {
      years:      [...new Set(allData.map(r => r.year).filter(Boolean))].map(Number).sort((a,b)=>a-b),
      months:     MONTHS,
      teams:      teams.length ? teams : ['EA','Lemon','Racquel','Rox'],
      associates,
      partners:   unique(allData.map(r => r.partner_name)),
      weeks:      unique(allData.map(r => r.week)),
    }
  }, [allData, userMap])

  return { meta, loading }
}

export function invalidateCache() {
  _allCache = null
  _allCachePromise = null
}
