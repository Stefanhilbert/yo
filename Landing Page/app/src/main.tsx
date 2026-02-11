import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router.tsx'
import { LocaleProvider } from './components/LocaleProvider.tsx'
import { TribeProvider } from './components/TribeProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <TribeProvider>
        <RouterProvider router={router} />
      </TribeProvider>
    </LocaleProvider>
  </StrictMode>,
)
