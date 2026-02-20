"use client";

import { useMemo, useState } from "react";

type Variant = {
  id: string;
  format: "1:1";
  layoutId: string;
  paletteId: string;
  headline: string;
  subhead?: string;
  image: { type: "placeholder"; url: string };
};

type GenerateResponse = {
  ok: boolean;
  input: { topic: string; objective?: string };
  variants: Variant[];
};

export default function GeneratePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const [topic, setTopic] = useState("Test");
  const [objective, setObjective] = useState("Awareness");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<GenerateResponse | null>(null);

  const canGenerate = useMemo(() => topic.trim().length > 0 && !!apiBase, [topic, apiBase]);

  async function onGenerate() {
    setError("");
    setLoading(true);
    setData(null);

    try {
      if (!apiBase) throw new Error("ENV MISSING: NEXT_PUBLIC_API_BASE_URL");

      const res = await fetch(`${apiBase}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, objective }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API error ${res.status}: ${text || "no body"}`);
      }

      const json = (await res.json()) as GenerateResponse;
      setData(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 12 }}>Generate (MVP 1:1)</h1>

      <div style={{ marginBottom: 8, opacity: 0.7 }}>
        API base: <code>{apiBase || "MISSING"}</code>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Topic</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Es: Nuovo prodotto"
            style={{ padding: 10, minWidth: 280 }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span>Obiettivo</span>
          <input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Es: Awareness"
            style={{ padding: 10, minWidth: 280 }}
          />
        </label>

        <div style={{ display: "flex", alignItems: "end" }}>
          <button
            onClick={onGenerate}
            disabled={!canGenerate || loading}
            style={{ padding: "10px 14px", cursor: canGenerate ? "pointer" : "not-allowed" }}
          >
            {loading ? "Generating..." : "Genera 4 varianti"}
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ padding: 12, background: "#2a0000", color: "#ffd1d1", borderRadius: 8 }}>
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          <h2 style={{ marginTop: 18, marginBottom: 10 }}>Risultati</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {data.variants.map((v) => (
              <div
                key={v.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <img src={v.image.url} alt={v.headline} style={{ width: "100%", display: "block" }} />

                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {v.format} • {v.layoutId} • {v.paletteId}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 6 }}>{v.headline}</div>
                  {v.subhead ? <div style={{ opacity: 0.8, marginTop: 4 }}>{v.subhead}</div> : null}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div style={{ marginTop: 22, opacity: 0.7 }}>
        Tip: apri anche <code>/api-test</code> per verificare la connessione base.
      </div>
    </main>
  );
}
