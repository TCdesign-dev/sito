# Original User Request

## 2026-06-28T17:35:24Z

Ottimizzare e perfezionare l'esperienza mobile del portfolio 3D (sistema solare), garantendo visibilità assoluta e interazioni touch fluide da smartphone.

Working directory: /Users/tommasocostanza/Documents/antigravity/sharp-newton
Integrity mode: development

## Requirements

### R1. Visibilità e Resizing del Canvas 3D
Il canvas 3D del sistema solare deve avere un'altezza corretta e garantita su schermi verticali (mobile). Non deve subire glitch dovuti alla comparsa/scomparsa della barra degli indirizzi di Safari iOS o Chrome Mobile.

### R2. Interazioni Touch (Swipe e Tap)
Le interazioni touch devono essere reattive e naturali: 
- L'utente deve poter ruotare l'universo (orbit controls) in modo fluido.
- Il "tap" su un pianeta o una luna deve essere intercettato con precisione, senza falsi positivi durante lo scroll o lo swipe.

### R3. Framing della Telecamera e UI
Quando si seleziona un pianeta da telefono, la telecamera deve inquadrarlo in modo tale che non venga coperto dalla bottom-sheet (il popup con i dettagli del progetto). La UI e il canvas 3D devono coesistere senza sovrapporsi in modo fastidioso.

## Acceptance Criteria

### Rendering e Stabilità
- [ ] Ricaricando la pagina in modalità portrait (verticale) o landscape (orizzontale) da simulatore mobile, la scena 3D occupa lo spazio corretto.

### Usabilità Touch
- [ ] Uno swipe sullo schermo ruota la scena senza far partire click accidentali sui pianeti.
- [ ] Un tap volontario su un pianeta avvia lo zoom in modo corretto.

### UI Mobile
- [ ] A pianeta selezionato, la bottom-sheet si apre dal basso ma lascia il pianeta perfettamente visibile e centrato nella parte superiore dello schermo.
