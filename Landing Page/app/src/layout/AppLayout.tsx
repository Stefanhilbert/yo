import { Outlet, ScrollRestoration, Link } from 'react-router-dom'
import { Header } from '../components/Header/Header.tsx'
import { showFullNav } from '../lib/env.ts'
import { useTranslation } from '../i18n/index.ts'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { t } = useTranslation()
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerBrandName}>{t('footer.brand')}</span>
            <p className={styles.footerTagline}>{t('footer.built')}</p>
          </div>
          <nav className={styles.footerNav} aria-label="Footer">
            <Link to="/" className={styles.footerLink}>{t('nav.home')}</Link>
            {showFullNav && (
              <>
                <Link to="/extensions" className={styles.footerLink}>{t('nav.extensions')}</Link>
                <Link to="/how-to" className={styles.footerLink}>{t('nav.howTo')}</Link>
                <Link to="/pricing" className={styles.footerLink}>{t('nav.pricing')}</Link>
              </>
            )}
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span className={styles.footerCopy}>© {new Date().getFullYear()} {t('footer.brand')}</span>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  )
}

