"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

const COLORS = ["#1e3a5f", "#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4"]

interface Position { POSITION_ID: string; INSTRUMENT_NAME: string; INSTRUMENT_TYPE: string; ENTITY: string; STRATEGY: string; BOOK: string; PRODUCT: string; CURRENCY: string; MARKET_VALUE_USD: number; UNREALISED_PNL_USD: number; QUANTITY: number }

export function RiskDashboardPanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [drillType, setDrillType] = useState<"strategy" | "entity" | null>(null)
  const [drillValue, setDrillValue] = useState<string | null>(null)
  const [drillData, setDrillData] = useState<Position[]>([])
  const [drillLoading, setDrillLoading] = useState(false)

  useEffect(() => {
    fetch("/api/risk").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  function drill(type: "strategy" | "entity", value: string) {
    if (drillType === type && drillValue === value) {
      setDrillType(null); setDrillValue(null); setDrillData([])
      return
    }
    setDrillType(type); setDrillValue(value); setDrillLoading(true)
    const param = type === "strategy" ? `strategy=${encodeURIComponent(value)}` : `entity=${encodeURIComponent(value)}`
    fetch(`/api/positions?${param}`).then(r => r.json()).then(d => { setDrillData(d?.positions || (Array.isArray(d) ? d : [])); setDrillLoading(false) }).catch(() => setDrillLoading(false))
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>
  if (!data) return <div style={{ padding: 40, color: "#dc2626" }}>Failed to load</div>

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Risk Dashboard</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>Portfolio exposure by strategy and entity. Click a bar to drill into positions.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: drillType === "strategy" ? "2px solid #1e3a5f" : "1px solid #e2e8f0", borderRadius: 12, padding: 20, transition: "border 0.15s" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Exposure by Strategy
            {drillType === "strategy" && <span onClick={() => { setDrillType(null); setDrillValue(null); setDrillData([]) }} style={{ fontSize: 11, color: "#2563eb", cursor: "pointer", fontWeight: 500 }}>Clear</span>}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.byStrategy} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" fontSize={10} tickFormatter={v => `$${(v/1e9).toFixed(1)}B`} />
              <YAxis type="category" dataKey="STRATEGY" fontSize={11} width={90} />
              <Tooltip formatter={(v: number) => `$${(v/1e9).toFixed(2)}B`} />
              <Bar dataKey="TOTAL_MV" radius={[0, 4, 4, 0]} cursor="pointer"
                onClick={(_: any, idx: number) => { const item = data.byStrategy[idx]; if (item) drill("strategy", item.STRATEGY) }}
                fill="#1e3a5f"
                shape={(props: any) => {
                  const active = drillType === "strategy" && drillValue === props?.payload?.STRATEGY
                  return <rect {...props} fill={active ? "#2563eb" : "#1e3a5f"} opacity={drillType === "strategy" && !active ? 0.4 : 1} rx={4} ry={4} />
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#fff", border: drillType === "entity" ? "2px solid #2563eb" : "1px solid #e2e8f0", borderRadius: 12, padding: 20, transition: "border 0.15s" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Exposure by Entity
            {drillType === "entity" && <span onClick={() => { setDrillType(null); setDrillValue(null); setDrillData([]) }} style={{ fontSize: 11, color: "#2563eb", cursor: "pointer", fontWeight: 500 }}>Clear</span>}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.byEntity} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" fontSize={10} tickFormatter={v => `$${(v/1e9).toFixed(1)}B`} />
              <YAxis type="category" dataKey="ENTITY" fontSize={11} width={90} />
              <Tooltip formatter={(v: number) => `$${(v/1e9).toFixed(2)}B`} />
              <Bar dataKey="TOTAL_MV" radius={[0, 4, 4, 0]} cursor="pointer"
                onClick={(_: any, idx: number) => { const item = data.byEntity[idx]; if (item) drill("entity", item.ENTITY) }}
                fill="#2563eb"
                shape={(props: any) => {
                  const active = drillType === "entity" && drillValue === props?.payload?.ENTITY
                  return <rect {...props} fill={active ? "#1e3a5f" : "#2563eb"} opacity={drillType === "entity" && !active ? 0.4 : 1} rx={4} ry={4} />
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drill-down detail table */}
      {drillType && drillValue && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 24, animation: "fadeIn 0.2s ease" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
            Positions: {drillValue}
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>
            {drillType === "strategy" ? "Strategy" : "Entity"} drill-down — {drillData.length} position{drillData.length !== 1 ? "s" : ""}
            {drillData.length > 0 && ` · $${(drillData.reduce((s, p) => s + (p.MARKET_VALUE_USD || 0), 0) / 1e9).toFixed(2)}B total`}
          </p>
          {drillLoading ? (
            <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>Loading positions...</div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Instrument", "Type", "Entity", "Strategy", "Book", "Currency", "Market Value (USD)", "Unrealised P&L"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: h.includes("Value") || h.includes("P&L") ? "right" : "left", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drillData.map((p, i) => (
                    <tr key={p.POSITION_ID} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontWeight: 600 }}>{p.INSTRUMENT_NAME}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: "#eff6ff", color: "#1e40af" }}>{p.INSTRUMENT_TYPE}</span></td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>{p.ENTITY}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>{p.STRATEGY}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontSize: 11, color: "#64748b" }}>{p.BOOK}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontSize: 11 }}>{p.CURRENCY}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${(p.MARKET_VALUE_USD / 1e6).toFixed(1)}M</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontVariantNumeric: "tabular-nums", color: (p.UNREALISED_PNL_USD || 0) >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{(p.UNREALISED_PNL_USD || 0) >= 0 ? "+" : ""}${((p.UNREALISED_PNL_USD || 0) / 1e3).toFixed(0)}K</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
