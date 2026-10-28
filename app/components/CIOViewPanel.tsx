"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["#1e3a5f", "#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6"]

export function CIOViewPanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [entity, setEntity] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/cio-view").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>
  if (!data) return <div style={{ padding: 40, color: "#dc2626" }}>Failed to load</div>

  const entities: any[] = data.exposureByEntity || []
  const entityColor = (e: string) => COLORS[Math.max(entities.findIndex(x => x.ENTITY === e), 0) % COLORS.length]
  const entityPositions = entity ? (data.positions || []).filter((p: any) => p.ENTITY === entity) : []
  const pickEntity = (e: string) => {
    setEntity(prev => prev === e ? null : e)
    setTimeout(() => document.getElementById("entity-drilldown")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }
  const fmtM = (v: number) => `${v < 0 ? "-" : ""}$${(Math.abs(v || 0) / 1e6).toFixed(1)}M`
  const th = { padding: "10px 12px", fontWeight: 700, fontSize: 11, color: "#475569" } as const
  const td = { padding: "8px 12px", borderBottom: "1px solid #f1f5f9" } as const

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>CIO Executive View</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>One-click view for senior executives. Return attribution, risk by strategy, cash concentration.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>Exposure by Entity</h3>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Click a segment to see its positions</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={data.exposureByEntity} dataKey="TOTAL_MV" nameKey="ENTITY" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label={({ ENTITY }) => ENTITY}
              style={{ cursor: "pointer" }} onClick={(e: any) => e?.ENTITY && pickEntity(e.ENTITY)}>
              {entities.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} cursor="pointer"
                stroke={entity === e.ENTITY ? "#0f172a" : "#fff"} strokeWidth={entity === e.ENTITY ? 3 : 1}
                opacity={entity && entity !== e.ENTITY ? 0.45 : 1} />)}
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

      {entity && (
        <div id="entity-drilldown" style={{ background: "#fff", border: `2px solid ${entityColor(entity)}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 5, background: entityColor(entity), marginRight: 8 }} />
              {entity} · {entityPositions.length} positions · {fmtM(entityPositions.reduce((s: number, p: any) => s + (p.MARKET_VALUE_USD || 0), 0))} market value · {fmtM(entityPositions.reduce((s: number, p: any) => s + (p.UNREALISED_PNL_USD || 0), 0))} unrealised P&L
            </h3>
            <button onClick={() => setEntity(null)} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, cursor: "pointer", color: "#475569" }}>✕ Close</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "#f8fafc" }}>
              <th style={{ ...th, textAlign: "left" }}>Instrument</th>
              <th style={{ ...th, textAlign: "left" }}>Type</th>
              <th style={{ ...th, textAlign: "left" }}>ISIN</th>
              <th style={{ ...th, textAlign: "left" }}>Strategy</th>
              <th style={{ ...th, textAlign: "left" }}>Book</th>
              <th style={{ ...th, textAlign: "right" }}>Quantity</th>
              <th style={{ ...th, textAlign: "left" }}>Ccy</th>
              <th style={{ ...th, textAlign: "right" }}>Market Value</th>
              <th style={{ ...th, textAlign: "right" }}>Unrealised P&L</th>
            </tr></thead>
            <tbody>
              {entityPositions.map((p: any, i: number) => (
                <tr key={p.POSITION_ID || i} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ ...td, fontWeight: 600 }}>{p.INSTRUMENT_NAME}</td>
                  <td style={td}>{p.INSTRUMENT_TYPE}</td>
                  <td style={{ ...td, fontFamily: "monospace", color: "#64748b" }}>{p.ISIN}</td>
                  <td style={td}>{p.STRATEGY}</td>
                  <td style={td}>{p.BOOK}</td>
                  <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Number(p.QUANTITY || 0).toLocaleString()}</td>
                  <td style={td}>{p.CURRENCY}</td>
                  <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmtM(p.MARKET_VALUE_USD)}</td>
                  <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums", color: (p.UNREALISED_PNL_USD || 0) < 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{fmtM(p.UNREALISED_PNL_USD)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
