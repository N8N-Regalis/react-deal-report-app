import { useState, useEffect } from 'react'
import { fetchAllBitrixUsers, normalizeBitrixUsers, buildEmailToUserMap } from '../lib/bitrix'

let _cachedUsers = null
let _cachedMap   = null

export function useBitrixUsers() {
  const [users,   setUsers]   = useState(_cachedUsers || [])
  const [userMap, setUserMap] = useState(_cachedMap   || {})
  const [loading, setLoading] = useState(!_cachedUsers)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (_cachedUsers) return
    let cancelled = false

    async function load() {
      try {
        const raw        = await fetchAllBitrixUsers()
        const normalized = normalizeBitrixUsers(raw)
        const map        = buildEmailToUserMap(normalized)
        _cachedUsers = normalized
        _cachedMap   = map
        if (!cancelled) {
          setUsers(normalized)
          setUserMap(map)
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  function getUser(email) {
    return userMap[(email || '').toLowerCase().trim()] || null
  }

  function enrichRow(row) {
    const user = getUser(row.user_email)
    return {
      ...row,
      sourcer_name: user ? user.fullName  : row.user_email,
      team_name:    user ? user.teamName  : '',
      work_position: user ? user.position : '',
    }
  }

  return { users, userMap, loading, error, getUser, enrichRow }
}
