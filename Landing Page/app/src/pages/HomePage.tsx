import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { extensionsData } from '../lib/extensionsData.ts'
import { ExtensionCard } from '../components/ExtensionCard/ExtensionCard.tsx'
import { useTranslation } from '../i18n/index.ts'
import styles from './HomePage.module.css'

const TOOLS = [
  { path: '/tools/pve-calculator', titleKey: 'tools.pveCalculator' as const, descKey: 'tools.pveCalculatorDesc' as const },
  { path: '/tools/pvp-calculator', titleKey: 'tools.pvpCalculator' as const, descKey: 'tools.pvpCalculatorDesc' as const },
]

export function HomePage() {
  const { t } = useTranslation()
  const exts = extensionsData.extensions
  const quoteRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = quoteRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.25 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.h1}>
            {t('home.hero.title')}
          </h1>
          <p className={styles.subtitle}>
            {t('home.hero.subtitle')}
          </p>
          <div className={styles.ctas}>
            <Link to="/extensions" className={styles.primary}>
              {t('home.cta.browse')}
            </Link>
            <Link to="/how-to" className={styles.secondary}>
              {t('home.cta.howTo')}
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.page}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>{t('home.section.extensions')}</h2>
            <Link to="/extensions" className={styles.viewAll}>
              {t('home.viewAll')}
            </Link>
          </div>
          <div className={styles.cards}>
            {exts.map((ext) => (
              <ExtensionCard key={ext.slug} ext={ext} />
            ))}
          </div>
        </section>
      </div>

      <div className={styles.page}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>{t('home.section.onlineTools')}</h2>
            <Link to="/tools" className={styles.viewAll}>
              {t('home.viewAll')}
            </Link>
          </div>
          <div className={styles.cards}>
            {TOOLS.map((tool) => (
              <Link key={tool.path} to={tool.path} className={styles.toolCard}>
                <span className={styles.toolCardIcon} aria-hidden>&#9876;</span>
                <span className={styles.toolCardTitle}>{t(tool.titleKey)}</span>
                <p className={styles.toolCardDesc}>{t(tool.descKey)}</p>
                <span className={styles.toolCardCta}>{t('extensions.viewDetails')}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.quote}>
        <div className={styles.quoteOverlay} />
        <div
          ref={quoteRef}
          className={`${styles.quoteContent} ${visible ? styles.quoteVisible : ''}`}
        >
          <blockquote className={styles.blockquote}>
            {t('home.quote.text')}
          </blockquote>
          <p className={styles.quoteAuthor}>{t('home.quote.author')}</p>
        </div>
      </section>
    </>
  )
}
