# Travian Extensions

Chrome-extensions til Travian (travian.com, travian.dk, travian.de, international.travian.com). De tre extensions er uafhængige og kan bruges sammen eller hver for sig.

---

## YOFarmer (Travian Farmer)

**Hvad den gør:** Sender farm lister med menneskelig timing. Du kan køre alle lister eller kun valgte, med tilfældige forsinkelser mellem klik. Auto-tilstand gentager sending efter konfigurerbare intervaller. Du kan linke en fane til extensionen, så auto sender til den fane uanset hvilken fane du har aktiv. Taktikker kan tildeles enkelte farm lister (base-minutter og randomisering per liste).

**Brug:** Log ind på Travian og åbn farm list-siden. Klik på YOFarmer-ikonet: "Send nu" sender med det samme; "Auto" gentager med interval. I indstillinger kan du opdatere lister, vælge taktikker og linke farm list-fanen.

**Risiko og anbefalinger:** Travian kan logge session og adfærd. For at reducere risiko: undgå 24/7 kørsel, brug samme browser som ved normalt spil, og overvej store intervaller (fx preset Lav). "Simuler mus" er valgfri og hjælper ikke nødvendigvis mod avancerede systemer.

---

## Travian Oasis Scanner

**Hvad den gør:** Finder og filtrerer oaser med dyr tæt på dine byer. Scanner kun oaser inden for den valgte radius og inden for det synlige kort. Opdaterer automatisk når du scroller/panorer på kortet. Du kan filtrere efter bonus (træ, ler, jern, korn), tomme oaser vs. oaser med dyr, og sortere efter afstand. Koordinater kan kopieres, eksporteres til CSV, og oaser du har røvet kan markeres/skjules.

**Brug:** Åbn Travian og gå til kortet. Klik på extension-ikonet for at åbne side panelet. "Opdater byer" henter dine byer fra sidebaren. Sæt max radius og klik "Scan synlige oaser" (eller lad auto-scan køre ved kortændring). Brug "Hent detaljer" for at hente tropper/bonus på oaser, eller klik oaser manuelt – extensionen genkender dialogen og gemmer. Filtrér og brug "Gå til", "Kopier" eller "Skjul" efter behov.

---

## Travian Tracker

**Hvad den gør:** Tracker map.sql fra din server (6 scans per dag, konfigurerbare tidspunkter). Viser vækst og minus-vækst per spiller over valgte antal dage. Finder kandidater: spillere uden vækst eller med minus-vækst over X dage. Du kan sortere og filtrere kandidater (afstand, population, stamme, radius, kun 1 by, alliance), bulk-åbne map-links (rate-limited), og synkronisere med din farm list så targets der allerede står i farm list fjernes fra listen. Farm list kan også scannes for at se antal unikke targets og duplikater. Eksport/import af kandidatlisten som JSON/CSV.

**Brug:** I popup: indtast server-URL (fx `https://ts30.x3.international.travian.com`) og klik "Scan nu". I indstillinger: sæt scan-tider, dine koordinater, vækst-tabel (Opdater), kandidater (Find kandidater, Åbn X links, Opdater fra farm list), og evt. Farm list – fjern duplikater.

**Krav:** map.sql skal være tilgængeligt på `{serverBaseUrl}/map.sql`. Farm list-scan og "Opdater fra farm list" kræver at du har farm list-siden åben i en fane.

---

## Installation (fælles)

1. Åbn **Chrome** → `chrome://extensions`
2. Slå **Udviklertilstand** til
3. Klik **Indlæs uudpakket**
4. Vælg den ønskede mappe under `Travian Extension/`:
   - **Travian Farmer** → mappen `Travian Farmer`
   - **Travian Oasis Scanner** → mappen `Travian Oasis Scanner`
   - **Travian Tracker** → mappen `Travian Tracker`

Du kan installere én eller flere extensions – de påvirker ikke hinanden.

---

## Detaljeret dokumentation

Hver extension har sin egen README med flere detaljer:

- [Travian Farmer (YOFarmer)](Travian%20Farmer/README.md)
- [Travian Oasis Scanner](Travian%20Oasis%20Scanner/README.md)
- [Travian Tracker](Travian%20Tracker/README.md)
