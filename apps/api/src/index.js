import express from "express";

const app = express();

// CORS manuale per permettere richieste dal browser (Vercel)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
