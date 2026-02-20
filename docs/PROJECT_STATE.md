# Brand-Trained Engine — PROJECT STATE (dettagliato)

Ultimo aggiornamento: 2026-02-19 (UTC)

---

## 1) Stato Infrastruttura

### Repository
- Monorepo GitHub: brand-trained-engine
- Struttura:
  - apps/web (Next.js frontend)
  - apps/api (Express API)
  - packages/shared (placeholder)

---

## 2) Frontend (Vercel)

- Framework: Next.js 16 (App Router)
- Root directory: apps/web
- Deploy automatico su branch main
- URL produzione:
  https://brand-trained-engine-web.vercel.app

### Pagine attive
- `/` → Landing minimale “Brand-Trained Engine™”
- `/api-test` → Test connessione API

---

## 3) Backend API (Render)

- Runtime: Node + Express
- Root directory: apps/api
- Piano: Free
- URL produzione:
  https://brand-trained-engine.onrender.com

### Endpoint attivi
GET /health
→ {"ok": true}

CORS: abilitato manualmente con header:
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods
- Access-Control-Allow-Headers

---

## 4) Connessione Frontend ↔ Backend

Variabile ambiente su Vercel:

NEXT_PUBLIC_API_BASE_URL=https://brand-trained-engine.onrender.com

La pagina /api-test ora mostra correttamente:

{"ok":true}

---

## 5) Problemi Risolti

1. Deploy Vercel aggiornava solo main (dev era preview)
2. API inizialmente puntava a localhost
3. CORS non configurato → browser bloccava chiamate
4. Header CORS manuali implementati → problema risolto

---

## 6) Stato Attuale

✔ Frontend live
✔ Backend live
✔ Comunicazione funzionante
✔ Deploy automatici attivi
✔ Struttura monorepo stabile

---

## 7) Prossimo Step Tecnico

Creare endpoint:

POST /generate

che ritorni JSON stub tipo:

{
  "headline": "Sample Headline",
  "imageUrl": "placeholder.png"
}

Poi costruire il primo layout 1:1 generato server-side.
