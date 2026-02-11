/** Shown locally; hidden on Vercel (Vercel sets VERCEL=1 at build time). Override: VITE_HIDE_EXTENSIONS=true to hide elsewhere. */
export const showFullNav =
  import.meta.env.VITE_VERCEL !== true && import.meta.env.VITE_HIDE_EXTENSIONS !== 'true'
