"use client"
import { useState, useEffect } from "react"

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  "ESG Report": { bg: "#dcfce7", color: "#166534" },
  "Annual Report": { bg: "#dbeafe", color: "#1e40af" },
  "News Article": { bg: "#fef9c3", color: "#854d0e" },
}
const SENTIMENT_COLORS: Record<string, { bg: string; color: string }> = {
  Positive: { bg: "#dcfce7", color: "#166534" },
  Neutral: { bg: "#f1f5f9", color: "#475569" },
  Mixed: { bg: "#fef9c3", color: "#854d0e" },
  Negative: { bg: "#fef2f2", color: "#991b1b" },
}

export function DocumentsPanel() {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [answer, setAnswer] = useState("")
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetch("/api/company-docs").then(r => r.json()).then(d => { setDocs(d.documents || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const doSearch = async (text: string = query) => {
    setAnswer("")
    if (!text.trim()) {
      setSearched(false)
      setLoading(true)
      const r = await fetch("/api/company-docs")
      const d = await r.json()
      setDocs(d.documents || [])
      setLoading(false)
      return
    }
    setSearching(true)
    setSearched(true)
    setExpandedId(null)
    const type = typeFilter === "All" ? "" : `&type=${encodeURIComponent(typeFilter)}`
    try {
      const r = await fetch(`/api/company-docs?q=${encodeURIComponent(text)}${type}`)
      const d = await r.json()
      setDocs(d.results || d.documents || [])
      setAnswer(d.answer || (d.error ? `Error: ${d.error}` : ""))
    } finally {
      setSearching(false)
    }
  }

  const filterByType = async (type: string) => {
    setTypeFilter(type)
    setSearched(false)
    setAnswer("")
    setLoading(true)
    const url = type === "All" ? "/api/company-docs" : `/api/company-docs?type=${encodeURIComponent(type)}`
    const r = await fetch(url)
    const d = await r.json()
    setDocs(d.documents || [])
    setLoading(false)
  }

  const examples = [
    "What is Dia Group's carbon reduction target?",
    "Show ESG commitments across the portfolio",
    "Veon regulatory issues",
    "Holland & Barrett international expansion plans",
  ]

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Document Intelligence</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>ESG reports, annual reports, and news articles across portfolio companies — searchable with Cortex Search.</p>

      {/* Search */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
          placeholder="Search documents..." style={{ flex: 1, padding: "10px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }} />
        <button onClick={() => doSearch()} disabled={searching} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1e3a5f", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{searching ? "Searching..." : "Search"}</button>
      </div>

      {/* Suggested queries */}
      {!searched && !query && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>Suggested queries:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {examples.map(e => (
              <button key={e} onClick={() => { setQuery(e); doSearch(e) }} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, cursor: "pointer" }}>
                &ldquo;{e}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Type filter chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["All", "ESG Report", "Annual Report", "News Article"].map(t => (
          <button key={t} onClick={() => filterByType(t)} style={{
            padding: "6px 16px", borderRadius: 20, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: typeFilter === t ? "#1e3a5f" : "#fff", color: typeFilter === t ? "#fff" : "#475569",
          }}>{t}</button>
        ))}
      </div>

      {/* AI answer */}
      {searching && <div style={{ padding: 20, marginBottom: 16, background: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: 12, fontSize: 13, color: "#1e40af" }}>Searching documents and generating answer with Cortex AI...</div>}
      {!searching && searched && answer && (
        <div style={{ padding: 20, marginBottom: 16, background: "#f0f9ff", border: "1px solid #bfdbfe", borderLeft: "4px solid #3b82f6", borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", marginBottom: 8, textTransform: "uppercase" }}>Answer · Cortex Search + AI_COMPLETE</div>
          <div style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{answer.replace(/\*\*/g, "")}</div>
          {docs.length > 0 && <div style={{ fontSize: 12, color: "#475569", marginTop: 12 }}>
            <b>Sources:</b> {docs.slice(0, 3).map((d: any, i: number) => `[${i + 1}] ${d.DOC_TITLE}`).join("  ·  ")}
          </div>}
        </div>
      )}
      {searched && !searching && docs.length > 0 && <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>{docs.length} matching documents</div>}

      {/* Document list */}
      {!searching && docs.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No documents found</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {docs.map((d: any, i: number) => {
          const tc = TYPE_COLORS[d.DOC_TYPE || d.doc_type] || TYPE_COLORS["News Article"]
          const sc = SENTIMENT_COLORS[d.SENTIMENT || d.sentiment] || SENTIMENT_COLORS.Neutral
          const docId = d.DOC_ID || d.doc_id || `doc-${i}`
          const expanded = expandedId === docId
          const title = d.DOC_TITLE || d.doc_title || "Document"
          const company = d.COMPANY || d.company || ""
          const docType = d.DOC_TYPE || d.doc_type || ""
          const summary = d.SUMMARY || d.summary || ""
          const sentiment = d.SENTIMENT || d.sentiment || ""
          const text = d.PARSED_TEXT || d.text || d.parsed_text || ""
          const keywords = d.KEYWORDS || d.keywords || ""
          const sourceUrl = d.SOURCE_URL || d.source_url || ""
          const filePath = d.FILE_PATH || d.file_path || ""
          const docDate = (d.DOC_DATE || d.doc_date || "")?.split("T")[0] || ""

          return (
            <div key={docId} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", cursor: "pointer" }}
              onClick={() => setExpandedId(expanded ? null : docId)}>
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{title}</div>
                    <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>{company} · {docDate}</div>
                    {!expanded && summary && <div style={{ fontSize: 12, color: "#64748b", marginTop: 8, lineHeight: 1.5 }}>{summary.slice(0, 150)}...</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: 16 }}>
                    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color }}>{docType}</span>
                    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{sentiment}</span>
                  </div>
                </div>
              </div>

              {expanded && (
                <div style={{ padding: "0 20px 20px", borderTop: "1px solid #f1f5f9" }} onClick={e => e.stopPropagation()}>
                  {/* Summary */}
                  <div style={{ margin: "16px 0", padding: 16, background: "#f0f9ff", borderLeft: "4px solid #3b82f6", borderRadius: "0 8px 8px 0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", marginBottom: 6, textTransform: "uppercase" }}>Summary</div>
                    <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.6 }}>{summary || "No summary available"}</div>
                  </div>

                  {/* Keywords */}
                  {keywords && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "12px 0" }}>
                      {keywords.split(",").map((k: string) => k.trim()).filter(Boolean).map((k: string) => (
                        <span key={k} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, background: "#f1f5f9", color: "#475569" }}>{k}</span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  <div style={{ display: "flex", gap: 12, margin: "12px 0" }}>
                    {sourceUrl && (
                      <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
                        View Original Article &rarr;
                      </a>
                    )}
                    {filePath && !sourceUrl && (
                      <span style={{ fontSize: 12, color: "#64748b" }}>PDF: {filePath}</span>
                    )}
                  </div>

                  {/* Full text */}
                  {text && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>Full Text</div>
                      <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7, maxHeight: 300, overflow: "auto", padding: 16, background: "#f8fafc", borderRadius: 8, whiteSpace: "pre-wrap" }}>
                        {text}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
