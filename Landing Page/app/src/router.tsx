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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'extensions', element: <ExtensionsIndexPage /> },
      { path: 'extensions/:slug', element: <ExtensionDetailPage /> },
      { path: 'how-to', element: <HowToPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'tools', element: <Navigate to="/tools/pve-calculator" replace /> },
      { path: 'tools/pve-calculator', element: <TroopCalculatorPage /> },
      { path: 'tools/troop-calculator', element: <Navigate to="/tools/pve-calculator" replace /> },
      { path: 'tools/pvp-calculator', element: <PvpCalculatorPage /> },
    ],
  },
])
