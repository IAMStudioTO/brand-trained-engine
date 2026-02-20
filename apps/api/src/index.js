import express from "express";

const app = express();

// CORS manuale (per chiamate da browser/Vercel)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: "25mb" })); // payload grandi (tree + asset base64)

// --- In-memory store (MVP) ---
const designs = []; // array di pacchetti importati

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/**
 * POST /figma/import
 * Riceve un Design Package:
 * - meta (fileKey, page, nodeId, nodeName, createdAt...)
 * - tree (node tree JSON con props/stili)
 * - assets (svg/png/jpg) come base64 o URL
 * - preview (png) opzionale
 */
app.post("/figma/import", (req, res) => {
  const apiKey = req.header("x-api-key");
  const expected = process.env.FIGMA_INGEST_KEY;

  if (!expected) {
    return res.status(500).json({ ok: false, error: "Missing FIGMA_INGEST_KEY on server" });
  }
  if (!apiKey || apiKey !== expected) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const pkg = req.body;

  // Validazione minima (per ora)
  if (!pkg?.meta?.fileKey || !pkg?.meta?.nodeId || !pkg?.tree) {
    return res.status(400).json({
      ok: false,
      error: "Invalid payload. Required: meta.fileKey, meta.nodeId, tree"
    });
  }

  designs.push({
    receivedAt: new Date().toISOString(),
    ...pkg
  });

  return res.json({
    ok: true,
    stored: designs.length,
    id: designs.length - 1
  });
});

// opzionale: lista per debug (da togliere dopo)
app.get("/figma/designs", (req, res) => {
  res.json({
    ok: true,
    count: designs.length,
    items: designs.map((d, i) => ({
      id: i,
      receivedAt: d.receivedAt,
      fileKey: d.meta?.fileKey,
      nodeId: d.meta?.nodeId,
      nodeName: d.meta?.nodeName
    }))
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
