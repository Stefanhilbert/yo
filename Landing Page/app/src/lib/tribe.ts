import type { Tribe } from '../types/extensions.ts'

const STORAGE_KEY = 'yo.travianLanding.tribe'

const VALID_TRIBES: Tribe[] = ['roman', 'gaul', 'teuton', 'hun', 'egyptian']

export function loadTribe(): Tribe {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw && VALID_TRIBES.includes(raw as Tribe)) return raw as Tribe
  return 'roman'
}

export function saveTribe(tribe: Tribe) {
  localStorage.setItem(STORAGE_KEY, tribe)
}

