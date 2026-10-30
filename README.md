# PMJ 4D – v0.2

En liten Trimble Connect-extension för 3D-visaren. Den testar de tre saker som avgör om hela idén håller:

1. Kan appen **läsa** PMJ-biblioteket *Rakennusosan Status* via Trimbles Property Set API?
2. Kan appen **färga modellen** efter *Kokoonpanon Status*?
3. Kan appen **skriva** status och datum på flera markerade objekt samtidigt?

Själva 4D-tidslinjen ingår inte än. Den bygger vi när de här tre fungerar.

## Filer

| Fil | Vad |
|---|---|
| `manifest.json` | Beskriver extensionen för Connect. **Byt `DITT-GITHUB-NAMN`.** |
| `index.html` | Panelen |
| `app.js` | All logik |
| `icon.svg`, `logo.png` | Ikon och PMJ-logga |

## 1. Lägg upp på GitHub Pages (gratis, ca 5 min)

1. Skapa ett publikt repo som heter `pmj-4d` på github.com.
2. Ladda upp filerna (Add file → Upload files).
3. Gå till Settings → Pages → *Deploy from a branch* → `main` / `root` → Save.
4. Efter någon minut ligger appen på `https://DITT-GITHUB-NAMN.github.io/pmj-4d/`.
5. Redigera `manifest.json` och byt `DITT-GITHUB-NAMN` på tre ställen.

## 2. Installera i Connect

1. Öppna projektet i Trimble Connect för webben.
2. Lägg till en egen extension med manifest-URL:en `https://DITT-GITHUB-NAMN.github.io/pmj-4d/manifest.json`. Den finns under projektinställningarna, antingen *Extensions* eller *Apps & Capabilities → Add Custom*, beroende på Connect-version.
3. Slå på den och öppna en modell i 3D-visaren. Panelen *PMJ 4D* ska dyka upp.
4. Godkänn när Connect frågar om åtkomst. Då blir *Token* grön.

## 3. Användning

Panelen har två flikar och en kugghjulsknapp (⚙). FI/SV-knappen växlar språk.

**Första gången (⚙ Inställningar)** öppnas inställningarna automatiskt.
1. Klistra in bibliotekets ID och klicka *Ladda*. ID:t hittar du i adressfältet när du öppnar *PMJ master library V2.0* i Property Set Manager. *Rakennusosan Status* och *Kokoonpanon Status* väljs då automatiskt.
2. Sätt status för hand på **ett** objekt i Connect, markera det och klicka *Hitta från markerat objekt*. Appen räknar ut hur Connect kopplar property sets till objekt.
3. Klicka *Klar*. Inställningarna sparas i webbläsaren.

**Översikt:** *Uppdatera* färgar modellen efter status och visar antal per status. Klicka på ett statuskort för att dölja eller visa just de objekten.

**Fyll i:** Markera objekt i 3D, klicka på en status och lägg eventuellt till ett datum. Utan bocken *Spara på riktigt* blir det en provkörning, och anropen visas under *Felsökning*. Med bocken sparas värdena och modellen färgas om. Testa gärna på en kopia av projektet först.

Om något går fel: öppna *Felsökning*, klicka *Kopiera logg* och klistra in loggen till Claude.

## Kända osäkerheter (det spiket ska avgöra)

- **Token:** Fungerar Connects access token direkt mot PSet API:t? Om inte får du ett 401-fel i loggen.
- **CORS:** Tillåter PSet API:t anrop från github.io? Om inte får du ett "Nätverks-/CORS-fel" i loggen och behöver en liten proxy.
- **Region:** Projekt i EU bör använda `eu-west-1`. Om biblioteket inte hittas, testa den äldre globala adressen.
- **Länkformat:** Om mallen fortfarande innehåller ett långt fil-ID måste vi kontrollera om ID:t ändras när modellen laddas upp i en ny version.
- **Datumformat:** Appen följer formatet på befintliga värden, och loggen visar exakt vad som skickas.
- **Visa objektets egenskaper:** Syns PMJ-fälten redan där kan vi läsa dem direkt från viewern, vilket är enklare.

Tidigare bekräftat: bara användare med redigeringsrätt och Innovate-, Business Premium- eller högre licens kan ändra property sets.
