import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel sets VERCEL=1 at build time. Expose so we can hide Pricing/Extensions only on Vercel.
  define: {
    'import.meta.env.VITE_VERCEL': JSON.stringify(process.env.VERCEL === '1'),
  },
})
