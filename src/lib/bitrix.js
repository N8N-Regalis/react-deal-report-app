const BITRIX_BASE = 'https://regaliscapitalcorp.bitrix24.com/rest/1/nk4lkwq9527dxv4n'

const TEAM_FIELD = 'UF_USR_1779466932710'

export async function fetchAllBitrixUsers() {
  const users = []
  let start = 0

  while (true) {
    const res = await fetch(`${BITRIX_BASE}/user.get.json?start=${start}`)
    if (!res.ok) throw new Error(`Bitrix API error: ${res.status} ${res.statusText}`)
    const json = await res.json()

    const batch = json.result || []
    users.push(...batch)

    const total = json.total ?? 0
    start += 50

    if (start >= total || batch.length === 0) break
  }

  return users
}

export function normalizeBitrixUsers(rawUsers) {
  return rawUsers.map(u => {
    const firstName = u.NAME || ''
    const lastName  = u.LAST_NAME || ''
    const fullName  = [firstName, lastName].filter(Boolean).join(' ').trim()
    const email     = (u.EMAIL || '').toLowerCase().trim()
    const teamName  = u[TEAM_FIELD] || ''

    return {
      id:           u.ID,
      email,
      fullName,
      firstName,
      lastName,
      teamName,
      position:     u.WORK_POSITION || '',
      active:       u.ACTIVE,
      departments:  u.UF_DEPARTMENT || [],
    }
  })
}

export function buildEmailToUserMap(normalizedUsers) {
  const map = {}
  normalizedUsers.forEach(u => {
    if (u.email) map[u.email] = u
  })
  return map
}
