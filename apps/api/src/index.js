import express from "express";

const app = express();

// CORS manuale per permettere richieste dal browser (Vercel)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/**
 * MVP: Genera 4 varianti 1:1 (solo JSON).
 * Input: { topic: string, objective?: string }
 */
app.post("/generate", (req, res) => {
  const topic = String(req.body?.topic ?? "").trim();
  const objective = String(req.body?.objective ?? "").trim();

  if (!topic) {
    return res.status(400).json({ error: "Missing 'topic'" });
  }

  // Placeholder: 4 layout ids + headline fake + immagine placeholder
  const variants = [1, 2, 3, 4].map((n) => ({
    id: `v${n}`,
    format: "1:1",
    layoutId: `L${n}`,
    paletteId: "P1",
    headline: `${topic} — Variante ${n}`,
    subhead: objective ? objective : "",
    image: {
      type: "placeholder",
      // per ora usiamo la stessa immagine placeholder (puoi cambiarla dopo)
      url: "https://placehold.co/1080x1080/png?text=Brand-Trained+Engine",
    },
  }));

  res.json({
    ok: true,
    input: { topic, objective },
    variants,
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});


// --- FIGMA IMPORT (MVP) ---
app.post("/figma/import", (req, res) => {
  // Protezione minima: chiave condivisa
  const key = req.header("x-api-key");
  const expected = process.env.FIGMA_INGEST_KEY;

  if (!expected) {
    return res.status(500).json({ ok: false, error: "FIGMA_INGEST_KEY not set" });
  }
  if (key !== expected) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // Payload atteso dal plugin (per ora libero)
  const payload = req.body;

  // MVP: non persistiamo ancora (Render free è ephemeral)
  // Rispondiamo con un riepilogo per verificare integrazione
  const summary = {
    receivedAt: new Date().toISOString(),
    keys: payload && typeof payload === "object" ? Object.keys(payload) : [],
  };

  return res.json({ ok: true, summary });
});
