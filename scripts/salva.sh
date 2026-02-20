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
