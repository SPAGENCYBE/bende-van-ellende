# Bende van ellende: van map tot app op de tablets

Reken op ongeveer 30 minuten. Je hebt een Google-account nodig (voor Firebase) en je GitHub-account.

Wat zit er in deze map:

| Bestand | Waarvoor |
|---|---|
| `index.html` | De app zelf |
| `firebase-config.js` | Hier plak je de gegevens van je Firebase-project (stap 2) |
| `firestore.rules` | De beveiligingsregels voor de database (stap 4) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Maken er een installeerbare app van die ook zonder wifi opstart |

---

## Stap 0: eerst even proberen (2 minuten)

Dubbelklik op `index.html`. De app opent in je browser in **demo-modus** met voorbeeldgezin Papa, Mama, Lotte en Wout. Alles wat je daar doet blijft alleen op dat toestel. Speel gerust wat rond.

---

## Stap 1: Firebase-project maken

1. Ga naar **console.firebase.google.com** en log in met je Google-account.
2. Klik op **Project maken** (of *Add project*). Naam: `bende-van-ellende`.
3. Google Analytics mag uit. Klik op **Project maken**.

Het gratis Spark-abonnement is ruim genoeg voor een gezin. Je hoeft geen betaalgegevens in te vullen.

## Stap 2: de app koppelen

1. Klik op de projectpagina op het **web-icoon `</>`** ("Een app toevoegen").
2. Bijnaam: `Bende tablet`. Firebase Hosting hoef je **niet** aan te vinken.
3. Je krijgt een blok code met `const firebaseConfig = { apiKey: ..., ... }`.
4. Open `firebase-config.js` en vervang `firebase: null,` door die gegevens, zo:

```js
window.BVE_CONFIG = {
  firebase: {
    apiKey: "AIza...",
    authDomain: "bende-van-ellende.firebaseapp.com",
    projectId: "bende-van-ellende",
    storageBucket: "bende-van-ellende.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
  },
  familyEmail: "bende@jouwdomein.be"
};
```

Die gegevens zijn geen geheim. De beveiliging zit in het wachtwoord (stap 3) en de regels (stap 4).

## Stap 3: het gezinsaccount

Het hele gezin deelt één account. Je logt er één keer mee in op elke tablet.

1. Ga links naar **Build → Authentication** en klik op **Aan de slag**.
2. Kies bij *Sign-in method* **E-mail/wachtwoord** en zet het aan. Opslaan.
3. Ga naar het tabblad **Users** en klik op **Gebruiker toevoegen**. Vul een e-mailadres in (het mag een bestaand adres van jou zijn) en een sterk gezinswachtwoord.
4. In de lijst zie je nu een **User UID** (een lange code). **Kopieer die**, je hebt hem nodig in stap 4.
5. Zet hetzelfde e-mailadres bij `familyEmail` in `firebase-config.js`. Dan hoeft je gezin alleen het wachtwoord te typen.
6. Extra veilig (aanrader): ga naar **Settings → User actions** en zet **Enable create (sign-up)** uit. Dan kan niemand anders een account aanmaken.

## Stap 4: de database

1. Ga naar **Build → Firestore Database** en klik op **Database maken**.
2. Locatie: kies **europe-west1 (België)**. Kies **productiemodus**.
3. Open het tabblad **Regels** (*Rules*), wis alles en plak de inhoud van `firestore.rules`.
4. Vervang `PLAK-HIER-DE-UID` door de UID uit stap 3. Klik op **Publiceren**.

## Stap 5: online zetten met GitHub Pages

1. Maak op GitHub een nieuwe repository, bijvoorbeeld `bende-van-ellende`. Zet hem op **Public** (GitHub Pages is gratis voor publieke repositories; zonder het gezinswachtwoord ziet niemand je gegevens).
2. Klik op **Add file → Upload files** en sleep **alle bestanden en de map `icons`** uit deze map erin. Klik op **Commit changes**.
3. Ga naar **Settings → Pages**. Bij *Source* kies je **Deploy from a branch**, branch **main**, map **/ (root)**. Opslaan.
4. Na een minuutje staat de app op `https://JOUWNAAM.github.io/bende-van-ellende/`.
5. Voor de zekerheid: zet in Firebase bij **Authentication → Settings → Authorized domains** het adres `JOUWNAAM.github.io` erbij.

## Stap 6: installeren op de tablets

Open het adres uit stap 5 op elke tablet.

- **Android (Chrome):** tik op de knop **App installeren** bovenaan in de app, of in het menu ⋮ op **App installeren**.
- **iPad (Safari):** tik op het **Deel-icoon** (vierkantje met pijl) en kies **Zet op beginscherm**.

Daarna:
1. Open de app via het nieuwe icoon met de paarse B.
2. Log één keer in met het gezinswachtwoord.
3. Kies **Wie ben jij?**. Op een tablet die van iedereen is kies je **Iedereen**.

Begin op één tablet bij **De bende** en voeg de echte gezinsleden toe. Op de andere tablets verschijnen ze meteen.

---

## Handig om te weten

- **Babbels:** de gezinschat. Tik op een bericht om met een emoji te reageren of het op het prikbord te zetten. Vastgezette berichten staan ook op het overzicht en in de muurstand. Een rood bolletje bij Babbels toont hoeveel nieuwe berichten er zijn.
- **Muurstand:** knop bovenaan. Grote klok, de dag van vandaag, taken en het avondeten. Het scherm blijft aan zolang de muurstand open staat.
- **Vegen:** veeg op een tablet of gsm naar links of rechts om tussen de onderdelen te wisselen.
- **Zonder wifi:** de app start op en je ziet de laatste gegevens. Wat je afvinkt, wordt verstuurd zodra er weer verbinding is.
- **Punten:** taken met punten geven sterren aan wie de taak heeft. Bij **De bende** zet je punten op nul als ze ingewisseld zijn.
- **Instellingen per tablet** (wie, geluid, afmelden) staan onderaan bij **De bende**.

## Een nieuwe versie zetten

Vervang de bestanden in je GitHub-repository. Verhoog in `sw.js` het versienummer (`bende-v1` wordt `bende-v2`). De tablets halen de nieuwe versie op wanneer ze de app opnieuw openen.

## Lukt iets niet?

| Wat je ziet | Oplossing |
|---|---|
| "E-mail of wachtwoord klopt niet" | Controleer de gebruiker in Authentication → Users. Wachtwoord vergeten? Stel daar een nieuw in. |
| "Geen toegang tot de gegevens" | De UID in de Firestore-regels klopt niet. Kopieer hem opnieuw (stap 3) en publiceer de regels. |
| "Geen verbinding" bij opstarten | Controleer of `firebase-config.js` correct is ingevuld (komma's en aanhalingstekens). |
| Geen knop "App installeren" | Werkt alleen via `https://` (dus via GitHub Pages, niet door het bestand te openen). Op iPad gaat het altijd via Delen. |
| Nog de demo met Papa, Mama, Lotte en Wout | `firebase-config.js` staat nog op `firebase: null`. |

---

## Google Agenda koppelen

1. Ga naar **script.google.com** met het Google-account waarin jullie agenda's staan. Klik op **Nieuw project** en geef het de naam `Bende agenda`.
2. Wis de code in `Code.gs` en plak de inhoud van `google-agenda-koppeling.gs`. Klik op het diskette-icoon om op te slaan.
3. Kies bovenaan de functie **testen** en klik op **Uitvoeren**. Geef toegang: kies je account, klik op **Geavanceerd** en daarna op **Ga naar Bende agenda (onveilig)** en **Toestaan**. Het is je eigen script; die waarschuwing is normaal. Onderaan zie je nu de gevonden agenda's.
4. Klik rechtsboven op **Implementeren → Nieuwe implementatie**. Kies bij het tandwiel **Web-app**. Zet *Uitvoeren als* op **Ik** en *Wie heeft toegang* op **Iedereen**. Klik op **Implementeren** en kopieer de **web-app-URL** (eindigt op `/exec`).
5. Open de app, ga naar **De bende → Deze tablet → Google Agenda → Koppelen** en plak de link. Eén keer is genoeg voor alle toestellen.

Elke Google-agenda hoort bij het gezinslid met dezelfde naam. Een agenda met "menu" in de naam vult het weekmenu. Andere agenda's gelden voor iedereen.
Behandel de web-app-link als een wachtwoord: wie hem heeft, kan jullie afspraken zien.
