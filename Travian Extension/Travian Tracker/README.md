# Travian Tracker

Chrome-extension der tracker map.sql, finder spillere uden vækst og hjælper med at undgå duplikater i farm lister.

## Installation

1. Åbn `chrome://extensions/`
2. Slå "Udviklertilstand" til
3. Klik "Indlæs uudpakket" og vælg mappen `Travian Tracker`

## Brugen

- **Popup**: Indtast server-URL (f.eks. `https://ts30.x3.international.travian.com`), klik "Scan nu". Sidste scan og næste planlagte scan vises.
- **Indstillinger** (højreklik på ikonet → Indstillinger):
  - **Server URL** og **Scan-tider**: 6 tidspunkter per dag (standard hver 4. time).
  - **Mine koordinater**: Én pr. linje (fx `-54 200`). Bruges til afstand og kandidater. "Brug aktiv by fra fane" kræver at en Travian-fane er aktiv.
  - **Vækst**: Vælg "Sammenlign med (dage siden)" og klik "Opdater" for at se vækst/minus-vækst per spiller.
  - **Kandidater**: Angiv "Antal dage (X)", klik "Find kandidater" for spillere med ingen eller negativ vækst. Sorter/filtrér efter afstand, population, stamme, radius. "Åbn X nye links" åbner links i batches (rate-limited). "Opdater fra farm list" fjerner targets der allerede står i din farm list fra listen.
  - **Eksport/Import**: Gem eller indlæs kandidatlisten som JSON/CSV.
  - **Farm list – fjern duplikater**: Åbn farm list-siden i en fane, klik "Scan farm lists" for at se antal unikke targets og duplikater.

## Krav

- map.sql skal være tilgængeligt på `{serverBaseUrl}/map.sql` (typisk offentlig på Travian-servere).
- Farm list-scan og "Opdater fra farm list" kræver at du har farm list-siden åben i den aktive fane.

## Bemærkninger

- **Farm list og DOM**: Farm list-scan og "Opdater fra farm list" læser koordinater fra siden (content script). Hvis Travian ændrer deres side-struktur (HTML/CSS), kan det være nødvendigt at opdatere extensionen (content script-selectors) for at det fortsat virker.
- **Map link-format**: Standard er `position_details?x=…&y=…`. Hvis din server bruger en anden URL-struktur (fx `karte.php`), kan du ændre "Map link-format" i indstillinger under Server URL.
