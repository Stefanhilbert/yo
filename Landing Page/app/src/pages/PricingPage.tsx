import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/index.ts'
import styles from './PricingPage.module.css'

const FREE_KEYS = ['pricing.freeFeature1', 'pricing.freeFeature2', 'pricing.freeFeature3', 'pricing.freeFeature4'] as const
const PREMIUM_KEYS = ['pricing.premiumFeature1', 'pricing.premiumFeature2', 'pricing.premiumFeature3', 'pricing.premiumFeature4', 'pricing.premiumFeature5', 'pricing.premiumFeature6'] as const

export function PricingPage() {
  const { t } = useTranslation()
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>{t('pricing.title')}</h1>
      <p className={styles.subtitle}>
        {t('pricing.subtitle')}
      </p>

      <div className={styles.cards}>
        <div className={styles.card}>
          <h2 className={styles.tierName}>{t('pricing.free')}</h2>
          <div className={styles.priceRow}>
            <span className={styles.price}>0&euro;</span>
            <span className={styles.period}>{t('pricing.perMonth')}</span>
          </div>

          <ul className={styles.featureList}>
            {FREE_KEYS.map((key) => (
              <li key={key} className={styles.featureItem}>
                <span className={styles.check}>&#10003;</span>
                {t(key)}
              </li>
            ))}
          </ul>

          <Link to="/extensions" className={`${styles.cta} ${styles.ctaFree}`}>
            {t('pricing.getStarted')}
          </Link>
        </div>

        <div className={`${styles.card} ${styles.featured}`}>
          <span className={styles.badge}>{t('pricing.mostPopular')}</span>
          <h2 className={styles.tierName}>{t('pricing.premium')}</h2>
          <div className={styles.priceRow}>
            <span className={styles.price}>2.98&euro;</span>
            <span className={styles.period}>{t('pricing.perMonth')}</span>
          </div>

          <ul className={styles.featureList}>
            {PREMIUM_KEYS.map((key) => (
              <li key={key} className={styles.featureItem}>
                <span className={`${styles.check} ${styles.featuredCheck}`}>&#10003;</span>
                {t(key)}
              </li>
            ))}
          </ul>

          <button className={`${styles.cta} ${styles.ctaPremium}`}>
            {t('pricing.upgrade')}
          </button>
        </div>
      </div>
    </div>
  )
}
