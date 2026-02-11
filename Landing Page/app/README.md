# Travian Extensions – Landing Page (Vite + React)

Dette er landing-siden til repo’et, bygget som en Vite+React app med:
- Navigation: Home, Extensions (dropdown + oversigt), How-to
- Tribe-dropdown der skifter cursor-ikon (Romer/Galler/Germaner)
- Versionering + “Latest updates” baseret på extension manifests + changelogs

## Krav
- Node.js + npm

## Kør lokalt

```bash
cd "Landing Page/app"
npm install
npm run dev
```

Åbn derefter den URL Vite viser (typisk `http://localhost:5173`).

**Note (Windows / Vite):** Hvis din projektmappe indeholder `#` (fx `Y#O`), kan Vite fejle i dev mode. Løsning: omdøb mappen til fx `Y_O` eller flyt repo’et til en sti uden `#`.

## Build

```bash
cd "Landing Page/app"
npm run build
npm run preview
```

## Versionering & updates (hvordan det virker)
Dataen til UI’et genereres automatisk fra extension-mapperne:
- `Travian Extension/**/manifest.json` (version, navn, description, icons)
- `Travian Extension/**/CHANGELOG.md` (seneste ændringer)

Generatoren ligger her:
- `scripts/syncExtensionsData.mjs`

Den kører automatisk før `dev` og `build` via `predev` / `prebuild`, men kan også køres manuelt:

```bash
npm run sync:data
```

### Når du udgiver en ny version af en extension
1. Opdatér `version` i extensionens `manifest.json` (fx `1.1.0`)
2. Tilføj en ny øverste sektion i extensionens `CHANGELOG.md`:

```md
## [1.1.0] - 2026-02-08
- ...
```

3. Kør `npm run sync:data` (eller start dev serveren)

