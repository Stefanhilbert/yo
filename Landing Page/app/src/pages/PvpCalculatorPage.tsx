import { TroopCalculator } from '../components/TroopCalculator/TroopCalculator.tsx'
import { useTranslation } from '../i18n/index.ts'

export function PvpCalculatorPage() {
  const { t } = useTranslation()
  return (
    <TroopCalculator
      mode="pvp"
      title={t('tools.pvpCalculator')}
      showPopulation
    />
  )
}
