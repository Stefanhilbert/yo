# YOFarmer – Chrome extension

Send Travian farm lists with human-like timing. Works on Travian (travian.com, travian.dk, travian.de, international.travian.com).

## Install

1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this folder (`YO_Farmer_Extension`)

## Icon (warrior)

To use the warrior icon you attached:

1. Copy your warrior image into this folder.
2. Resize it to **48×48** and save as `icons/48.png`.
3. Resize it to **128×128** and save as `icons/128.png`.

Chrome uses 48 for the toolbar and 128 for the extensions page. Any image editor or online tool can resize; you can use the same source image for both.

## Use

1. Log in to Travian in a normal tab and open the **farm list** page.
2. Click the YOFarmer icon and use:
   - **Send nu** – send now (all lists or only the ones you selected).
   - **Start alle lister** – if checked, sends all lists; if unchecked, show "Vælg lister" and use **Opdater lister** then tick the lists you want.
   - **Auto** – repeat sending every N minutes (uses the same choice: all lists or your selection).

Delays are randomized to mimic human behaviour. **Simuler mus** sends mouseenter/mousemove before each click (100–250 ms delay); it may help against simple detection but is not guaranteed against all anti-bot systems.

## Risiko og anbefalinger

- **Session/enhed:** Travian kan logge session, enhed og adfærd. Det kan extensionen ikke ændre. For at reducere risiko: undgå 24/7 kørsel, brug samme browser som ved normalt spil, og overvej store intervaller (fx preset Lav).
- **Simuler mus:** Syntetiske events har `isTrusted: false`; avancerede systemer kan skelne dem. Tjek "Simuler mus" er kun en valgfri forbedring.
