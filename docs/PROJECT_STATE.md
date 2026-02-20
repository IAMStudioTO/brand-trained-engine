# Brand-Trained Engine — PROJECT STATE (dettagliato)

Ultimo aggiornamento: 2026-02-19 (UTC)

---

## 1) Obiettivo MVP (scope attuale)
MVP orientato a **immagini statiche** e a un primo setup tecnico “cloud-first”.

Focus iniziale (deciso):
- SOLO **formato 1:1**
- **4 varianti/layout** semplici (strutturalmente diversi, grafica minima)
- Infrastruttura: designer → asset/layout → generazione controllata (AI dopo)

In questa fase abbiamo costruito soprattutto:
- Base repository + deploy
- Frontend live
- Backend live
- Connessione frontend ↔ backend in produzione

---

## 2) Architettura live (oggi)

### Frontend
- Framework: Next.js (App Router)
- Directory: `apps/web`
- Hosting: Vercel
- URL produzione: https://brand-trained-engine-web.vercel.app

### Backend API
- Runtime: Node (Express)
- Directory: `apps/api`
- Hosting: Render (Web Service, piano Free)
- URL produzione: https://brand-trained-engine.onrender.com
- Endpoint health: `GET /health` → `{"ok":true}`

### Comunicazione Frontend ↔ Backend
- Il frontend chiama l’API tramite variabile ambiente:
  - `NEXT_PUBLIC_API_BASE_URL=https://brand-trained-engine.onrender.com`
- Pagina di test:
  - `https://brand-trained-engine-web.vercel.app/api-test`
  - deve mostrare `{"ok":true}`

---

## 3) Repo & struttura progetto

Repo GitHub:
- https://github.com/IAMStudioTO/brand-trained-engine

Struttura:
- `apps/web`  → Next.js
- `apps/api`  → Express API
- `packages/shared` → creato come placeholder (non ancora usato)
- `docs/` → documentazione e stato progetto

---

## 4) Deploy & CI/CD (come funziona)
### Vercel
- Collegato al repo GitHub
- Root directory impostata su: `apps/web`
- Deploy automatico su push/commit del branch di produzione (attualmente `main`)
- Nota: `dev` era usato come preview deployment, poi abbiamo portato le modifiche su `main` per aggiornare Production.

### Render
- Web Service collegato al repo GitHub
- Root directory: `apps/api`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`
- Deploy automatico su push/commit su `main`

---

## 5) Variabili ambiente (stato attuale)
### Vercel (Project: brand-trained-engine-web)
- `NEXT_PUBLIC_API_BASE_URL = https://brand-trained-engine.onrender.com`

### Render
- `PORT` viene gestita da Render (log: `API listening on port 10000`), l’app usa:
  - `process.env.PORT || 3001`

---

## 6) Endpoint e pagine create
### API (apps/api)
- `GET /health` → `{"ok":true}`
- CORS:
  - Inizialmente mancava (browser bloccava richieste cross-origin da Vercel)
  - Risolto impostando **header CORS manuali** in Express

### Web (apps/web)
- Home page minimale: “Brand-Trained Engine™”
- Pagina test API:
  - route: `/api-test`
  - mostra risultato del fetch a `${NEXT_PUBLIC_API_BASE_URL}/health`

---

## 7) Problemi incontrati e risolti (importantissimo per memoria progetto)

### 7.1 Vercel deployava “main” mentre lo sviluppo era su “dev”
- Sintomo: su dominio production vedevamo ancora pagina Next di default
- Soluzione: merge `dev → main` e push su main (Production aggiornata)

### 7.2 API test in produzione falliva (“Error connecting to API”)
Cause principali (risolte in sequenza):
1) Il frontend puntava a `http://localhost:3001/health` (non valido da Vercel)
   - Soluzione: introdotta variabile `NEXT_PUBLIC_API_BASE_URL`
2) CORS non configurato nell’API
   - Soluzione finale: header CORS manuali in `apps/api/src/index.js`

### 7.3 Incolla comandi nel terminale (EOF) a volte “sporca” i file
- In più punti i blocchi `cat << EOF` sono stati interrotti
- Soluzione operativa adottata: controllare file via `sed/cat` e, quando serve, sistemare da GitHub editor o riscrivere pulito

---

## 8) Commit (riferimenti utili)
Nota: elenco indicativo basato sulla sessione.
- `add5d5d` — init monorepo structure
- `3dd3245` — add Next.js web app
- `2e46df5` — set MVP landing title (dev)
- `86b0032` — trigger deploy from dev (test)
- `efef302` — add minimal API service
- `63093ff` — commit non correlato (solo package-lock) dovuto a incolla errata
- `1ad38ad` — aggiunta `api-test/page.tsx` via GitHub (poi pull)
- `deb1a84` — variabile env base URL / cambi su api-test
- `880d8b9` — enable CORS (prima iterazione)
- `ae14728` — manual CORS headers (risoluzione definitiva)
- `54b0410` — aggiornamenti api-test per mostrare stato (debug)

---

## 9) Stato attuale (checklist “tutto verde”)
✅ Repo in cloud (GitHub)  
✅ Frontend live su Vercel  
✅ Backend live su Render  
✅ `/health` risponde da Render  
✅ Frontend /api-test riceve `{"ok":true}` in produzione  
✅ CORS risolto  

---

## 10) Cosa manca (next steps “veri” per il prodotto)
Questa parte è ciò che serve per passare da “infrastruttura” a “Brand-Trained Engine”.

### Prossimi step consigliati (ordine suggerito)
1) Stabilizzare “salva” (comando) e introdurre storico automatico in `docs/PROJECT_HISTORY.md`
2) Definire modello dati minimo (anche senza DB inizialmente):
   - Brand
   - LayoutTemplate (1:1, 4 layout)
   - Palette (anche solo 1 per MVP)
3) Endpoint API reali:
   - `POST /generate` (stub iniziale) → ritorna payload JSON finto (headline + image placeholder)
4) Rendering engine lato server (anche versione 0):
   - Generare PNG 1080x1080 da layout JSON + asset
5) Integrazione Figma (dopo che il rendering base è stabile):
   - Export layout semanticamente strutturato
6) Solo dopo: AI (testi + immagini) con prompt controllati

---

## 11) Regola operativa (per riprendere dopo chiusura chat)
Quando riparti con me in una nuova chat:
- mi incolli il contenuto di questo file `docs/PROJECT_STATE.md`
- e se usi anche lo storico: `docs/PROJECT_HISTORY.md`
Così riparto esattamente dal punto giusto.
