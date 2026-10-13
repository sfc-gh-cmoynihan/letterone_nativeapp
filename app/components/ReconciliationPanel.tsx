"use client"
import { useState, useEffect } from "react"

interface Break { BREAK_ID: string; BREAK_DATE: string; BREAK_TYPE: string; BANK_NAME: string; ENFUSION_AMOUNT: number; STATEMENT_AMOUNT: number; DIFFERENCE_USD: number; STATUS: string; AI_EXPLANATION: string; ASSIGNED_TO: string; DAYS_OPEN: number }
interface Summary { STATUS: string; CNT: number; TOTAL_DIFF: number }

export function ReconciliationPanel() {
  const [breaks, setBreaks] = useState<Break[]>([])
  const [summary, setSummary] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("All")

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

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Cash & Position Reconciliation</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>Enfusion against bank and custodian statements — exceptions only. AI explains each break.</p>

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
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0" }}>Break</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0" }}>Bank</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0" }}>Difference</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0" }}>Status</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0" }}>Days</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0" }}>AI Explanation</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0" }}>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const sc = statusColors[b.STATUS] || { bg: "#f1f5f9", fg: "#475569" }
                return (
                  <tr key={b.BREAK_ID} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ fontWeight: 600 }}>{b.BREAK_ID}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{b.BREAK_TYPE} · {b.BREAK_DATE}</div>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>{b.BANK_NAME}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: b.DIFFERENCE_USD > 0 ? "#dc2626" : "#16a34a" }}>${(Math.abs(b.DIFFERENCE_USD) / 1000).toFixed(0)}K</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.fg }}>{b.STATUS}</span></td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontVariantNumeric: "tabular-nums", color: b.DAYS_OPEN > 5 ? "#dc2626" : "#475569" }}>{b.DAYS_OPEN}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", maxWidth: 300, fontSize: 11, color: "#475569", lineHeight: 1.5 }}>{b.AI_EXPLANATION}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontSize: 11 }}>{b.ASSIGNED_TO || <span style={{ color: "#94a3b8" }}>Unassigned</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
