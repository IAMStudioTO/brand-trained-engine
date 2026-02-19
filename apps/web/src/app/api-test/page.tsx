"use client";

import { useEffect, useState } from "react";

export default function ApiTest() {
  const [status, setStatus] = useState("Loading...");

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    if (!base) {
      setStatus("ENV MISSING: NEXT_PUBLIC_API_BASE_URL");
      return;
    }

    fetch(`${base}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(JSON.stringify(data)))
      .catch((err) => setStatus(`Error connecting to API: ${String(err)}`));
  }, [base]);

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>API Test</h1>
      <p><b>BASE:</b> {base || "(empty)"}</p>
      <p><b>RESULT:</b> {status}</p>
    </main>
  );
}
