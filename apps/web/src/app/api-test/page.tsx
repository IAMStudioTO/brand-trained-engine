"use client";

import { useEffect, useState } from "react";

export default function ApiTest() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:3001/health")
      .then((res) => res.json())
      .then((data) => setStatus(JSON.stringify(data)))
      .catch(() => setStatus("Error connecting to API"));
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>API Test</h1>
      <p>{status}</p>
    </main>
  );
}
