import React from 'react'
import type { Tribe } from '../types/extensions.ts'
import { getCursorsForTribe } from '../lib/cursors.ts'
import { loadTribe, saveTribe } from '../lib/tribe.ts'

type TribeContextValue = {
  tribe: Tribe
  setTribe: (tribe: Tribe) => void
}

const TribeContext = React.createContext<TribeContextValue | undefined>(undefined)

function applyTribeToCssVars(tribe: Tribe) {
  const { cursorDefault, cursorPointer } = getCursorsForTribe(tribe)
  const root = document.documentElement
  root.style.setProperty('--cursor-default', cursorDefault)
  root.style.setProperty('--cursor-pointer', cursorPointer)
  root.setAttribute('data-tribe', tribe)
}

export function TribeProvider({ children }: { children: React.ReactNode }) {
  const [tribe, setTribeState] = React.useState<Tribe>(() => loadTribe())

  React.useEffect(() => {
    applyTribeToCssVars(tribe)
    saveTribe(tribe)
  }, [tribe])

  const value = React.useMemo<TribeContextValue>(
    () => ({
      tribe,
      setTribe: setTribeState,
    }),
    [tribe],
  )

  return <TribeContext.Provider value={value}>{children}</TribeContext.Provider>
}

export function useTribe() {
  const ctx = React.useContext(TribeContext)
  if (!ctx) throw new Error('useTribe must be used within TribeProvider')
  return ctx
}

