import { Link } from 'react-router-dom'
import type { ExtensionInfo } from '../../types/extensions.ts'
import { useTranslation } from '../../i18n/index.ts'
import styles from './UpdatesBlock.module.css'

function UpdateCard({ ext }: { ext: ExtensionInfo }) {
  const { t } = useTranslation()
  const latest = ext.latestRelease

  return (
    <Link to={`/extensions/${ext.slug}`} className={styles.card}>
      <div className={styles.head}>
        {ext.icon48 ? <img className={styles.icon} src={ext.icon48} alt="" /> : <span className={styles.iconFallback} />}
        <div className={styles.meta}>
          <span className={styles.title}>{ext.name}</span>
          <span className={styles.badge}>v{ext.version}</span>
        </div>
      </div>
      {latest?.date ? (
        <div className={styles.date}>{latest.date}</div>
      ) : null}
      {latest?.changes?.length ? (
        <ul className={styles.changes}>
          {latest.changes.slice(0, 3).map((c, idx) => (
            <li key={idx}>{c}</li>
          ))}
        </ul>
      ) : (
        <div className={styles.noChanges}>{t('extensions.noChangelog')}</div>
      )}
    </Link>
  )
}

export function UpdatesBlock({ extensions }: { extensions: ExtensionInfo[] }) {
  const { t } = useTranslation()
  const items = [...extensions]
    .sort((a, b) => (b.latestRelease?.date ?? '').localeCompare(a.latestRelease?.date ?? ''))
    .slice(0, 3)

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.h2}>{t('extensions.latestUpdates')}</h2>
        <Link to="/extensions" className={styles.all}>
          {t('extensions.allExtensions')}
        </Link>
      </div>
      <div className={styles.grid}>
        {items.map((ext) => (
          <UpdateCard key={ext.slug} ext={ext} />
        ))}
      </div>
    </div>
  )
}
