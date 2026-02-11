import { useState, useMemo, useEffect } from 'react'
import {
  TRIBES,
  SERVER_SPEEDS,
  getTribe,
  getTacticsForTribe,
  calcTravelTime,
  getMovementMultiplier,
  type TribeName,
  type ServerSpeed,
  type Tactic,
  type TacticUnit,
  type TacticMode,
} from '../../data/travianUnits.ts'
import { parseFarmLists, type FarmTarget, type FarmListResult } from '../../lib/parseFarmList.ts'
import { useTribe } from '../TribeProvider.tsx'
import { useTranslation } from '../../i18n/index.ts'
import styles from './TroopCalculator.module.css'

export interface TroopCalculatorProps {
  mode: TacticMode
  title: string
  showPopulation?: boolean
  showBudget?: boolean
}

interface CalcRow {
  target: FarmTarget
  travelTimeMin: number
  roundTripMin: number
  wavesNeeded: number
  troopsPerWave: TacticUnit[]
  totalTroops: Record<string, number>
}

function formatTime(minutes: number): string {
  const m = Math.floor(minutes)
  const s = Math.round((minutes - m) * 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getUnitName(tribe: TribeName, unitId: string): string {
  const t = getTribe(tribe)
  return t.units.find((u) => u.id === unitId)?.name ?? unitId
}

export function TroopCalculator({ mode, title, showPopulation = false, showBudget = false }: TroopCalculatorProps) {
  const { t } = useTranslation()
  const { tribe, setTribe } = useTribe()
  const tribeName = tribe as TribeName

  /* ── State ──────────────────────────────────────────────────── */
  const [serverSpeed, setServerSpeed] = useState<ServerSpeed>(3)
  const [interval, setInterval_] = useState(5)

  const [tacticId, setTacticId] = useState<string>('custom')
  const [customUnits, setCustomUnits] = useState<TacticUnit[]>([])

  /* Sync tactic and custom units when shared tribe changes (e.g. from Header). Default tactic is Custom. */
  const tribeTacticsForSync = useMemo(() => getTacticsForTribe(tribeName, mode), [tribeName, mode])
  useEffect(() => {
    setTacticId('custom')
    const tribeDef = getTribe(tribeName)
    setCustomUnits(tribeDef.units.map((u) => ({ unitId: u.id, count: 0 })))
  }, [tribeName, tribeTacticsForSync])

  const [rawText, setRawText] = useState('')
  const [listResults, setListResults] = useState<FarmListResult[]>([])
  const [hasCalculated, setHasCalculated] = useState(false)
  const [rejectMessage, setRejectMessage] = useState<string | null>(null)

  /** PvE = oasis/unoccupied or 0 population. Reject in PvE when list looks like PvP (no such markers). */
  function looksLikePvP(results: FarmListResult[]): boolean {
    const allTargets = results.flatMap((r) => r.targets)
    if (allTargets.length === 0) return false
    const hasPvESignature = allTargets.some(
      (t) => t.population === 0 || /oasis|unoccupied/i.test(t.name),
    )
    return !hasPvESignature
  }

  /** Reject in PvP when list looks like PvE (oasis/unoccupied or 0 population). */
  function looksLikePvE(results: FarmListResult[]): boolean {
    const allTargets = results.flatMap((r) => r.targets)
    if (allTargets.length === 0) return false
    return allTargets.some(
      (t) => t.population === 0 || /oasis|unoccupied/i.test(t.name),
    )
  }

  /* ── Speed bonus state (Tournament Square only) ──────────────── */
  const [tsLevel, setTsLevel] = useState(0)

  /* ── Budget state ───────────────────────────────────────────── */
  const [availableTroops, setAvailableTroops] = useState<Record<string, number>>({})

  /* ── Per-row per-wave overrides (key: rowIndex, value: unitId→perWaveCount) */
  const [rowOverrides, setRowOverrides] = useState<Record<number, Record<string, number>>>({})

  const tsBonusPct = tsLevel * 0.2

  const tribeTactics = useMemo(() => getTacticsForTribe(tribeName, mode), [tribeName, mode])
  const isCustom = tacticId === 'custom'

  const selectedTactic: Tactic | undefined = useMemo(
    () => (isCustom ? undefined : tribeTactics.find((t) => t.id === tacticId)),
    [isCustom, tribeTactics, tacticId],
  )

  const activeUnits: TacticUnit[] = isCustom
    ? customUnits.filter((u) => u.count > 0)
    : selectedTactic?.units ?? []

  const activeSpeed: number = useMemo(() => {
    if (selectedTactic) return selectedTactic.speed
    const tribeDef = getTribe(tribeName)
    let slowest = Infinity
    for (const cu of activeUnits) {
      const u = tribeDef.units.find((u) => u.id === cu.unitId)
      if (u && u.speed < slowest) slowest = u.speed
    }
    return slowest === Infinity ? 0 : slowest
  }, [selectedTactic, tribeName, activeUnits])

  /* ── Tribe change → reset tactic ────────────────────────────── */
  function handleTribeChange(newTribe: TribeName) {
    setTribe(newTribe)
    setTacticId('custom')
    const tribeDef = getTribe(newTribe)
    setCustomUnits(tribeDef.units.map((u) => ({ unitId: u.id, count: 0 })))
    setAvailableTroops({})
    setHasCalculated(false)
    setListResults([])
  }

  function handleTacticChange(id: string) {
    setTacticId(id)
    setAvailableTroops({})
    setHasCalculated(false)
    setListResults([])
  }

  /* ── Calculate ──────────────────────────────────────────────── */
  function handleCalculate() {
    setRejectMessage(null)
    const parsed = parseFarmLists(rawText)
    if (mode === 'pve' && looksLikePvP(parsed)) {
      setListResults([])
      setRejectMessage(t('calculator.pvpListUsePvpCalculator'))
      setHasCalculated(true)
      return
    }
    if (mode === 'pvp' && looksLikePvE(parsed)) {
      setListResults([])
      setRejectMessage(t('calculator.pveListUsePveCalculator'))
      setHasCalculated(true)
      return
    }
    setListResults(parsed)
    setRowOverrides({})
    setHasCalculated(true)
  }

  function handleReset() {
    setRawText('')
    setListResults([])
    setRowOverrides({})
    setRejectMessage(null)
    setHasCalculated(false)
  }

  /* ── Build result rows (per list, then flattened). Show targets even when no tactic/units (e.g. PvP custom). ── */
  const { rows, listBoundaries } = useMemo(() => {
    if (!listResults.length)
      return { rows: [] as CalcRow[], listBoundaries: [] as { listId: string; start: number; count: number }[] }
    const rowsPerList: CalcRow[][] = listResults.map((list) => {
      const sorted = [...list.targets].sort((a, b) => a.distance - b.distance)
      return sorted.map((target) => {
        const travelTimeMin = calcTravelTime(target.distance, activeSpeed, serverSpeed, tsLevel, 0, 1)
        const roundTripMin = travelTimeMin * 2
        const wavesNeeded = Math.ceil(roundTripMin / interval)
        const totalTroops: Record<string, number> = {}
        for (const u of activeUnits) {
          totalTroops[u.unitId] = wavesNeeded * u.count
        }
        return { target, travelTimeMin, roundTripMin, wavesNeeded, troopsPerWave: activeUnits, totalTroops }
      })
    })
    const rows = rowsPerList.flat()
    const listBoundaries = listResults.map((list, i) => ({
      listId: list.listId,
      start: rowsPerList.slice(0, i).reduce((s, r) => s + r.length, 0),
      count: list.targets.length,
    }))
    return { rows, listBoundaries }
  }, [listResults, activeUnits, activeSpeed, serverSpeed, interval, tsLevel])

  /* ── Per-wave override helpers ────────────────────────────── */
  /** Get per-wave count for a specific row+unit (override or default) */
  function getPerWave(rowIndex: number, unitId: string): number {
    return rowOverrides[rowIndex]?.[unitId] ?? activeUnits.find((u) => u.unitId === unitId)?.count ?? 0
  }

  /** Get total for a specific row+unit = waves * perWave */
  function getRowTotal(rowIndex: number, unitId: string): number {
    return (rows[rowIndex]?.wavesNeeded ?? 0) * getPerWave(rowIndex, unitId)
  }

  function setPerWaveOverride(rowIndex: number, unitId: string, value: number) {
    const defaultCount = activeUnits.find((u) => u.unitId === unitId)?.count ?? 0
    if (value === defaultCount) {
      // Same as default → remove override
      setRowOverrides((prev) => {
        const copy = { ...prev }
        if (copy[rowIndex]) {
          const unitCopy = { ...copy[rowIndex] }
          delete unitCopy[unitId]
          if (Object.keys(unitCopy).length === 0) delete copy[rowIndex]
          else copy[rowIndex] = unitCopy
        }
        return copy
      })
    } else {
      setRowOverrides((prev) => ({
        ...prev,
        [rowIndex]: { ...(prev[rowIndex] ?? {}), [unitId]: Math.max(0, value) },
      }))
    }
  }

  function isOverridden(rowIndex: number, unitId: string): boolean {
    return rowOverrides[rowIndex]?.[unitId] !== undefined
  }

  const hasOverrides = Object.keys(rowOverrides).length > 0

  /* ── Totals (respecting per-wave overrides) ─────────────────── */
  const totals: Record<string, number> = useMemo(() => {
    const sums: Record<string, number> = {}
    for (let i = 0; i < rows.length; i++) {
      for (const u of activeUnits) {
        const perWave = rowOverrides[i]?.[u.unitId] ?? u.count
        sums[u.unitId] = (sums[u.unitId] ?? 0) + rows[i].wavesNeeded * perWave
      }
    }
    return sums
  }, [rows, activeUnits, rowOverrides])

  const listTotals: Record<string, number>[] = useMemo(() => {
    return listBoundaries.map(({ start, count }) => {
      const sums: Record<string, number> = {}
      for (let i = start; i < start + count; i++) {
        for (const u of activeUnits) {
          const perWave = rowOverrides[i]?.[u.unitId] ?? u.count
          sums[u.unitId] = (sums[u.unitId] ?? 0) + (rows[i]?.wavesNeeded ?? 0) * perWave
        }
      }
      return sums
    })
  }, [listBoundaries, rows, activeUnits, rowOverrides])

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)

  /* ── Budget: cumulative coverage (respecting per-wave overrides) */
  const hasBudget = showBudget && Object.values(availableTroops).some((v) => v > 0)

  const rowCoverage: boolean[] = useMemo(() => {
    if (!hasBudget || !rows.length) return []
    const cumulative: Record<string, number> = {}
    return rows.map((_row, i) => {
      for (const u of activeUnits) {
        const perWave = rowOverrides[i]?.[u.unitId] ?? u.count
        cumulative[u.unitId] = (cumulative[u.unitId] ?? 0) + rows[i].wavesNeeded * perWave
      }
      return activeUnits.every((u) => (cumulative[u.unitId] ?? 0) <= (availableTroops[u.unitId] ?? 0))
    })
  }, [hasBudget, rows, activeUnits, availableTroops, rowOverrides])

  const coveredCount = rowCoverage.filter(Boolean).length

  /* ── Custom unit handlers ───────────────────────────────────── */
  function setCustomCount(unitId: string, count: number) {
    setCustomUnits((prev) =>
      prev.map((u) => (u.unitId === unitId ? { ...u, count: Math.max(0, count) } : u)),
    )
  }

  function setAvailable(unitId: string, count: number) {
    setAvailableTroops((prev) => ({ ...prev, [unitId]: Math.max(0, count) }))
  }


  /* ── Computed display values ────────────────────────────────── */
  const hasSpeed = activeSpeed > 0
  const movementMult = getMovementMultiplier(serverSpeed)
  const baseEffective = activeSpeed * movementMult
  const boostedEffective = baseEffective * (1 + tsBonusPct)

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* ── Header ───────────────────────────────────────────── */}
      <header className={styles.pageHeader}>
        <h1 className={styles.h1}>{title}</h1>
        <div className={styles.headerStats}>
          <div className={styles.headerStat}>
            <span className={styles.headerStatValue}>{hasSpeed ? baseEffective : '–'}</span>
            <span className={styles.headerStatLabel}>f/h base</span>
          </div>
          <div className={styles.headerStat}>
            <span className={styles.headerStatValue}>{hasSpeed ? Math.round(boostedEffective * 10) / 10 : '–'}</span>
            <span className={styles.headerStatLabel}>f/h effective</span>
          </div>
        </div>
      </header>

      {/* ── Settings (collapsible) ────────────────────────────── */}
      <details className={styles.card} open>
        <summary className={styles.collapseSummary}>
          <span className={styles.collapseTitle}>{t('calculator.settings')}</span>
          <span className={styles.collapseHint} />
        </summary>
        <div className={styles.collapseBody}>
          <div className={styles.settings} style={tribeTactics.length === 0 ? { gridTemplateColumns: 'repeat(3, 1fr)' } : undefined}>
            <label className={styles.field}>
              <span className={styles.label}>{t('calculator.serverSpeed')}</span>
              <select className={styles.select} value={serverSpeed} onChange={(e) => { setServerSpeed(Number(e.target.value) as ServerSpeed); setHasCalculated(false) }}>
                {SERVER_SPEEDS.map((s) => (<option key={s} value={s}>{s}x</option>))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t('calculator.sendInterval')}</span>
              <input className={styles.input} type="number" min={1} max={60} value={interval} onChange={(e) => { setInterval_(Math.max(1, Number(e.target.value))); setHasCalculated(false) }} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t('calculator.tribe')}</span>
              <select className={styles.select} value={tribeName} onChange={(e) => handleTribeChange(e.target.value as TribeName)}>
                {TRIBES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
              </select>
            </label>
            {tribeTactics.length > 0 && (
              <label className={styles.field}>
                <span className={styles.label}>{t('calculator.tactic')}</span>
                <select className={styles.select} value={tacticId} onChange={(e) => handleTacticChange(e.target.value)}>
                  {tribeTactics.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                  <option value="custom">{t('calculator.custom')}</option>
                </select>
              </label>
            )}
          </div>

          {selectedTactic && (
            <div className={styles.tacticInfo}>
              <div className={styles.tacticRow}>
                <span className={styles.tacticLabel}>{t('calculator.unitsPerWave')}</span>
                <span>{selectedTactic.units.map((u) => `${u.count} ${getUnitName(tribeName, u.unitId)}`).join(' + ')}</span>
              </div>
              <div className={styles.tacticRow}>
                <span className={styles.tacticLabel}>{t('calculator.requirements')}</span>
                <span>{selectedTactic.requirements}</span>
              </div>
              {selectedTactic.notes && (<div className={styles.tacticNote}>{selectedTactic.notes}</div>)}
            </div>
          )}

          {isCustom && (
            <div className={styles.customPicker}>
              <p className={styles.customLabel}>{t('calculator.unitsPerWave')}</p>
              <div className={styles.customGrid}>
                {getTribe(tribeName).units.map((u) => {
                  const cu = customUnits.find((c) => c.unitId === u.id)
                  return (
                    <label key={u.id} className={styles.customUnit}>
                      <span className={styles.customUnitName}>{u.name}</span>
                      <span className={styles.customUnitSpeed}>
                        ({u.speed * movementMult} f/h)
                      </span>
                      <input className={styles.customInput} type="number" min={0} max={999} value={cu?.count ?? 0} onChange={(e) => setCustomCount(u.id, Number(e.target.value))} />
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </details>

      {/* ── Tournament Square (collapsible) ─────────────────────── */}
      <details className={styles.card}>
        <summary className={styles.collapseSummary}>
          <span className={styles.collapseTitle}>
            {t('calculator.tournamentSquare')}
            {tsLevel > 0 && (<span className={styles.collapseBadge}>Lvl {tsLevel} (+{Math.round(tsBonusPct * 100)}%)</span>)}
          </span>
          <span className={styles.collapseHint} />
        </summary>
        <div className={styles.collapseBody}>
          <div className={`${styles.bonusItem} ${tsLevel > 0 ? styles.bonusActive : ''}`}>
            <div className={styles.bonusBody}>
              <div className={styles.bonusHeader}>
                <span className={styles.bonusName}>Tournament Square</span>
                {tsLevel > 0 && (<span className={styles.bonusBadge}>+{Math.round(tsBonusPct * 100)}%</span>)}
              </div>
              <div className={styles.bonusControl}>
                <label className={styles.bonusSliderLabel}>
                  <span>Level {tsLevel}</span>
                  <input type="range" min={0} max={20} value={tsLevel} onChange={(e) => { setTsLevel(Number(e.target.value)); setHasCalculated(false) }} className={styles.slider} />
                </label>
              </div>
              <span className={styles.bonusDesc}>{t('calculator.tsDesc')}</span>
              <div className={styles.bonusEffective}>
                <span className={styles.tacticLabel}>{t('calculator.effectiveSpeed')}</span>
                <span className={styles.bonusSummaryValue}>{tsLevel > 0 ? `${Math.round(boostedEffective * 10) / 10}` : `${baseEffective}`} {t('calculator.fieldsHour')}</span>
                {tsLevel > 0 && <span className={styles.bonusSummaryDetail}>({baseEffective} base x {Math.round((1 + tsBonusPct) * 100) / 100})</span>}
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* ── Farm list input ───────────────────────────────────── */}
      <section className={styles.card}>
        <h2 className={styles.h2}>{t('calculator.farmList')}</h2>
        <p className={styles.fieldHint}>
          {t('calculator.farmListHint')}
        </p>
        <textarea className={styles.textarea} rows={8} placeholder={t('calculator.pastePlaceholder')} value={rawText} onChange={(e) => setRawText(e.target.value)} />
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={handleCalculate} disabled={!rawText.trim()}>{t('calculator.parseCalculate')}</button>
          <button className={styles.btnSecondary} onClick={handleReset}>{t('calculator.reset')}</button>
        </div>
      </section>

      {/* ── Results ───────────────────────────────────────────── */}
      {hasCalculated && (
        <section className={styles.card}>
          <h2 className={styles.h2}>
            {t('calculator.results')}
            {rows.length > 0 && <span className={styles.count}>{rows.length} {t('calculator.targets')}</span>}
            {hasOverrides && (
              <button className={styles.resetOverrides} onClick={() => setRowOverrides({})}>
                {t('calculator.resetOverrides')}
              </button>
            )}
          </h2>

          {rejectMessage ? (
            <p className={styles.empty}>{rejectMessage}</p>
          ) : rows.length === 0 ? (
            <p className={styles.empty}>{t('calculator.noTargets')}</p>
          ) : (
            <>
              {rows.length > 0 && activeUnits.length === 0 && (
                <p className={styles.fieldHint}>{t('calculator.addUnitsInSettings')}</p>
              )}
              {/* ── Budget input bar ────────────────────────────── */}
              {showBudget && activeUnits.length > 0 && (
                <div className={styles.budgetBar}>
                  <span className={styles.budgetTitle}>{t('calculator.yourTroops')}</span>
                  <div className={styles.budgetFields}>
                    {activeUnits.map((u) => (
                      <label key={u.unitId} className={styles.budgetField}>
                        <span className={styles.budgetFieldLabel}>{getUnitName(tribeName, u.unitId)}</span>
                        <input
                          className={styles.budgetInput}
                          type="number"
                          min={0}
                          placeholder="0"
                          value={availableTroops[u.unitId] || ''}
                          onChange={(e) => setAvailable(u.unitId, Number(e.target.value))}
                        />
                      </label>
                    ))}
                  </div>
                  {hasBudget && (
                    <div className={styles.coverageStat}>
                      <span className={styles.coverageValue}>{coveredCount}</span>
                      <span className={styles.coverageSlash}>/</span>
                      <span className={styles.coverageTotal}>{rows.length}</span>
                      <span className={styles.coverageLabel}>{t('calculator.targetsCovered')}</span>
                    </div>
                  )}
                </div>
              )}

              {listBoundaries.map((boundary, listIdx) => (
                <div key={boundary.listId} className={listIdx === 0 ? styles.firstListBlock : undefined}>
                  <h3 className={styles.listHeading}>{t('calculator.listLabel')} {boundary.listId} <span className={styles.count}>({boundary.count} {t('calculator.targets')})</span></h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.thLeft}>{t('calculator.target')}</th>
                          {showPopulation && <th>Pop</th>}
                          <th>{t('calculator.distance')}</th>
                          <th>{t('calculator.travelTime')}</th>
                          <th>{t('calculator.roundTrip')}</th>
                          <th>{t('calculator.waves')}</th>
                          {activeUnits.length === 0 ? (
                            <>
                              <th className={styles.thPlaceholder}>{t('calculator.perWave')}</th>
                              <th className={styles.thPlaceholder}>{t('calculator.total')}</th>
                            </>
                          ) : (
                            <>
                              {activeUnits.map((u) => (
                                <th key={`${u.unitId}-pw`} className={styles.thPerWave}>{getUnitName(tribeName, u.unitId)} {t('calculator.perWave')}</th>
                              ))}
                              {activeUnits.map((u) => (
                                <th key={`${u.unitId}-tot`}>{getUnitName(tribeName, u.unitId)} {t('calculator.total')}</th>
                              ))}
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(boundary.start, boundary.start + boundary.count).map((row, sliceIdx) => {
                          const i = boundary.start + sliceIdx
                          const covered = hasBudget ? rowCoverage[i] : undefined
                          const isCutoff = hasBudget && !covered && (i === 0 || rowCoverage[i - 1])
                          return (
                            <tr
                              key={i}
                              className={
                                covered === true ? styles.rowCovered
                                  : covered === false ? `${styles.rowUncovered}${isCutoff ? ` ${styles.rowCutoff}` : ''}`
                                  : undefined
                              }
                            >
                              <td className={styles.tdLeft}>{row.target.name}</td>
                              {showPopulation && <td>{row.target.population}</td>}
                              <td>{row.target.distance}</td>
                              <td>{formatTime(row.travelTimeMin)}</td>
                              <td>{formatTime(row.roundTripMin)}</td>
                              <td>{row.wavesNeeded}</td>
                              {activeUnits.length === 0 ? (
                                <>
                                  <td className={styles.cellPlaceholder}>—</td>
                                  <td className={styles.cellPlaceholder}>—</td>
                                </>
                              ) : (
                                <>
                                  {activeUnits.map((u) => {
                                    const defaultPw = u.count
                                    const over = isOverridden(i, u.unitId)
                                    const pw = getPerWave(i, u.unitId)
                                    return (
                                      <td key={`${u.unitId}-pw`} className={over ? styles.tdOverridden : undefined}>
                                        <input
                                          className={`${styles.cellInput} ${over ? styles.cellInputOverridden : ''}`}
                                          type="number"
                                          min={0}
                                          value={pw}
                                          onChange={(e) => setPerWaveOverride(i, u.unitId, Number(e.target.value))}
                                          title={over ? `${t('calculator.defaultPerWave')} ${defaultPw}` : t('calculator.clickToOverride')}
                                        />
                                      </td>
                                    )
                                  })}
                                  {activeUnits.map((u) => (
                                    <td key={`${u.unitId}-tot`} className={isOverridden(i, u.unitId) ? styles.tdTotalOverridden : undefined}>
                                      {getRowTotal(i, u.unitId)}
                                    </td>
                                  ))}
                                </>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className={styles.totalRow}>
                          <td className={styles.tdLeft}>{t('calculator.total')}</td>
                          {showPopulation && <td></td>}
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          {activeUnits.length === 0 ? (
                            <td colSpan={2} className={styles.totalCell}>{t('calculator.totalNoUnits')}</td>
                          ) : (
                            <>
                              {activeUnits.map((u) => (<td key={`${u.unitId}-pw`}></td>))}
                              {activeUnits.map((u) => (<td key={`${u.unitId}-tot`} className={styles.totalCell}>{listTotals[listIdx]?.[u.unitId] ?? 0}</td>))}
                            </>
                          )}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}

              {listBoundaries.length > 1 && (
                <div className={styles.totalAllSection}>
                  <h3 className={styles.listHeading}>{t('calculator.totalAllLists')}</h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <tfoot>
                        <tr className={styles.totalRow}>
                          <td className={styles.tdLeft}>{t('calculator.total')}</td>
                          {showPopulation && <td></td>}
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          {activeUnits.length === 0 ? (
                            <td colSpan={2} className={styles.totalCell}>{t('calculator.totalNoUnits')}</td>
                          ) : (
                            <>
                              {activeUnits.map((u) => (<td key={`${u.unitId}-pw`}></td>))}
                              {activeUnits.map((u) => (<td key={`${u.unitId}-tot`} className={styles.totalCell}>{totals[u.unitId] ?? 0}</td>))}
                            </>
                          )}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              <div className={styles.summary}>
                {hasBudget && (
                  <div className={`${styles.summaryItem} ${styles.coverageCard}`}>
                    <span className={styles.summaryLabel}>{t('calculator.targetsCoveredLabel')}</span>
                    <span className={styles.summaryValue}>{coveredCount} <span className={styles.summaryFraction}>/ {rows.length}</span></span>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${rows.length > 0 ? (coveredCount / rows.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{t('calculator.totalTroopsNeeded')}</span>
                  <span className={styles.summaryValue}>{grandTotal}</span>
                </div>
                {activeUnits.map((u) => (
                  <div key={u.unitId} className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>{getUnitName(tribeName, u.unitId)}</span>
                    <span className={styles.summaryValue}>{totals[u.unitId] ?? 0}</span>
                    {hasBudget && (
                      <span className={styles.summaryAvailable}>
                        {(availableTroops[u.unitId] ?? 0) >= (totals[u.unitId] ?? 0)
                          ? <span className={styles.summaryEnough}>&#10003; {availableTroops[u.unitId] ?? 0} {t('calculator.available')}</span>
                          : <span className={styles.summaryShort}>&#10007; {availableTroops[u.unitId] ?? 0} / {totals[u.unitId] ?? 0}</span>
                        }
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
