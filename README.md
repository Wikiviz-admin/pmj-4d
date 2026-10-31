# PMJ 4D – v1.3

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

**Ingen inställning behövs normalt.** När panelen öppnas gör appen följande:
1. Den läser projekt och region från Connect.
2. Den hämtar projektets property set-bibliotek från Trimbles Organizer-tjänst och väljer det bibliotek som innehåller *Rakennusosan Status*. Om flera gör det väljs det senast ändrade, till exempel *PMJ master library V2.0*.
3. Den räknar ut länkformatet genom att jämföra modellens element med de element som redan har ett värde.

Allt sparas per projekt i webbläsaren. ⚙ öppnas bara om något inte kunde hittas. Det händer främst i ett helt nytt projekt där inget element har status ännu. Sätt då status för hand på ett element i Connect och klicka *Hitta från markerat objekt*. Länkformatet gäller sedan för alla projekt.

**Översikt:** *Uppdatera* färgar modellen efter status och visar antal per status. Klicka på ett statuskort för att dölja eller visa just de objekten.

**Fyll i:** Markera objekt i 3D, klicka på en status och lägg eventuellt till ett datum. Utan bocken *Spara på riktigt* blir det en provkörning, och anropen visas under *Felsökning*. Med bocken sparas värdena och modellen färgas om. Testa gärna på en kopia av projektet först.

**Datum:** När du väljer en status som har ett eget datumfält visas det fältet med dagens datum ifyllt:
- PIIRUSTUS OK → *Piirustukset Lähetetty*
- VALMISTETTU → *Valmistuspäivämäärä*
- ASENNETTU → *Asennuspäivämäärä*

Låter du dagens datum stå kvar fylls det bara i där fältet är tomt. Väljer du ett annat datum, till exempel i går, skrivs det på alla markerade element. Töm fältet om du inte vill skriva något datum alls. *Suunniteltu Asennuspäivä* har ett eget fält, och *Suunniteltu Asennusviikko* räknas ut automatiskt.

**Penselläge:** Välj en status och klicka på 🖌. Därefter sparas statusen på varje element du klickar på i 3D, och elementet färgas direkt. Klicka på knappen igen för att stänga penselläget. Ett element som redan har penslats skrivs inte igen under samma penseldrag.

**4D:** En veckoremsa visar planerade monteringar (ljusblått) och verkliga monteringar (grönt) vecka för vecka. Klicka på en vecka, använd ‹ › eller piltangenterna, eller tryck *Spela upp*.
- *Montage:* monterade element visas gröna, försenade röda (planerat datum har passerat men elementet är inte monterat) och kommande döljs. Byggnaden växer alltså fram vecka för vecka.
- *Hela kedjan:* visar hur långt varje element har kommit vid veckans slut: ritningar skickade (cyan), tillverkat (mörkblått), monterat (grönt) eller ej påbörjat (grått).
- Element utan PMJ-data visas ljusgrå som bakgrund.

**Infokortet** är fäst längst ner i panelen och visar det markerade elementet, även om man klickat på en del:
- Produktnamnet (t.ex. *Seinäelementti*) och under det elementnumret. Som standard hämtas numret från *Tekla Assembly › Assembly/Cast unit Mark*.
- Statusen som ett färgat märke.
- Upp till 5 små kort med valfria PMJ-fält och modellegenskaper. Ifyllda datum visas med ✓ och datum, och planerat datum visas med veckonummer.
- Markerar man flera element visas antal per status.
- ⚙ i kortet: välj vilken modellegenskap elementnumret hämtas från (listan visar egenskaperna för det markerade elementet), och vilka kort som visas. Valen sparas i webbläsaren.

**Kortet som egen extension (test):** Samma app kan köras som ett litet kort utanför panelen, eftersom en webbsida inte kan rita utanför sin egen ruta i Connect. Två manifest finns att prova:
- `manifest-kortti.json` – placering `properties` (i Connects egenskapspanel, höjd 300 px)
- `manifest-kortti-popover.json` – placering `popover` (troligen ett flytande fönster)

Byt `DITT-GITHUB-NAMN` i filerna och lägg till dem som egna extensions med samma steg som huvudmanifestet. Kortet visas bara när något är markerat.

**Element och delar:** Appen läser modellens struktur: behållare (projekt, byggnad, våningar), element (Teklas cast unit) och elementens delar.
- Färg och synlighet sätts bara på delarna, alltså det man ser. Element och behållare rörs aldrig, eftersom Connect annars döljer allt under dem.
- Varje del visar sin egen sparade status om den har en, annars elementets status och annars standardvärdet.
- Korten räknar de objekt som bestämmer statusen, i praktiken elementen.
- Appen sparar alltid på elementet, även om man markerat en del. Status som tidigare sparats på delnivå visas fortfarande, och Felsökning varnar för den.

**Standardvärde:** Element som aldrig fått ett sparat värde räknas som bibliotekets standardvärde (ODOTTAA), precis som Connect visar dem. Länkmallen är modelloberoende (`{fileId}`), så flera IFC-filer och nya modellversioner fungerar.

Om något går fel: öppna *Felsökning*, klicka *Kopiera logg* och klistra in loggen till Claude.

## Kända osäkerheter (det spiket ska avgöra)

- **Token:** Fungerar Connects access token direkt mot PSet API:t? Om inte får du ett 401-fel i loggen.
- **CORS:** Tillåter PSet API:t anrop från github.io? Om inte får du ett "Nätverks-/CORS-fel" i loggen och behöver en liten proxy.
- **Region:** Projekt i EU bör använda `eu-west-1`. Om biblioteket inte hittas, testa den äldre globala adressen.
- **Länkformat:** Om mallen fortfarande innehåller ett långt fil-ID måste vi kontrollera om ID:t ändras när modellen laddas upp i en ny version.
- **Datumformat:** Appen följer formatet på befintliga värden, och loggen visar exakt vad som skickas.
- **Visa objektets egenskaper:** Syns PMJ-fälten redan där kan vi läsa dem direkt från viewern, vilket är enklare.

Tidigare bekräftat: bara användare med redigeringsrätt och Innovate-, Business Premium- eller högre licens kan ändra property sets.
