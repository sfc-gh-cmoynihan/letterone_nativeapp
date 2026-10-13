"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const RATING_COLORS: Record<string, string> = { AAA: "#1e3a5f", AA: "#2563eb", A: "#16a34a", BBB: "#f59e0b", BB: "#dc2626", B: "#8b5cf6" }

export function StructuredCreditPanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/clo-portfolio").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>
  if (!data) return <div style={{ padding: 40, color: "#dc2626" }}>Failed to load</div>

  const totalMV = (data.byRating || []).reduce((s: number, r: any) => s + (r.TOTAL_MV || 0), 0)

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Structured Credit Portfolio</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>~{data.portfolio?.length || 145} CLO/ABS tranches. One governed ledger replacing Intex-to-Excel.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Tranches", value: data.portfolio?.length || 0 },
          { label: "Total Market Value", value: `$${(totalMV / 1e6).toFixed(0)}M` },
          { label: "Managers", value: data.byManager?.length || 0 },
          { label: "Avg Spread", value: `${Math.round((data.byManager || []).reduce((s: number, m: any) => s + (m.AVG_SPREAD || 0), 0) / Math.max((data.byManager || []).length, 1))} bps` },
        ].map(m => (
          <div key={m.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>{m.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Exposure by Rating</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.byRating} dataKey="TOTAL_MV" nameKey="TRANCHE_RATING" cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                label={({ TRANCHE_RATING, TRANCHES }) => `${TRANCHE_RATING} (${TRANCHES})`}>
                {(data.byRating || []).map((entry: any) => <Cell key={entry.TRANCHE_RATING} fill={RATING_COLORS[entry.TRANCHE_RATING] || "#94a3b8"} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `$${(v/1e6).toFixed(1)}M`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Market Value by Vintage</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.byVintage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="VINTAGE_YEAR" fontSize={11} />
              <YAxis fontSize={10} tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => `$${(v/1e6).toFixed(1)}M`} />
              <Bar dataKey="TOTAL_MV" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <h3 style={{ margin: 0, padding: "16px 20px", fontSize: 14, fontWeight: 700, color: "#1e293b", borderBottom: "1px solid #e2e8f0" }}>Top CLO Managers</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "#f8fafc" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569" }}>Manager</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>Tranches</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>Notional ($M)</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>Market Value ($M)</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>Avg Spread (bps)</th>
          </tr></thead>
          <tbody>
            {(data.byManager || []).map((m: any, i: number) => (
              <tr key={m.MANAGER} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>{m.MANAGER}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{m.TRANCHES}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9", fontVariantNumeric: "tabular-nums" }}>${(m.TOTAL_NOTIONAL / 1e6).toFixed(1)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9", fontVariantNumeric: "tabular-nums" }}>${(m.TOTAL_MV / 1e6).toFixed(1)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{Math.round(m.AVG_SPREAD)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
