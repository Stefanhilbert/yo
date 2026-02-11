import { useParams, Link } from 'react-router-dom'
import { getExtensionBySlug } from '../lib/extensionsData.ts'
import { useTranslation } from '../i18n/index.ts'
import styles from './ExtensionDetailPage.module.css'

const FALLBACK_INSTALL_FOLDER: Record<string, string> = {
  yofarmer: 'Travian Extension/Travian Farmer',
  'oasis-scanner': 'Travian Extension/Travian Oasis Scanner',
  tracker: 'Travian Extension/Travian Tracker',
  'interval-timer': 'Travian Extension/Interval Timer',
}

export function ExtensionDetailPage() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const ext = slug ? getExtensionBySlug(slug) : undefined

  if (!slug || !ext) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.h1}>{t('extensionDetail.notFound')}</h1>
          <p className={styles.p}>
            {t('extensionDetail.notFoundDesc')} <code>{slug ?? '(missing slug)'}</code>. <Link to="/extensions">{t('extensionDetail.backToExtensions')}</Link>.
          </p>
        </div>
      </div>
    )
  }

  const installFolder = ext.installFolder ?? FALLBACK_INSTALL_FOLDER[ext.slug] ?? 'Travian Extension/<Extension Folder>'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {ext.icon128 ? <img className={styles.icon} src={ext.icon128} alt="" /> : null}
          <div>
            <h1 className={styles.h1}>{ext.name}</h1>
            <div className={styles.meta}>
              <span className={styles.badge}>{t('extensionDetail.beta')}</span>
              <span className={styles.badge}>v{ext.version}</span>
              {ext.description ? <span className={styles.desc}>{ext.description}</span> : null}
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Link to="/how-to" className={styles.linkBtn}>
            {t('extensionDetail.installGuide')}
          </Link>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.h2}>{t('extensionDetail.install')}</h2>
          <ol className={styles.ol}>
            <li>
              {t('extensionDetail.installLi1')} <code>chrome://extensions</code> {t('extensionDetail.installLi2')}
            </li>
            <li>{t('extensionDetail.installLi3')}</li>
            <li>{t('extensionDetail.installLi4')}</li>
            <li>
              {t('extensionDetail.installLi5')} <code>{installFolder}</code>
            </li>
          </ol>
          <p className={styles.small}>
            {t('extensionDetail.installNote')} <code>chrome://extensions</code> {t('extensionDetail.installNote2')}
          </p>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.h2}>{t('extensionDetail.latestUpdate')}</h2>
          {ext.latestRelease?.changes?.length ? (
            <>
              <div className={styles.releaseMeta}>
                <span className={styles.releaseBadge}>v{ext.latestRelease.version}</span>
                {ext.latestRelease.date ? <span className={styles.releaseDate}>{ext.latestRelease.date}</span> : null}
              </div>
              <ul className={styles.ul}>
                {ext.latestRelease.changes.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className={styles.pMuted}>{t('extensionDetail.noChangelogYet')}</p>
          )}
        </section>

        {ext.slug === 'yofarmer' ? (
          <section className={styles.panel}>
            <h2 className={styles.h2}>{t('extensionDetail.yofarmerSafety.sectionTitle')}</h2>
            <ul className={styles.ul}>
              <li><strong>{t('extensionDetail.yofarmerSafety.simulateMouse')}</strong> — {t('extensionDetail.yofarmerSafety.simulateMouseDesc')}</li>
              <li><strong>{t('extensionDetail.yofarmerSafety.onlyWhenTabVisible')}</strong> — {t('extensionDetail.yofarmerSafety.onlyWhenTabVisibleDesc')}</li>
              <li><strong>{t('extensionDetail.yofarmerSafety.maxRunsPerHour')}</strong> — {t('extensionDetail.yofarmerSafety.maxRunsPerHourDesc')}</li>
              <li><strong>{t('extensionDetail.yofarmerSafety.minDelayBetweenRuns')}</strong> — {t('extensionDetail.yofarmerSafety.minDelayBetweenRunsDesc')}</li>
              <li><strong>{t('extensionDetail.yofarmerSafety.confirmBeforeSend')}</strong> — {t('extensionDetail.yofarmerSafety.confirmBeforeSendDesc')}</li>
              <li><strong>{t('extensionDetail.yofarmerSafety.pauseOnCaptcha')}</strong> — {t('extensionDetail.yofarmerSafety.pauseOnCaptchaDesc')}</li>
              <li><strong>{t('extensionDetail.yofarmerSafety.soundOnSend')}</strong> — {t('extensionDetail.yofarmerSafety.soundOnSendDesc')}</li>
              <li><strong>{t('extensionDetail.yofarmerSafety.notificationOnSend')}</strong> — {t('extensionDetail.yofarmerSafety.notificationOnSendDesc')}</li>
              <li><strong>{t('extensionDetail.yofarmerSafety.timeWindow')}</strong> — {t('extensionDetail.yofarmerSafety.timeWindowDesc')}</li>
              <li><strong>{t('extensionDetail.yofarmerSafety.extraRandomDelay')}</strong> — {t('extensionDetail.yofarmerSafety.extraRandomDelayDesc')}</li>
            </ul>
          </section>
        ) : null}
      </div>

      <section className={styles.panelWide}>
        <h2 className={styles.h2}>{t('extensionDetail.changelog')}</h2>
        {ext.releases?.length ? (
          <div className={styles.releases}>
            {ext.releases.map((r) => (
              <details key={r.version} className={styles.release} open={r.version === ext.latestRelease?.version}>
                <summary className={styles.summary}>
                  <span className={styles.summaryLeft}>
                    <span className={styles.releaseBadge}>v{r.version}</span>
                    {r.date ? <span className={styles.releaseDate}>{r.date}</span> : null}
                  </span>
                  <span className={styles.summaryHint}>{t('extensionDetail.show')}</span>
                </summary>
                <ul className={styles.ul}>
                  {r.changes.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        ) : (
          <p className={styles.pMuted}>{t('extensionDetail.noChangelogFound')} <code>CHANGELOG.md</code> {t('extensionDetail.noChangelogFound2')}</p>
        )}
      </section>
    </div>
  )
}

