/* ── Farm list text parser ──────────────────────────────────────── */

export interface FarmTarget {
  name: string
  population: number
  distance: number
}

/** Strip Unicode format/control chars and commas so "‭1,941‬" → "1941" */
function normalizeNum(s: string): string {
  return s
    .replace(/[\u200B-\u200D\u200E\u200F\u202A-\u202E\u2060\uFEFF]/g, '')
    .replace(/,/g, '')
    .trim()
}

/** Get column parts: try tab first, then 2+ spaces, then regex "name + number + number" at end */
function getLineParts(line: string): string[] {
  let parts = line.split('\t').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 3) return parts
  parts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 3) return parts
  // Single-space or no clear columns: match "name" + " number" + " number" at end (greedy so last two are numbers)
  const match = line.trim().match(/^(.+)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s*$/)
  if (match) return [match[1].trim(), match[2], match[3]]
  return parts
}

/**
 * Parse raw text copied from a Travian farm list page (ctrl+a → ctrl+c).
 *
 * Accepts lines like:  <name> <tab> <number> <tab> <number>
 * with either column order: (name, population, distance) or (name, distance, population).
 * Handles Unicode formatting characters (e.g. ‭ ‬) and comma-separated numbers.
 */
export function parseFarmList(raw: string): FarmTarget[] {
  const targets: FarmTarget[] = []

  const text = raw.replace(/\r\n/g, '\n')
  const lines = text.split('\n')

  for (const line of lines) {
    const parts = getLineParts(line)
    if (parts.length < 3) continue

    for (let i = 0; i <= parts.length - 3; i++) {
      const name = parts[i].trim()
      const aStr = normalizeNum(parts[i + 1])
      const bStr = normalizeNum(parts[i + 2])

      // Name should contain letters (not be a pure number)
      if (/^\d+(\.\d+)?$/.test(name)) continue

      const aNum = parseFloat(aStr)
      const bNum = parseFloat(bStr)
      if (Number.isNaN(aNum) || Number.isNaN(bNum)) continue
      // Allow 0 population (e.g. unoccupied oasis in PvE); only distance must be > 0
      if (aNum < 0 || bNum < 0) continue

      // Support both orders: (name, population, distance) and (name, distance, population)
      const aIsInt = /^\d+$/.test(aStr)
      const bIsInt = /^\d+$/.test(bStr)
      let population: number
      let distance: number
      if (aIsInt && bIsInt) {
        population = Math.round(aNum)
        distance = Math.round(bNum)
      } else if (aIsInt && !bIsInt) {
        population = Math.round(aNum)
        distance = bNum
      } else if (!aIsInt && bIsInt) {
        distance = aNum
        population = Math.round(bNum)
      } else {
        distance = aNum
        population = Math.round(bNum)
      }
      if (distance <= 0) continue

      targets.push({ name, population, distance })
      break
    }
  }

  return targets
}

export interface FarmListResult {
  listId: string
  targets: FarmTarget[]
}

/**
 * Split pasted text by farm list blocks (lines "01", "02", "03" …) and parse each.
 * Only splits when a two-digit line is followed by a line containing "being raided"
 * (Travian list header), so we don't split on random two-digit lines like "20" (waves).
 */
export function parseFarmLists(raw: string): FarmListResult[] {
  const text = raw.replace(/\r\n/g, '\n').trim()
  if (!text) return []

  // Split only at list boundaries: newline + two digits + newline + next line contains "being raided"
  const chunks = text.split(/\n(?=\d{2}\s*\n[^\n]*being raided)/).filter(Boolean)
  if (chunks.length <= 1) {
    const targets = parseFarmList(text)
    return targets.length ? [{ listId: '01', targets }] : []
  }

  const results: FarmListResult[] = []
  for (const chunk of chunks) {
    const firstLine = chunk.split('\n')[0]?.trim() ?? ''
    const listId = /^\d{2}$/.test(firstLine) ? firstLine : `${results.length + 1}`.padStart(2, '0')
    const targets = parseFarmList(chunk)
    if (targets.length > 0) results.push({ listId, targets })
  }
  return results
}
