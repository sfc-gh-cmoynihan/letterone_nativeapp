"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["#1e3a5f", "#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6"]

export function CIOViewPanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/cio-view").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>
  if (!data) return <div style={{ padding: 40, color: "#dc2626" }}>Failed to load</div>

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>CIO Executive View</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>One-click view for senior executives. Return attribution, risk by strategy, cash concentration.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Exposure by Entity</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={data.exposureByEntity} dataKey="TOTAL_MV" nameKey="ENTITY" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label={({ ENTITY }) => ENTITY}>
              {(data.exposureByEntity || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip formatter={(v: number) => `$${(v/1e9).toFixed(2)}B`} /></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>30-Day P&L by Strategy</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.pnlByStrategy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="STRATEGY" fontSize={10} angle={-15} textAnchor="end" height={50} />
              <YAxis fontSize={10} tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => `$${(v/1e6).toFixed(2)}M`} />
              <Bar dataKey="TOTAL_PNL" radius={[4, 4, 0, 0]}>{(data.pnlByStrategy || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Top 10 Positions by Value</h3>
          {(data.topPositions || []).map((p: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>
              <div><span style={{ fontWeight: 600 }}>{p.INSTRUMENT_NAME}</span> <span style={{ color: "#94a3b8" }}>· {p.ENTITY}</span></div>
              <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${(Math.abs(p.MARKET_VALUE_USD) / 1e9).toFixed(2)}B</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Cash Concentration by Bank</h3>
          {(data.cashConcentration || []).map((c: any, i: number) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{c.BANK_NAME}</span>
                <span style={{ color: c.PCT > 20 ? "#dc2626" : "#475569", fontWeight: c.PCT > 20 ? 700 : 400 }}>{c.PCT?.toFixed(1)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "#f1f5f9" }}>
                <div style={{ height: "100%", borderRadius: 3, background: c.PCT > 20 ? "#dc2626" : "#2563eb", width: `${Math.min(c.PCT, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
