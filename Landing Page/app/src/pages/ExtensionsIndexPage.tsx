import { extensionsData } from '../lib/extensionsData.ts'
import { ExtensionCard } from '../components/ExtensionCard/ExtensionCard.tsx'
import { useTranslation } from '../i18n/index.ts'
import styles from './ExtensionsIndexPage.module.css'

export function ExtensionsIndexPage() {
  const { t } = useTranslation()
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{t('extensions.title')}</h1>
        <p className={styles.p}>
          {t('extensions.intro')}
        </p>
      </header>
      <div className={styles.grid}>
        {extensionsData.extensions.map((ext) => (
          <ExtensionCard key={ext.slug} ext={ext} />
        ))}
      </div>
    </div>
  )
}

