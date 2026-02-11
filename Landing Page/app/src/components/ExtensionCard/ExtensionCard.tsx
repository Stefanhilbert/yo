import { Link } from 'react-router-dom'
import type { ExtensionInfo } from '../../types/extensions.ts'
import { useTranslation } from '../../i18n/index.ts'
import styles from './ExtensionCard.module.css'

export function ExtensionCard({ ext }: { ext: ExtensionInfo }) {
  const { t } = useTranslation()

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <Link to={`/extensions/${ext.slug}`} className={styles.headLink}>
          {ext.icon48 ? <img className={styles.icon} src={ext.icon48} alt="" /> : <span className={styles.iconFallback} />}
          <span className={styles.title}>{ext.name}</span>
        </Link>
        <div className={styles.badgeRow}>
          <span className={styles.badge}>{t('extensions.beta')}</span>
          <span className={styles.badge}>v{ext.version}</span>
        </div>
      </div>

      <div className={styles.expanded}>
        {ext.description ? <p className={styles.expandedDesc}>{ext.description}</p> : null}
        <Link to={`/extensions/${ext.slug}`} className={styles.viewDetailsLink}>
          {t('extensions.viewDetails')}
        </Link>
      </div>
    </div>
  )
}
