#!/bin/bash
set -e

STATE="docs/PROJECT_STATE.md"

DATE="$(date -u +"%Y-%m-%d %H:%M:%SZ")"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
HEAD_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo none)"
CHANGED="$(git status --porcelain | sed 's/^.. //' || true)"

mkdir -p docs

# Riscrive PROJECT_STATE.md (non append)
cat > "$STATE" <<EOF
# Brand-Trained Engine — PROJECT STATE (auto-generated)

Last update (UTC): $DATE

## Repository
Branch: $BRANCH
HEAD: $HEAD_SHA

## Live URLs
Frontend (Vercel):
https://brand-trained-engine-web.vercel.app

API (Render):
https://brand-trained-engine.onrender.com

Health:
https://brand-trained-engine.onrender.com/health

API Test:
https://brand-trained-engine-web.vercel.app/api-test

## Current Changes
$(if [ -n "$CHANGED" ]; then echo "$CHANGED"; else echo "(no local changes)"; fi)

## Status Checklist
- Frontend live on Vercel
- Backend live on Render
- CORS enabled
- /health responding
- /api-test connected
EOF

git add -A

if git diff --cached --quiet; then
  echo "Niente da salvare."
  exit 0
fi

git commit -m "salva: $DATE"
git push

echo "✅ PROJECT_STATE aggiornato ($DATE)"
#!/bin/bash
set -e

STATE="docs/PROJECT_STATE.md"

WEB_URL="https://brand-trained-engine-web.vercel.app"
API_URL="https://brand-trained-engine.onrender.com"
REPO_URL="https://github.com/IAMStudioTO/brand-trained-engine"

DATE="$(date -u +"%Y-%m-%d %H:%M:%SZ")"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
HEAD_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo none)"

# Ultimi commit
LAST_COMMITS="$(git log -10 --pretty=format:'- %h %s' 2>/dev/null || true)"

# File modificati (working tree)
CHANGED="$(git status --porcelain | sed 's/^.. //' || true)"
if [ -z "$CHANGED" ]; then CHANGED="(no local changes)"; fi

# Detect: presenza feature nel repo (euristiche)
HAS_API_HEALTH=0
if [ -f "apps/api/src/index.js" ] && rg -n 'app\.get\("(/health|/healthz)"' apps/api/src/index.js >/dev/null 2>&1; then
  HAS_API_HEALTH=1
fi

HAS_CORS=0
if [ -f "apps/api/src/index.js" ] && rg -n 'Access-Control-Allow-Origin|cors\(' apps/api/src/index.js >/dev/null 2>&1; then
  HAS_CORS=1
fi

HAS_WEB_API_TEST=0
if [ -f "apps/web/src/app/api-test/page.tsx" ]; then
  HAS_WEB_API_TEST=1
fi

HAS_ENV_USAGE=0
if [ -f "apps/web/src/app/api-test/page.tsx" ] && rg -n 'NEXT_PUBLIC_API_BASE_URL' apps/web/src/app/api-test/page.tsx >/dev/null 2>&1; then
  HAS_ENV_USAGE=1
fi

HAS_API_GENERATE=0
if [ -f "apps/api/src/index.js" ] && rg -n 'app\.post\("(/generate|/render|/image)"' apps/api/src/index.js >/dev/null 2>&1; then
  HAS_API_GENERATE=1
fi

HAS_RENDER_LIB=0
if [ -f "package-lock.json" ]; then
  if rg -n '"sharp"' package-lock.json >/dev/null 2>&1 || rg -n '"canvas"' package-lock.json >/dev/null 2>&1; then
    HAS_RENDER_LIB=1
  fi
fi

# Links used: prendi URL noti + URL trovati nel repo (file tracciati)
LINKS="$(
  {
    echo "$WEB_URL"
    echo "$API_URL"
    echo "$API_URL/health"
    echo "$WEB_URL/api-test"
    echo "$REPO_URL"
  } | cat
)"

EXTRACTED_LINKS="$(git ls-files \
  | python3 - <<'PY'
import sys, re, pathlib
url_re = re.compile(r'https?://[^\s\)\]\}>"\'`]+')
links = set()
for line in sys.stdin:
    p = line.strip()
    if not p:
        continue
    try:
        text = pathlib.Path(p).read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue
    for m in url_re.findall(text):
        links.add(m.rstrip('.,;:'))
for u in sorted(links):
    print(u)
PY
)"

LINKS_ALL="$(printf "%s\n%s\n" "$LINKS" "$EXTRACTED_LINKS" \
  | sed '/^$/d' | sort -u | sed 's/^/- /')"
if [ -z "$LINKS_ALL" ]; then LINKS_ALL="- (nessun link rilevato)"; fi

# Next steps auto-generati
TODO=()
if [ "$HAS_API_GENERATE" -eq 0 ]; then
  TODO+=("Endpoint API reale: `POST /generate` (stub) → ritorna JSON (headline + image placeholder)")
fi
if [ "$HAS_RENDER_LIB" -eq 0 ]; then
  TODO+=("Rendering engine v0: installare libreria rendering immagini (es. sharp o canvas) e generare PNG 1080x1080")
else
  TODO+=("Rendering engine v0: generare PNG 1080x1080 da layout JSON + asset")
fi
TODO+=("Brand Layer MVP 1:1: definire 4 layout minimi (schema + regole spaziatura/gerarchia)")
TODO+=("Web UI MVP: form Topic + Obiettivo + Genera → mostra 4 varianti 1:1 in griglia")
TODO+=("Integrazione Figma (dopo rendering stabile)")
TODO+=("AI (testi + immagini) solo dopo guardrail e struttura")

TODO_MD=""
i=1
for t in "${TODO[@]}"; do
  TODO_MD+="$i) $t"$'\n'
  i=$((i+1))
done

# Riscrive PROJECT_STATE.md con la struttura DETAILED richiesta
python3 - <<PY
from pathlib import Path

date = "$DATE"
branch = "$BRANCH"
head = "$HEAD_SHA"

web_url = "$WEB_URL"
api_url = "$API_URL"
repo_url = "$REPO_URL"

has_api_health = ${HAS_API_HEALTH}
has_web_api_test = ${HAS_WEB_API_TEST}
has_env_usage = ${HAS_ENV_USAGE}
has_cors = ${HAS_CORS}

last_commits = """$LAST_COMMITS""".strip() or "- (no commits found)"
links_all = """$LINKS_ALL""".rstrip()
todo_md = """$TODO_MD""".rstrip()

content = f"""# Brand-Trained Engine — PROJECT STATE (dettagliato)

Ultimo aggiornamento: {date} (UTC)

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
- URL produzione: {web_url}

### Backend API
- Runtime: Node (Express)
- Directory: `apps/api`
- Hosting: Render (Web Service, piano Free)
- URL produzione: {api_url}
- Endpoint health: `GET /health` → `{{"ok":true}}` (detected: {"YES" if has_api_health else "NO"})

### Comunicazione Frontend ↔ Backend
- Il frontend chiama l’API tramite variabile ambiente:
  - `NEXT_PUBLIC_API_BASE_URL={api_url}` (usage detected: {"YES" if has_env_usage else "NO"})
- Pagina di test:
  - `{web_url}/api-test` (detected: {"YES" if has_web_api_test else "NO"})
  - deve mostrare `{{"ok":true}}`

---

## 3) Repo & struttura progetto

Repo GitHub:
- {repo_url}

Struttura:
- `apps/web`  → Next.js
- `apps/api`  → Express API
- `packages/shared` → placeholder (non ancora usato)
- `docs/` → documentazione e stato progetto

### Link usati (auto)
{links_all}

---

## 4) Deploy & CI/CD

### Vercel
- Collegato al repo GitHub
- Root directory: `apps/web`
- Deploy automatico su push su `main` (production)

### Render
- Web Service collegato al repo GitHub
- Root directory: `apps/api`
- Build: `npm install`
- Start: `npm start`
- Health check: `/health`
- Deploy automatico su push su `main`

---

## 5) Variabili ambiente

### Vercel
- `NEXT_PUBLIC_API_BASE_URL = {api_url}`

### Render
- Usa `process.env.PORT` (log: “API listening on port 10000”)

---

## 6) Endpoint e pagine

### API (apps/api)
- `GET /health` → `{{"ok":true}}`
- CORS: abilitato con header manuali in Express (necessario per chiamate browser da Vercel) (detected: {"YES" if has_cors else "NO"})

### Web (apps/web)
- Home: “Brand-Trained Engine™”
- `/api-test`: fetch a `${{NEXT_PUBLIC_API_BASE_URL}}/health` e mostra risultato

---

## 7) Problemi incontrati e risolti

### 7.1 Production su Vercel aggiornava solo `main`
- `dev` generava preview deployments
- Soluzione: merge `dev → main` per aggiornare production

### 7.2 Frontend non poteva chiamare API in produzione
- `localhost` non valido da Vercel → introdotta env var `NEXT_PUBLIC_API_BASE_URL`
- CORS mancante → aggiunti header CORS manuali lato API
- Risultato: `/api-test` ora mostra `{{"ok":true}}`

### 7.3 Incolla blocchi `EOF` a volte corrompe file
- Soluzione operativa: usare editor (GitHub o nano) o verificare con `sed/cat`

---

## 8) Stato attuale (tutto verde)
✅ Repo in cloud (GitHub)  
✅ Frontend live su Vercel  
✅ Backend live su Render  
✅ `/health` risponde  
✅ `/api-test` mostra `{{"ok":true}}` in produzione  
✅ CORS risolto  

---

## 9) Next steps (ordine consigliato)
{todo_md}

---

## 10) Come ripartire dopo chiusura chat
In una nuova chat:
- incolla `docs/PROJECT_STATE.md`
- e (quando attivo) `docs/PROJECT_HISTORY.md`
Così riparto esattamente dal punto giusto.

---

## Meta (auto)
- Branch: {branch}
- HEAD: {head}

## Ultimi commit (auto)
{last_commits}
"""
Path("$STATE").write_text(content + "\\n", encoding="utf-8")
PY

# Stage, commit, push
git add -A
if git diff --cached --quiet; then
  echo "Niente da salvare."
  exit 0
fi

git commit -m "salva: $DATE"
git push
echo "✅ PROJECT_STATE aggiornato ($DATE)"
