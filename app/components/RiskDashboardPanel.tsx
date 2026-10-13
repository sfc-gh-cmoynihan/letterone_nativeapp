"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

const COLORS = ["#1e3a5f", "#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4"]

export function RiskDashboardPanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/risk").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>
  if (!data) return <div style={{ padding: 40, color: "#dc2626" }}>Failed to load</div>

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Risk Dashboard</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>Portfolio exposure by strategy and entity. History, calculations and scenarios on governed data.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Exposure by Strategy</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.byStrategy} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" fontSize={10} tickFormatter={v => `$${(v/1e9).toFixed(1)}B`} />
              <YAxis type="category" dataKey="STRATEGY" fontSize={11} width={90} />
              <Tooltip formatter={(v: number) => `$${(v/1e9).toFixed(2)}B`} />
              <Bar dataKey="TOTAL_MV" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Exposure by Entity</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.byEntity} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" fontSize={10} tickFormatter={v => `$${(v/1e9).toFixed(1)}B`} />
              <YAxis type="category" dataKey="ENTITY" fontSize={11} width={90} />
              <Tooltip formatter={(v: number) => `$${(v/1e9).toFixed(2)}B`} />
              <Bar dataKey="TOTAL_MV" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Portfolio Value Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={[...(data.timeSeries || [])].reverse()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="SNAPSHOT_DATE" fontSize={10} />
            <YAxis fontSize={10} tickFormatter={v => `$${(v/1e9).toFixed(1)}B`} />
            <Tooltip formatter={(v: number) => `$${(v/1e9).toFixed(2)}B`} />
            <Line type="monotone" dataKey="TOTAL_MV" stroke="#1e3a5f" strokeWidth={2} dot={{ fill: "#1e3a5f", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
