import { TroopCalculator } from '../components/TroopCalculator/TroopCalculator.tsx'
import { useTranslation } from '../i18n/index.ts'

export function TroopCalculatorPage() {
  const { t } = useTranslation()
  return (
    <TroopCalculator
      mode="pve"
      title={t('tools.pveCalculator')}
      showBudget
    />
  )
}
