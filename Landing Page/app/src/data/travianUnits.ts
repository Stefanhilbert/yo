/* ── Travian unit definitions & predefined farming tactics ──────── */

export type TribeName = 'roman' | 'gaul' | 'teuton' | 'hun' | 'egyptian'

export interface UnitDef {
  id: string
  name: string
  speed: number // base fields/hour at 1x
}

export interface TribeDef {
  id: TribeName
  label: string
  units: UnitDef[]
}

export interface TacticUnit {
  unitId: string
  count: number
}

export type TacticMode = 'pve' | 'pvp'

export interface Tactic {
  id: string
  name: string
  tribe: TribeName
  mode: TacticMode
  oasisType: string // "Clay/Iron", "Wood", "Crop", "Any", "Villages", etc.
  units: TacticUnit[]
  /** Speed of the slowest unit in the set (base, before server multiplier) */
  speed: number
  requirements: string
  notes: string
}

/* ── Tribes & units ────────────────────────────────────────────── */

export const TRIBES: TribeDef[] = [
  {
    id: 'roman',
    label: 'Romans',
    units: [
      { id: 'legionnaire', name: 'Legionnaire', speed: 6 },
      { id: 'praetorian', name: 'Praetorian', speed: 5 },
      { id: 'imperian', name: 'Imperian', speed: 7 },
      { id: 'equites_legati', name: 'Equites Legati', speed: 16 },
      { id: 'equites_imperatoris', name: 'Equites Imperatoris', speed: 14 },
      { id: 'equites_caesaris', name: 'Equites Caesaris', speed: 10 },
    ],
  },
  {
    id: 'gaul',
    label: 'Gauls',
    units: [
      { id: 'phalanx', name: 'Phalanx', speed: 7 },
      { id: 'swordsman', name: 'Swordsman', speed: 6 },
      { id: 'theutates_thunder', name: 'Theutates Thunder', speed: 19 },
      { id: 'druidrider', name: 'Druidrider', speed: 16 },
      { id: 'haeduan', name: 'Haeduan', speed: 13 },
    ],
  },
  {
    id: 'teuton',
    label: 'Teutons',
    units: [
      { id: 'clubswinger', name: 'Clubswinger', speed: 7 },
      { id: 'spearfighter', name: 'Spearfighter', speed: 7 },
      { id: 'axefighter', name: 'Axefighter', speed: 6 },
      { id: 'scout_teuton', name: 'Scout', speed: 9 },
      { id: 'paladin', name: 'Paladin', speed: 10 },
      { id: 'teutonic_knight', name: 'Teutonic Knight', speed: 9 },
    ],
  },
  {
    id: 'hun',
    label: 'Huns',
    units: [
      { id: 'mercenary', name: 'Mercenary', speed: 6 },
      { id: 'bowman', name: 'Bowman', speed: 6 },
      { id: 'steppe_rider', name: 'Steppe Rider', speed: 16 },
      { id: 'marksman', name: 'Marksman', speed: 12 },
      { id: 'marauder', name: 'Marauder', speed: 10 },
    ],
  },
  {
    id: 'egyptian',
    label: 'Egyptians',
    units: [
      { id: 'slave_militia', name: 'Slave Militia', speed: 7 },
      { id: 'ash_warden', name: 'Ash Warden', speed: 7 },
      { id: 'khopesh_warrior', name: 'Khopesh Warrior', speed: 7 },
      { id: 'sopdu_explorer', name: 'Sopdu Explorer', speed: 9 },
      { id: 'anhur_guard', name: 'Anhur Guard', speed: 13 },
      { id: 'resheph_chariot', name: 'Resheph Chariot', speed: 15 },
    ],
  },
]

export function getTribe(id: TribeName): TribeDef {
  return TRIBES.find((t) => t.id === id)!
}

/* ── Server speed multipliers ──────────────────────────────────── */

export const SERVER_SPEEDS = [1, 2, 3, 5, 10] as const
export type ServerSpeed = (typeof SERVER_SPEEDS)[number]

/** On 1x server: 1; on 2x/3x/5x/10x speed servers troop movement is 2x (not serverSpeed). */
export function getMovementMultiplier(serverSpeed: number): number {
  return serverSpeed === 1 ? 1 : 2
}

/* ── Predefined tactics (itsemotional guide, 5 min interval base) */

export const PREDEFINED_TACTICS: Tactic[] = [
  // ═══ PvE Tactics (oasis farming) ═══════════════════════════

  // ── Teutons ─────────────────────────────────────────────────
  { id: 'teuton-clay-iron', name: 'Clay / Iron', tribe: 'teuton', mode: 'pve', oasisType: 'Clay / Iron', units: [{ unitId: 'clubswinger', count: 8 }, { unitId: 'teutonic_knight', count: 2 }], speed: 7, requirements: 'No upgrades needed', notes: 'Max 1 club loss without rare spawns. When you start woods, clay+iron give 0 losses without rare spawns.' },
  { id: 'teuton-wood', name: 'Wood', tribe: 'teuton', mode: 'pve', oasisType: 'Wood', units: [{ unitId: 'clubswinger', count: 8 }, { unitId: 'teutonic_knight', count: 2 }], speed: 7, requirements: 'Metallurgy 6%, Brewery 20, Smithy 8', notes: 'Max 2 club loss without rare spawns. When you start crop, wood only gives 1 loss from bears even with 8-2.' },
  { id: 'teuton-crop', name: 'Crop', tribe: 'teuton', mode: 'pve', oasisType: 'Crop', units: [{ unitId: 'clubswinger', count: 13 }, { unitId: 'teutonic_knight', count: 2 }], speed: 7, requirements: 'Metallurgy 10%, Brewery 20, Smithy 20', notes: '3 club losses only on double crocodiles (twice/hour). Option: stick to 8-2 everywhere except crop for 1-2 club losses only, OR switch all to 13-2 for max 2 club losses per hit.' },

  // ── Romans ──────────────────────────────────────────────────
  { id: 'roman-clay-iron', name: 'Clay / Iron', tribe: 'roman', mode: 'pve', oasisType: 'Clay / Iron', units: [{ unitId: 'equites_imperatoris', count: 1 }, { unitId: 'equites_caesaris', count: 1 }], speed: 10, requirements: 'No upgrades needed', notes: 'No losses unless rare spawns.' },
  { id: 'roman-wood', name: 'Wood', tribe: 'roman', mode: 'pve', oasisType: 'Wood', units: [{ unitId: 'imperian', count: 1 }, { unitId: 'equites_imperatoris', count: 2 }, { unitId: 'equites_caesaris', count: 2 }], speed: 7, requirements: 'Metallurgy 6%, Smithy 13 (EI+EC)', notes: 'No losses unless rare spawns. Can swap to 2 EI + 2 EC once metallurgy 10 and smithy 20.' },
  { id: 'roman-crop', name: 'Crop (expensive)', tribe: 'roman', mode: 'pve', oasisType: 'Crop', units: [{ unitId: 'equites_imperatoris', count: 5 }, { unitId: 'equites_caesaris', count: 5 }], speed: 10, requirements: 'Metallurgy 10%, Smithy 20 (horses)', notes: 'Not recommended at 5 min interval. Consider skipping crop oases for Romans.' },

  // ── Gauls ───────────────────────────────────────────────────
  { id: 'gaul-clay-iron', name: 'Clay / Iron', tribe: 'gaul', mode: 'pve', oasisType: 'Clay / Iron', units: [{ unitId: 'theutates_thunder', count: 1 }, { unitId: 'haeduan', count: 1 }], speed: 13, requirements: 'No upgrades needed', notes: '0 losses unless rare spawns.' },
  { id: 'gaul-wood', name: 'Wood', tribe: 'gaul', mode: 'pve', oasisType: 'Wood', units: [{ unitId: 'theutates_thunder', count: 4 }, { unitId: 'haeduan', count: 2 }], speed: 13, requirements: 'Metallurgy 6%, Smithy 14', notes: '-1 TT per hit unless rare spawns. Evaluate if worth the losses.' },
  { id: 'gaul-crop', name: 'Crop', tribe: 'gaul', mode: 'pve', oasisType: 'Crop', units: [{ unitId: 'theutates_thunder', count: 5 }, { unitId: 'haeduan', count: 2 }], speed: 13, requirements: 'Metallurgy 10%, Smithy 20', notes: '-1 TT per hit unless rare spawns. At 3 min interval, 1-1 works for all oasis types with smithy 5 + metallurgy 2%.' },

  // ── Huns ────────────────────────────────────────────────────
  { id: 'hun-clay-iron', name: 'Clay / Iron', tribe: 'hun', mode: 'pve', oasisType: 'Clay / Iron', units: [{ unitId: 'steppe_rider', count: 1 }, { unitId: 'marksman', count: 1 }, { unitId: 'marauder', count: 1 }], speed: 10, requirements: 'No upgrades needed', notes: '0 losses unless rare spawns. Can also do 1 Steppe + 1 Marauder only.' },
  { id: 'hun-wood', name: 'Wood', tribe: 'hun', mode: 'pve', oasisType: 'Wood', units: [{ unitId: 'steppe_rider', count: 2 }, { unitId: 'marksman', count: 2 }, { unitId: 'marauder', count: 2 }], speed: 10, requirements: 'Metallurgy 2%, Smithy 2', notes: '0 losses unless rare spawns. Alt: 1-1-1 with no upgrades but lose sets on bear cycles.' },
  { id: 'hun-crop', name: 'Crop', tribe: 'hun', mode: 'pve', oasisType: 'Crop', units: [{ unitId: 'steppe_rider', count: 2 }, { unitId: 'marksman', count: 2 }, { unitId: 'marauder', count: 2 }], speed: 10, requirements: 'Metallurgy 8%, Smithy 16', notes: '0 losses unless elephants. At metallurgy 10 / smithy 20 elephants are 0 loss too.' },

  // ── Egyptians (generic estimates) ───────────────────────────
  { id: 'egyptian-clay-iron', name: 'Clay / Iron', tribe: 'egyptian', mode: 'pve', oasisType: 'Clay / Iron', units: [{ unitId: 'anhur_guard', count: 1 }, { unitId: 'resheph_chariot', count: 1 }], speed: 13, requirements: 'No upgrades needed', notes: 'Estimated. No specific guide data for Egyptians.' },
  { id: 'egyptian-wood-crop', name: 'Wood / Crop', tribe: 'egyptian', mode: 'pve', oasisType: 'Wood / Crop', units: [{ unitId: 'anhur_guard', count: 2 }, { unitId: 'resheph_chariot', count: 2 }], speed: 13, requirements: 'Metallurgy + Smithy recommended', notes: 'Estimated. No specific guide data for Egyptians.' },

]

export function getTacticsForTribe(tribe: TribeName, mode?: TacticMode): Tactic[] {
  return PREDEFINED_TACTICS.filter((t) => t.tribe === tribe && (!mode || t.mode === mode))
}

/* ── Speed bonus addons ────────────────────────────────────────── */

export const BOOTS_TIERS = [
  { id: 'none', label: 'None', bonus: 0 },
  { id: 'tier1', label: 'Boots +25%', bonus: 0.25 },
  { id: 'tier2', label: 'Boots +50%', bonus: 0.50 },
  { id: 'tier3', label: 'Boots +75%', bonus: 0.75 },
] as const

export type BootsTierId = (typeof BOOTS_TIERS)[number]['id']

export const ARTIFACT_TIERS = [
  { id: 'none', label: 'None', multiplier: 1 },
  { id: 'large', label: 'Large (1.5x)', multiplier: 1.5 },
  { id: 'small', label: 'Small / Unique (2x)', multiplier: 2 },
] as const

export type ArtifactTierId = (typeof ARTIFACT_TIERS)[number]['id']

export function getBootsBonus(id: BootsTierId): number {
  return BOOTS_TIERS.find((b) => b.id === id)?.bonus ?? 0
}

export function getArtifactMultiplier(id: ArtifactTierId): number {
  return ARTIFACT_TIERS.find((a) => a.id === id)?.multiplier ?? 1
}

/**
 * Calculate one-way travel time in minutes, factoring in
 * Tournament Square, Hero Boots, and Titan's Boots artifact.
 *
 * TS + boots are additive and only apply beyond 20 fields.
 * Artifact is multiplicative on the entire journey.
 */
export function calcTravelTime(
  distance: number,
  baseSpeed: number,
  serverSpeed: number,
  tsLevel: number,
  bootsBonusPct: number,
  artifactMult: number,
): number {
  const speed = baseSpeed * getMovementMultiplier(serverSpeed)

  if (distance <= 20) {
    return (distance / (speed * artifactMult)) * 60
  }

  const additive = 1 + tsLevel * 0.2 + bootsBonusPct
  const timeFirst20 = (20 / (speed * artifactMult)) * 60
  const boostedSpeed = speed * additive * artifactMult
  const timeRemaining = ((distance - 20) / boostedSpeed) * 60
  return timeFirst20 + timeRemaining
}
