# Travian Oasis Scanner

Chrome extension that assists with finding and filtering oases with animals near your villages. Scans oases in the visible map view automatically – only oases within radius and in your current view are counted.

## Install

1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this folder

## Use

1. Open Travian and go to the map (karte.php)
2. Click the extension icon to open the side panel
3. Click "Opdater byer" to load your villages from the sidebar
4. Set max radius (e.g. 15 felter) – only oases within radius **and** in the visible view are shown
5. Click "Scan synlige oaser" to find oases in the current map view (or scroll – auto-scan runs on map changes)
6. Use "Hent detaljer (troops)" to fetch troops/bonus for oases without full data (simulates clicks)
7. Or click on oases manually – the extension detects the dialog and saves each oasis
8. Filter by bonus (Lumber, Clay, Iron, Crop), empty vs. with animals
9. Click "Gå til" to center the map on an oasis
10. Use "Kopier" to copy coordinates, "Skjul" to hide oases you have raided

## Features

- **Instant scan** – finds oases in the visible map view (only within radius and view)
- Auto-updates when you scroll/pan/zoom the map
- Parses oases when you click them (manual or via "Hent detaljer")
- Sorts by distance to your active village
- Filter by bonus type (supports double bonuses like Iron+Crop)
- Filter empty oases vs. oases with animals
- Max radius filter
- Copy coordinates to clipboard
- Export to CSV
- Mark/hide oases you have raided

## Supported Travian domains

- travian.com
- travian.dk
- travian.de
- international.travian.com
