import type { Tribe } from '../types/extensions.ts'

function svgToCursor(svg: string, hotspotX: number, hotspotY: number) {
  // Keep it URL-encoded so it works in CSS cursor().
  const encoded = encodeURIComponent(svg)
  return `url("data:image/svg+xml,${encoded}") ${hotspotX} ${hotspotY}`
}

function makeRomanSword() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M16 2 L18 6 L18 18 L20 22 L16 30 L12 22 L14 18 L14 6 Z" fill="#d8d0c2" stroke="#2b1b14" stroke-width="1.2" />
  <rect x="9" y="10.5" width="14" height="3" rx="1" fill="#b08b55" stroke="#2b1b14" stroke-width="1.2"/>
  <rect x="14.2" y="13.2" width="3.6" height="10" rx="1.4" fill="#6b3a22" stroke="#2b1b14" stroke-width="1.2"/>
</svg>`.trim()
}

function makeGaulSword() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M13 3 C18 7, 20 12, 19 18 C18.2 22.2 16.8 25.5 15.5 29 L12.5 28 C14 24.5 15.2 21.8 16 18.2 C17.1 12.9 15.7 9 11 6 Z" fill="#d8d0c2" stroke="#2b1b14" stroke-width="1.2" />
  <path d="M9 10.8 L23 10.8 L23 13.8 L9 13.8 Z" fill="#c96b3c" stroke="#2b1b14" stroke-width="1.2"/>
  <path d="M13.8 13.5 L18.2 13.5 L18.2 23.2 C18.2 24.7 17 26 15.5 26 C14.1 26 13 24.8 13 23.4 Z" fill="#6b3a22" stroke="#2b1b14" stroke-width="1.2"/>
</svg>`.trim()
}

function makeTeutonClub() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M10 23 C11 17, 14 10, 18 6 C19.5 4.6 21.7 5.2 22.4 7 C23 8.6 22.5 10.8 21.2 12.3 C18 16 16 20 15 26 Z" fill="#8b5a2b" stroke="#2b1b14" stroke-width="1.2"/>
  <path d="M18 4.6 C22.2 2.4 26.8 5.2 27.2 9.6 C27.6 13.6 24.5 17 20.7 16.8 C17.2 16.6 14.4 13.4 14.9 9.6 C15.2 7.4 16.3 5.6 18 4.6 Z" fill="#5b3620" stroke="#2b1b14" stroke-width="1.2"/>
  <circle cx="21.5" cy="9.5" r="1.2" fill="#2b1b14"/>
  <circle cx="24.2" cy="10.2" r="1.0" fill="#2b1b14"/>
  <circle cx="20.2" cy="12.3" r="1.0" fill="#2b1b14"/>
</svg>`.trim()
}

function makeHunAxe() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M8 28 L10 18 L14 8 L16 4 L18 8 L22 18 L24 28 L16 30 Z" fill="#8b7355" stroke="#2b1b14" stroke-width="1.2"/>
  <ellipse cx="16" cy="6" rx="4" ry="2.5" fill="#5b3620" stroke="#2b1b14" stroke-width="1.2"/>
  <path d="M12 10 L20 10 L22 22 L10 22 Z" fill="#c96b3c" stroke="#2b1b14" stroke-width="1.2"/>
  <path d="M14 12 L18 12 L18 20 L14 20 Z" fill="#8b4513" stroke="#2b1b14" stroke-width="0.8"/>
</svg>`.trim()
}

function makeEgyptianKhopesh() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M18 2 L20 6 L20 14 L24 20 L22 28 L18 30 L16 26 L14 30 L10 28 L8 20 L12 14 L12 6 Z" fill="#c9b896" stroke="#2b1b14" stroke-width="1.2"/>
  <path d="M14 8 L18 8 L18 18 L16 22 L14 18 Z" fill="#b08b55" stroke="#2b1b14" stroke-width="1"/>
  <circle cx="16" cy="4" r="1.2" fill="#d4a84b"/>
</svg>`.trim()
}

export function getCursorsForTribe(tribe: Tribe) {
  const svg =
    tribe === 'roman'
      ? makeRomanSword()
      : tribe === 'gaul'
        ? makeGaulSword()
        : tribe === 'teuton'
          ? makeTeutonClub()
          : tribe === 'hun'
            ? makeHunAxe()
            : tribe === 'egyptian'
              ? makeEgyptianKhopesh()
              : makeRomanSword()

  // Hotspot near the “handle” so it feels like a pointer.
  const base = svgToCursor(svg, 6, 6)

  return {
    cursorDefault: base,
    cursorPointer: base,
  }
}

