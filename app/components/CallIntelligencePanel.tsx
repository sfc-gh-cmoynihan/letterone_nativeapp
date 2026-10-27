"use client"
import { useState, useEffect } from "react"

const SENTIMENT_COLORS: Record<string, { bg: string; color: string }> = {
  Positive: { bg: "#dcfce7", color: "#166534" },
  Neutral: { bg: "#f1f5f9", color: "#475569" },
  Mixed: { bg: "#fef9c3", color: "#854d0e" },
  Negative: { bg: "#fef2f2", color: "#991b1b" },
}

export function CallIntelligencePanel() {
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sentimentFilter, setSentimentFilter] = useState("All")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [flaggedOnly, setFlaggedOnly] = useState(false)

  useEffect(() => {
    fetch("/api/calls").then(r => r.json()).then(d => { setCalls(d.calls || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const doSearch = async () => {
    if (!search.trim()) {
      setLoading(true)
      const r = await fetch("/api/calls")
      const d = await r.json()
      setCalls(d.calls || [])
      setLoading(false)
      return
    }
    setLoading(true)
    const r = await fetch(`/api/calls?q=${encodeURIComponent(search)}`)
    const d = await r.json()
    setCalls(d.calls || [])
    setLoading(false)
  }

  const filtered = calls
    .filter(c => sentimentFilter === "All" || c.SENTIMENT === sentimentFilter)
    .filter(c => !flaggedOnly || (c.RED_FLAG_COUNT || 0) > 0)

  const toggleFlagged = () => {
    const next = !flaggedOnly
    setFlaggedOnly(next)
    setExpandedId(null)
    if (next) setTimeout(() => document.getElementById("call-list")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0)
  }
  const totalCalls = calls.length
  const positivePct = totalCalls ? Math.round(calls.filter(c => c.SENTIMENT === "Positive").length / totalCalls * 100) : 0
  const flaggedCount = calls.filter(c => (c.RED_FLAG_COUNT || 0) > 0).length
  const avgDuration = totalCalls ? Math.round(calls.reduce((s, c) => s + (c.DURATION_SECONDS || 0), 0) / totalCalls / 60) : 0

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Call Intelligence</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>AI analysis of C-level calls with portfolio company executives</p>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Calls", value: totalCalls },
          { label: "Positive Sentiment", value: `${positivePct}%` },
          { label: "Flagged Calls", value: flaggedCount, alert: flaggedCount > 0, onClick: flaggedCount > 0 ? toggleFlagged : undefined, active: flaggedOnly },
          { label: "Avg Duration", value: `${avgDuration} min` },
        ].map(k => (
          <div key={k.label} onClick={k.onClick} title={k.onClick ? (k.active ? "Show all calls" : "Show flagged calls and their red flags") : undefined}
            style={{
              background: k.active ? "#fef2f2" : "#fff", border: `1px solid ${k.active ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 12, padding: 20,
              cursor: k.onClick ? "pointer" : "default", transition: "box-shadow 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { if (k.onClick) (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(220,38,38,0.12)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none" }}>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
              {k.label}{k.onClick && <span style={{ marginLeft: 6, fontSize: 10, color: "#dc2626" }}>{k.active ? "✕ clear" : "↗ view"}</span>}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.alert ? "#dc2626" : "#1e293b", marginTop: 4 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search and filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
          placeholder="Search by company, contact, or caller..." style={{ flex: 1, padding: "10px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }} />
        <select value={sentimentFilter} onChange={e => setSentimentFilter(e.target.value)}
          style={{ padding: "10px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff" }}>
          <option value="All">All Sentiment</option>
          <option value="Positive">Positive</option>
          <option value="Neutral">Neutral</option>
          <option value="Mixed">Mixed</option>
          <option value="Negative">Negative</option>
        </select>
        <button onClick={doSearch} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1e3a5f", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Search</button>
      </div>

      {/* Call list */}
      <div id="call-list" style={{ scrollMarginTop: 16 }} />
      {flaggedOnly && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "10px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#991b1b" }}>
            Showing {filtered.length} flagged call{filtered.length === 1 ? "" : "s"} · {filtered.reduce((s, c) => s + (c.RED_FLAG_COUNT || 0), 0)} red flags
          </span>
          <button onClick={toggleFlagged} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fff", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Show all calls</button>
        </div>
      )}
      {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No calls found</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((c: any) => {
          const sc = SENTIMENT_COLORS[c.SENTIMENT] || SENTIMENT_COLORS.Neutral
          const expanded = expandedId === c.CALL_ID
          const flags = (() => { try { return JSON.parse(c.RED_FLAGS || "[]") } catch { return [] } })()
          return (
            <div key={c.CALL_ID} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", cursor: "pointer" }}
              onClick={() => setExpandedId(expanded ? null : c.CALL_ID)}>
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{c.COMPANY}</div>
                    <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>{c.CONTACT_NAME} — {c.CONTACT_ROLE}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                      {c.CALL_DATE?.split("T")[0]} · {Math.round((c.DURATION_SECONDS || 0) / 60)} min · {c.CALL_TYPE} · Caller: {c.CALLER}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {(c.RED_FLAG_COUNT || 0) > 0 && (
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                        {c.RED_FLAG_COUNT} flag{c.RED_FLAG_COUNT > 1 ? "s" : ""}
                      </span>
                    )}
                    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{c.SENTIMENT}</span>
                  </div>
                </div>

                {/* In flagged view, show the red flags without needing to expand */}
                {flaggedOnly && !expanded && flags.length > 0 && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef2f2", borderLeft: "4px solid #dc2626", borderRadius: "0 8px 8px 0" }}>
                    {flags.map((f: string, i: number) => (
                      <div key={i} style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 }}>• {f}</div>
                    ))}
                    <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 6 }}>Click for AI summary and full transcript</div>
                  </div>
                )}
              </div>

              {expanded && (
                <div style={{ padding: "0 20px 20px", borderTop: "1px solid #f1f5f9" }} onClick={e => e.stopPropagation()}>
                  {/* Summary */}
                  <div style={{ margin: "16px 0", padding: 16, background: "#f0f9ff", borderLeft: "4px solid #3b82f6", borderRadius: "0 8px 8px 0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", marginBottom: 6, textTransform: "uppercase" }}>AI Summary</div>
                    <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.6 }}>{c.SUMMARY || "No summary available"}</div>
                  </div>

                  {/* Red Flags */}
                  {flags.length > 0 && (
                    <div style={{ margin: "12px 0", padding: 16, background: "#fef2f2", borderLeft: "4px solid #dc2626", borderRadius: "0 8px 8px 0" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", marginBottom: 8, textTransform: "uppercase" }}>Red Flags</div>
                      {flags.map((f: string, i: number) => (
                        <div key={i} style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.6, padding: "2px 0" }}>• {f}</div>
                      ))}
                    </div>
                  )}

                  {/* Transcript */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>Full Transcript</div>
                    <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7, maxHeight: 300, overflow: "auto", padding: 16, background: "#f8fafc", borderRadius: 8, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                      {c.TRANSCRIPTION || "No transcript available"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
