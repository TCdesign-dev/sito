# Audit del sito — tommasocostanza.space

Data: 2026-07-05 · Analisi statica del repository (HTML, CSS, JS, config Vercel, contenuti)

## 1. Cose ROTTE (da sistemare subito)

### 1.1 Le card della pagina Explorations portano tutte a un 404
`loadExplorations()` in `main.js` genera link del tipo `/explorations/<id>`
(es. `/explorations/type-experiments`), ma in `vercel.json` non esiste alcuna
rewrite per quel pattern: l'unica rotta è `/explorations` → `explorations.html`.
Risultato: **ogni card della pagina Explorations è un link rotto**.
La pagina progetto reale è `project.html?id=<id>`.

**Fix consigliato:** far puntare le card a `/project?id=<id>` oppure aggiungere
in `vercel.json` una rewrite tipo
`{ "source": "/:category/:id", "destination": "/project.html?id=:id" }`
(nota: con le rewrite Vercel il query param va mappato esplicitamente).

### 1.2 Il bottone "Contact me" non fa nulla
Su tutte le pagine il bottone ha `href="#"` e in `main.js` non esiste alcun
handler per `.contact-btn`. Chi vuole contattarti non ha modo di farlo.
**Fix:** `mailto:` o link a un form/pagina contatti.
Aggravante mobile: il footer è nascosto (`footer { display: none }` sotto 768px),
quindi **su mobile non c'è nessun modo di contattarti o trovare i tuoi profili**.

### 1.3 Immagine social (og:image) inesistente
Tutte le pagine dichiarano `og:image = /assets/preview.jpg`, ma il file
**non esiste** in `assets/`. Le condivisioni su WhatsApp/X/LinkedIn escono senza anteprima.

### 1.4 Immagine di "Type Experiments" rotta
`projects.json` referenzia `projects/images/type-preview.jpg`, ma il file su disco è
`type-preview.webp`. La preview del progetto non si carica (planet popup, pagina progetto).

### 1.5 Dati di test in produzione
In `projects.json` ci sono due voci palesemente di prova, visibili sul sito
(orbita Explorations e pagina Explorations):
- `"wqswswsw"` (2026, senza descrizione né preview)
- `"Nuovo Progetto"` (descrizione `"hgdfbdfgfd"`, colore `"orange"` che non esiste
  nella palette: `COLOR_MAP`/`PLANET_COLORS` supportano solo yellow/green/pink/blue)

### 1.6 Testo corrotto (encoding) in "Personal Website v2"
Il contenuto contiene mojibake: `minimalism ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ system fonts`
(era un em dash `—` salvato con doppia codifica UTF‑8).

### 1.7 Link Twitter/X placeholder
Il footer punta a `https://x.com` (homepage generica), non a un profilo.

### 1.8 Decap CMS non configurato / doppio admin
`admin/config.yml` contiene ancora `repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME`.
In realtà `admin/index.html` è un pannello custom basato su GitHub API, quindi il
config Decap è un residuo morto: **rimuoverlo** (o configurarlo, ma uno dei due).
Nota di sicurezza: il pannello `/admin` è pubblico e chiede un PAT GitHub salvato
in `localStorage` — funziona, ma valuta almeno un token fine-grained limitato al repo.

## 2. Cose che MANCANO

- **Sitemap**: nessuna `sitemap.xml` e `robots.txt` non la dichiara. Con un sito
  quasi tutto client-side rendered, aiuterebbe l'indicizzazione delle pagine progetto.
- **SEO pagine progetto**: `project.html` è generica; titolo/description/og vengono
  cambiati via JS dopo il load, quindi i crawler social vedono solo "Project detail".
  Con poche pagine, valuta la generazione statica delle pagine progetto (anche solo
  un piccolo script di build) o almeno meta più ricchi.
- **Structured data**: niente JSON-LD (`Person`, `CreativeWork`) — gratis per un portfolio.
- **Fallback senza WebGL/JS**: la home è vuota se WebGL fallisce; il fallback 2D
  esiste nel DOM (`#mobile-planet-list`) ma è **nascosto via CSS ovunque**
  (`display:none` sia sotto che sopra 768px) — di fatto codice morto. O lo usi come
  fallback `<noscript>`/no-WebGL, o lo togli.
- **Pagina/entità "projects.html"**: `loadProjectsGrid`, `loadLatestProjects`,
  `buildPostitCard`, `notFoundHtml` (che linka `projects.html`) riferiscono una
  pagina che non esiste più nel repo. ~150 righe di codice morto in `main.js`.
- **Tags**: le card post-it e il CMS prevedono `tags`, ma nessun progetto li ha.
- **Contenuti**: 2 progetti su 4 reali ("Creative Minds Archive" punta a
  `https://github.com` generico — altro placeholder). Il portfolio regge o cade sui contenuti.

## 3. Cose che MIGLIOREREI

### Performance
- **`Voyager.glb` (3,1 MB) è precaricato su TUTTE le pagine**, incluse
  `explorations.html` e `project.html` che non lo usano mai. Togliere il
  `<link rel="preload">` da quelle pagine; valutare compressione Draco/meshopt
  (probabile riduzione dell'80%+).
- `favicon.png` pesa 190 KB (512px) — comprimibile a pochi KB.
- Three.js **r128 (2021)** da CDN con i vecchi `examples/js` (OrbitControls,
  GLTFLoader legacy). Funziona, ma è una versione ferma a 4+ anni fa; se un giorno
  i CDN dismettono quei path, il sito 3D muore. Meglio ES modules + import map,
  o vendorizzare i file nel repo.
- `renderSystem3D`/`renderGalaxy3D` ricaricano le texture con `textureLoader.load`
  a ogni transizione invece di riusarle (cache manuale semplice).

### UX
- **Deep-linking**: il `pushState` è stato rimosso, quindi le viste categoria non
  hanno URL e il tasto "indietro" del browser esce dal sito invece di tornare alla galassia.
- L'intro (~6,7 s tra titolo + istruzioni) è lunga e non skippabile con un click:
  aggiungere "skip" o accorciare.
- L'etichetta centrale in vista sistema mostra `Design (Orbits: 3)` — il contatore
  di orbite è un dettaglio interno curioso ma criptico per un visitatore.
- La bio nell'header è nascosta quando si entra in una categoria ma su desktop non
  c'è alcun titolo di categoria (esiste solo `#mobile-category-title`).

### Coerenza / pulizia
- **Lingua incoerente**: `index.html` è `lang="en"`, `project.html` è `lang="it"`
  con contenuti in inglese e `alt="Anteprima progetto"` in italiano.
- Versioning incoerente: footer con `v3.0.0` su project/explorations ma non in home.
- Il commento di testa di `main.js` descrive funzioni che non esistono più
  (`applyWeatherTheme`, post-it board…): fuorviante per chi legge.
- File di lavoro committati nel repo pubblico: `.agents/` (29 cartelle),
  `PROJECT.md`, `TEST_INFRA.md`, `TEST_READY.md`. Da spostare/ignorare.
- `package.json` con nome autogenerato `sharp-newton`, senza script `test`
  (c'è Playwright configurato ma `npm test` fallisce di proposito): collegare
  `"test": "playwright test"`.
- Rewrite no-op in `vercel.json` (`/assets/(.*)` → `/assets/$1`, ecc.): rumore.
- Canonical di `project.html` punta a `…/project.html?id=` ma con `cleanUrls: true`
  quell'URL fa redirect 308 su `/project?id=` — meglio puntare direttamente all'URL pulito.

### Accessibilità
- Il popup mobile (`role="dialog"`) non gestisce il focus (nessun focus trap,
  focus non spostato all'apertura/chiusura).
- I bottoni screen-reader (`#sr-planet-list`) sono un'ottima idea — ma le card
  visibili restano inaccessibili da tastiera sul canvas (le label WebGL sono
  cliccabili ma non focusabili).
- `prefers-reduced-motion` non è rispettato: intro, orbite e tween girano comunque.

## 4. Priorità suggerite

1. Fix link Explorations (1.1) — funzionalità core rotta
2. Contact me + contatti su mobile (1.2)
3. Pulizia `projects.json`: voci di test, encoding, estensione immagine (1.4–1.6)
4. `preview.jpg` per le condivisioni social (1.3)
5. Alleggerire/eliminare il preload di Voyager.glb sulle pagine non-3D
6. Sitemap + link X reale + coerenza lingua
7. Pulizia codice morto e file di lavoro dal repo
