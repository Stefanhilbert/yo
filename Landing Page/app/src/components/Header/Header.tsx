import { useState, useRef, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { extensionsData } from '../../lib/extensionsData.ts'
import { useTribe } from '../TribeProvider.tsx'
import { useTranslation } from '../../i18n/index.ts'
import type { Tribe } from '../../types/extensions.ts'
import styles from './Header.module.css'

const TRIBES: Tribe[] = ['roman', 'gaul', 'teuton', 'hun', 'egyptian']

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

export function Header() {
  const { setTribe } = useTribe()
  const { t, setLocale } = useTranslation()
  const [localeOpen, setLocaleOpen] = useState(false)
  const [tribeOpen, setTribeOpen] = useState(false)
  const localeWrapRef = useRef<HTMLDivElement>(null)
  const tribeWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (localeOpen && localeWrapRef.current && !localeWrapRef.current.contains(target)) setLocaleOpen(false)
      if (tribeOpen && tribeWrapRef.current && !tribeWrapRef.current.contains(target)) setTribeOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setLocaleOpen(false)
        setTribeOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [localeOpen, tribeOpen])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandText}>{t('footer.brand')}</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? styles.active : styles.link)}>
            {t('nav.home')}
          </NavLink>

          <div className={styles.dropdownWrap}>
            <NavLink
              to="/extensions"
              className={({ isActive }) => (isActive ? styles.active : styles.link)}
            >
              {t('nav.extensions')}
            </NavLink>
            <div className={styles.dropdown} role="menu" aria-label={t('nav.extensions')}>
              {extensionsData.extensions.length === 0 ? (
                <span className={styles.dropdownEmpty}>{t('dropdown.emptyExtensions')}</span>
              ) : (
                extensionsData.extensions.map((ext) => (
                  <Link key={ext.slug} to={`/extensions/${ext.slug}`} className={styles.dropdownItem}>
                    <span className={styles.dropdownItemLeft}>
                      {ext.icon48 ? (
                        <img className={styles.icon} src={ext.icon48} alt="" />
                      ) : (
                        <span className={styles.iconFallback} aria-hidden="true" />
                      )}
                      <span className={styles.dropdownTitle}>{ext.name}</span>
                    </span>
                    <span className={styles.version}>v{ext.version}</span>
                  </Link>
                ))
              )}
              <Link to="/how-to" className={styles.dropdownItem}>
                <span className={styles.dropdownItemLeft}>
                  <span className={styles.toolIcon} aria-hidden="true">&#128196;</span>
                  <span className={styles.dropdownTitle}>{t('nav.howTo')}</span>
                </span>
              </Link>
            </div>
          </div>

          <div className={styles.dropdownWrap}>
            <NavLink
              to="/tools"
              className={({ isActive }) => (isActive ? styles.active : styles.link)}
            >
              {t('nav.onlineTools')}
            </NavLink>
            <div className={styles.dropdown} role="menu" aria-label={t('nav.onlineTools')}>
              <Link to="/tools/pve-calculator" className={styles.dropdownItem}>
                <span className={styles.dropdownItemLeft}>
                  <span className={styles.toolIcon} aria-hidden="true">&#9876;</span>
                  <span className={styles.dropdownTitle}>{t('tools.pveCalculator')}</span>
                </span>
              </Link>
              <Link to="/tools/pvp-calculator" className={styles.dropdownItem}>
                <span className={styles.dropdownItemLeft}>
                  <span className={styles.toolIcon} aria-hidden="true">&#9876;</span>
                  <span className={styles.dropdownTitle}>{t('tools.pvpCalculator')}</span>
                </span>
              </Link>
            </div>
          </div>

        </nav>

        <div className={styles.right}>
          <div className={styles.iconDropdownWrap} ref={localeWrapRef}>
            <button
              type="button"
              className={styles.iconTrigger}
              onClick={() => { setLocaleOpen((o) => !o); setTribeOpen(false); }}
              aria-label={t('locale.label')}
              aria-expanded={localeOpen}
              aria-haspopup="menu"
            >
              <GlobeIcon />
            </button>
            {localeOpen && (
              <div className={styles.iconDropdown} role="menu" aria-label={t('locale.label')}>
                <button type="button" role="menuitem" className={styles.iconDropdownItem} onClick={() => { setLocale('en'); setLocaleOpen(false); }}>
                  {t('locale.en')}
                </button>
                <button type="button" role="menuitem" className={styles.iconDropdownItem} onClick={() => { setLocale('da'); setLocaleOpen(false); }}>
                  {t('locale.da')}
                </button>
              </div>
            )}
          </div>
          <div className={styles.iconDropdownWrap} ref={tribeWrapRef}>
            <button
              type="button"
              className={styles.iconTrigger}
              onClick={() => { setTribeOpen((o) => !o); setLocaleOpen(false); }}
              aria-label={t('tribe.label')}
              aria-expanded={tribeOpen}
              aria-haspopup="menu"
            >
              <ShieldIcon />
            </button>
            {tribeOpen && (
              <div className={styles.iconDropdown} role="menu" aria-label={t('tribe.label')}>
                {TRIBES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="menuitem"
                    className={styles.iconDropdownItem}
                    onClick={() => { setTribe(id); setTribeOpen(false); }}
                  >
                    {t(`tribe.${id}`)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

