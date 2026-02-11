import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { useTranslation } from '../i18n/index.ts'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  const { t } = useTranslation()
  const err = useRouteError()
  const msg = isRouteErrorResponse(err) ? `${err.status} ${err.statusText}` : t('notFound.pageNotFound')

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.h1}>{msg}</h1>
        <p className={styles.p}>{t('notFound.description')}</p>
        <Link to="/" className={styles.btn}>
          {t('notFound.home')}
        </Link>
      </div>
    </div>
  )
}

