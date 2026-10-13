"use client"
import { useState } from "react"

export function DealSearchPanel() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const r = await fetch(`/api/deal-documents?q=${encodeURIComponent(query)}`)
      const d = await r.json()
      setResults(d.results || d.documents || [])
    } catch { setResults([]) }
    setLoading(false)
  }

  const examples = [
    "Have we looked at student housing in Spain or Germany before?",
    "Show every asset-backed deal we reviewed this year with royalty cash flows",
    "What rent growth did counterparties assume in our closed real estate deals?",
    "Find deals with LTV above 70%",
  ]

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Deal Library Search</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>Cortex Search over 100+ deals — institutional memory across live, dead, and closed transactions.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Search deal documents..." style={{ flex: 1, padding: "10px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }} />
        <button onClick={search} disabled={loading} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1e3a5f", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{loading ? "Searching..." : "Search"}</button>
      </div>

      {!searched && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>Suggested queries:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {examples.map(e => (
              <button key={e} onClick={() => { setQuery(e); search() }} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, cursor: "pointer" }}>"{e}"</button>
            ))}
          </div>
        </div>
      )}

      {searched && results.length === 0 && !loading && (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No results found</div>
      )}

      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {results.map((r: any, i: number) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{r.DEAL_NAME || r.deal_name || "Document"}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{r.FILE_TYPE || r.file_type || r.CLASSIFICATION || "—"}</div>
                </div>
                <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: "#f0f9ff", color: "#1e40af" }}>{r.CLASSIFICATION || r.classification || "Document"}</span>
              </div>
              {(r.PARSED_TEXT || r.text) && <div style={{ fontSize: 12, color: "#475569", marginTop: 10, lineHeight: 1.6, maxHeight: 100, overflow: "hidden" }}>{(r.PARSED_TEXT || r.text).slice(0, 400)}...</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
