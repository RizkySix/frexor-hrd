"use client";

import { useEffect } from "react";

export function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);
  return null;
}

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        background: "#3b6ef0",
        color: "white",
        border: "none",
        padding: "8px 20px",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Cetak / Simpan PDF
    </button>
  );
}
