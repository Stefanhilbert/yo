import { useTranslation } from '../i18n/index.ts'
import styles from './HowToPage.module.css'

export function HowToPage() {
  const { t } = useTranslation()
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{t('howTo.title')}</h1>
        <p className={styles.p}>
          {t('howTo.intro')}
        </p>
      </header>

      <section className={styles.panel}>
        <h2 className={styles.h2}>{t('howTo.step1')}</h2>
        <ul className={styles.ul}>
          <li>{t('howTo.step1Li1')}</li>
          <li>{t('howTo.step1Li2')}</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.h2}>{t('howTo.step2')}</h2>
        <ol className={styles.ol}>
          <li>
            {t('howTo.step2Li1')} <code>chrome://extensions</code>
          </li>
          <li>{t('howTo.step2Li2')}</li>
          <li>{t('howTo.step2Li3')}</li>
          <li>{t('howTo.step2Li4')}</li>
        </ol>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.h2}>{t('howTo.step3')}</h2>
        <ul className={styles.ul}>
          <li>{t('howTo.step3Li1')}</li>
          <li>
            {t('howTo.step3Li2')} <code>chrome://extensions</code> {t('howTo.step3Li3')} <strong>Reload</strong>
          </li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.h2}>{t('howTo.troubleshooting')}</h2>
        <ul className={styles.ul}>
          <li>{t('howTo.troubleLi1')}</li>
          <li>{t('howTo.troubleLi2')}</li>
        </ul>
      </section>
    </div>
  )
}

