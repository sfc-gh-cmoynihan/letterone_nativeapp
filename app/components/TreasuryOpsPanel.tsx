"use client"
import { useState, useEffect } from "react"

interface Check { name: string; status: string; count: number }

export function TreasuryOpsPanel() {
  const [checks, setChecks] = useState<Check[]>([])
  const [openBreaks, setOpenBreaks] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/treasury-ops").then(r => r.json()).then(d => { setChecks(d.checks || []); setOpenBreaks(d.openBreaks || 0); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Treasury Operations Control</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>Daily checklist — replaces the Excel daily tracker. Users review exceptions only.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Daily Checklist</h3>
          {checks.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, background: c.status === "Complete" ? "#dcfce7" : "#fef9c3", color: c.status === "Complete" ? "#166534" : "#854d0e" }}>
                  {c.status === "Complete" ? "✓" : "⏳"}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{c.count} records processed</div>
                </div>
              </div>
              <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: c.status === "Complete" ? "#dcfce7" : "#fef9c3", color: c.status === "Complete" ? "#166534" : "#854d0e" }}>{c.status}</span>
            </div>
          ))}
        </div>

        <div>
          <div style={{ background: openBreaks > 5 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${openBreaks > 5 ? "#fecaca" : "#bbf7d0"}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Open Reconciliation Breaks</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: openBreaks > 5 ? "#dc2626" : "#16a34a", marginTop: 8 }}>{openBreaks}</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{openBreaks > 5 ? "Above threshold — review required" : "Within tolerance"}</div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>What changed from the Excel process</h3>
            {[
              { before: "30 spreadsheets produced daily", after: "Automated refresh from Enfusion data share" },
              { before: "Logic in VBA macros", after: "Rules in governed SQL with version history" },
              { before: "Excel checklist — 'pretty archaic'", after: "Live control dashboard with exception workflow" },
              { before: "Manual month-end file tracking", after: "Automated arrival detection with alerts" },
            ].map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "10px 0", borderBottom: i < 3 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ fontSize: 12, color: "#dc2626" }}>✕ {item.before}</div>
                <div style={{ fontSize: 12, color: "#16a34a" }}>✓ {item.after}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
