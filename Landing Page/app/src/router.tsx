import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { ExtensionsIndexPage } from './pages/ExtensionsIndexPage.tsx'
import { ExtensionDetailPage } from './pages/ExtensionDetailPage.tsx'
import { HowToPage } from './pages/HowToPage.tsx'
import { TroopCalculatorPage } from './pages/TroopCalculatorPage.tsx'
import { PvpCalculatorPage } from './pages/PvpCalculatorPage.tsx'
import { PricingPage } from './pages/PricingPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { showFullNav } from './lib/env.ts'

/** Renders children only when full nav (extensions/pricing) is enabled; otherwise redirect to home. Used to hide /pricing and /extensions on Vercel. */
function RequireFullNav({ children }: { children: React.ReactNode }) {
  if (!showFullNav) return <Navigate to="/" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'extensions', element: <RequireFullNav><ExtensionsIndexPage /></RequireFullNav> },
      { path: 'extensions/:slug', element: <RequireFullNav><ExtensionDetailPage /></RequireFullNav> },
      { path: 'how-to', element: <HowToPage /> },
      { path: 'pricing', element: <RequireFullNav><PricingPage /></RequireFullNav> },
      { path: 'tools', element: <Navigate to="/tools/pve-calculator" replace /> },
      { path: 'tools/pve-calculator', element: <TroopCalculatorPage /> },
      { path: 'tools/troop-calculator', element: <Navigate to="/tools/pve-calculator" replace /> },
      { path: 'tools/pvp-calculator', element: <PvpCalculatorPage /> },
    ],
  },
])
