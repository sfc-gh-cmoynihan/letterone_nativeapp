"use client"
import { useState, useEffect } from "react"

interface Break { BREAK_ID: string; BREAK_DATE: string; BREAK_TYPE: string; BANK_NAME: string; ENFUSION_AMOUNT: number; STATEMENT_AMOUNT: number; DIFFERENCE_USD: number; STATUS: string; AI_EXPLANATION: string; ASSIGNED_TO: string; DAYS_OPEN: number; LAST_UPDATED: string | null; UPDATED_BY: string | null; COMMENT: string | null }
interface Summary { STATUS: string; CNT: number; TOTAL_DIFF: number }

function ageBand(days: number): { label: string; bg: string; fg: string } {
  if (days === 0) return { label: "Today", bg: "#dcfce7", fg: "#166534" }
  if (days <= 2) return { label: `${days}d`, bg: "#dbeafe", fg: "#1e40af" }
  if (days <= 5) return { label: `${days}d`, bg: "#fef9c3", fg: "#854d0e" }
  if (days <= 10) return { label: `${days}d`, bg: "#fed7aa", fg: "#9a3412" }
  return { label: `${days}d`, bg: "#fecaca", fg: "#991b1b" }
}

function formatTs(ts: string | null) {
  if (!ts) return "—"
  const d = new Date(ts)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

export function ReconciliationPanel() {
  const [breaks, setBreaks] = useState<Break[]>([])
  const [summary, setSummary] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("All")
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/reconciliation").then(r => r.json()).then(d => { setBreaks(d.breaks || []); setSummary(d.summary || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>

  const filtered = filter === "All" ? breaks : breaks.filter(b => b.STATUS === filter)
  const statusColors: Record<string, { bg: string; fg: string }> = {
    Open: { bg: "#fef9c3", fg: "#854d0e" },
    Escalated: { bg: "#fef2f2", fg: "#991b1b" },
    "Under Review": { bg: "#eff6ff", fg: "#1e40af" },
    Resolved: { bg: "#dcfce7", fg: "#166534" },
  }

  const ageSummary = {
    today: filtered.filter(b => b.DAYS_OPEN === 0).length,
    d1_2: filtered.filter(b => b.DAYS_OPEN >= 1 && b.DAYS_OPEN <= 2).length,
    d3_5: filtered.filter(b => b.DAYS_OPEN >= 3 && b.DAYS_OPEN <= 5).length,
    d6_10: filtered.filter(b => b.DAYS_OPEN >= 6 && b.DAYS_OPEN <= 10).length,
    d10plus: filtered.filter(b => b.DAYS_OPEN > 10).length,
  }

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Cash & Position Reconciliation</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>Enfusion against bank and custodian statements — exceptions only. AI explains each break.</p>

      {/* Age break summary */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Today", count: ageSummary.today, bg: "#dcfce7", fg: "#166534" },
          { label: "1–2 days", count: ageSummary.d1_2, bg: "#dbeafe", fg: "#1e40af" },
          { label: "3–5 days", count: ageSummary.d3_5, bg: "#fef9c3", fg: "#854d0e" },
          { label: "6–10 days", count: ageSummary.d6_10, bg: "#fed7aa", fg: "#9a3412" },
          { label: "10+ days", count: ageSummary.d10plus, bg: "#fecaca", fg: "#991b1b" },
        ].map(a => (
          <div key={a.label} style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", borderLeft: `4px solid ${a.fg}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>{a.count}</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{a.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {["All", "Open", "Escalated", "Under Review", "Resolved"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "6px 14px", borderRadius: 8, border: filter === s ? "1px solid #1e3a5f" : "1px solid #e2e8f0", background: filter === s ? "#1e3a5f" : "#fff", color: filter === s ? "#fff" : "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {s} {s !== "All" && `(${summary.find(x => x.STATUS === s)?.CNT || 0})`}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ maxHeight: 600, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Break", "Bank", "Difference", "Status", "Age", "Last Updated", "Updated By", "AI Explanation"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: h === "Difference" ? "right" : "left", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const sc = statusColors[b.STATUS] || { bg: "#f1f5f9", fg: "#475569" }
                const ab = ageBand(b.DAYS_OPEN)
                const isExpanded = expanded === b.BREAK_ID
                return (
                  <>
                    <tr key={b.BREAK_ID}
                      onClick={() => setExpanded(isExpanded ? null : b.BREAK_ID)}
                      style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f0f4ff" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "#fff" : "#fafbfc" }}
                    >
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontWeight: 600 }}>{b.BREAK_ID}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{b.BREAK_TYPE} · {b.BREAK_DATE}</div>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>{b.BANK_NAME}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: b.DIFFERENCE_USD > 0 ? "#dc2626" : "#16a34a" }}>${(Math.abs(b.DIFFERENCE_USD) / 1000).toFixed(0)}K</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.fg }}>{b.STATUS}</span></td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: ab.bg, color: ab.fg }}>{ab.label}</span>
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>{formatTs(b.LAST_UPDATED)}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontSize: 11 }}>{b.UPDATED_BY || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", maxWidth: 280, fontSize: 11, color: "#475569", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.AI_EXPLANATION}</td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${b.BREAK_ID}-detail`}>
                        <td colSpan={8} style={{ padding: 0, borderBottom: "2px solid #e2e8f0" }}>
                          <div style={{ padding: "16px 20px", background: "#f8fafc" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>AI Explanation</div>
                                <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.6 }}>{b.AI_EXPLANATION}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Comment</div>
                                <div style={{ fontSize: 13, color: b.COMMENT ? "#1e293b" : "#94a3b8", lineHeight: 1.6, fontStyle: b.COMMENT ? "normal" : "italic" }}>
                                  {b.COMMENT || "No comment yet"}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 16, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Enfusion</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", fontVariantNumeric: "tabular-nums" }}>${(b.ENFUSION_AMOUNT / 1e6).toFixed(2)}M</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Statement</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", fontVariantNumeric: "tabular-nums" }}>${(b.STATEMENT_AMOUNT / 1e6).toFixed(2)}M</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Assigned To</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{b.ASSIGNED_TO || "Unassigned"}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Days Open</div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>
                                  <span style={{ padding: "2px 10px", borderRadius: 10, background: ab.bg, color: ab.fg }}>{b.DAYS_OPEN} {b.DAYS_OPEN === 1 ? "day" : "days"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
