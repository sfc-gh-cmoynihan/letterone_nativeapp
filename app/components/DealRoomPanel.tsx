"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const STATUS_COLORS: Record<string, string> = { Live: "#16a34a", Closed: "#2563eb", Dead: "#dc2626" }
const COLORS = ["#1e3a5f", "#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4"]

export function DealRoomPanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("All")
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    fetch("/api/deals").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>
  if (!data) return <div style={{ padding: 40, color: "#dc2626" }}>Failed to load</div>

  const deals = filter === "All" ? data.deals : (data.deals || []).filter((d: any) => d.DEAL_STATUS === filter)

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Direct Lending Deal Room</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>Deal library with AI classification, model-vs-IM consistency check, and deal memory across 100+ reviews.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Deals by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={data.byStatus} dataKey="CNT" nameKey="DEAL_STATUS" cx="50%" cy="50%" outerRadius={70} innerRadius={35} label={({ DEAL_STATUS, CNT }) => `${DEAL_STATUS} (${CNT})`}>
              {(data.byStatus || []).map((e: any) => <Cell key={e.DEAL_STATUS} fill={STATUS_COLORS[e.DEAL_STATUS] || "#94a3b8"} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Deal Value by Sector</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={(data.bySector || []).slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="SECTOR" fontSize={9} angle={-15} textAnchor="end" height={50} />
              <YAxis fontSize={10} tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => `$${(v/1e6).toFixed(1)}M`} />
              <Bar dataKey="TOTAL_VALUE" fill="#8b5cf6" radius={[4, 4, 0, 0]}>{(data.bySector || []).slice(0, 6).map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["All", "Live", "Closed", "Dead"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "6px 14px", borderRadius: 8, border: filter === s ? "1px solid #1e3a5f" : "1px solid #e2e8f0", background: filter === s ? "#1e3a5f" : "#fff", color: filter === s ? "#fff" : "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{s}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569" }}>Deal</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569" }}>Sector</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569" }}>Country</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569" }}>Status</th>
                <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>Value ($M)</th>
              </tr></thead>
              <tbody>
                {(deals || []).map((d: any, i: number) => (
                  <tr key={d.DEAL_ID} onClick={() => setSelected(d)} style={{ cursor: "pointer", background: selected?.DEAL_ID === d.DEAL_ID ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>{d.DEAL_NAME}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>{d.SECTOR}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>{d.COUNTRY}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}><span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: STATUS_COLORS[d.DEAL_STATUS] ? `${STATUS_COLORS[d.DEAL_STATUS]}18` : "#f1f5f9", color: STATUS_COLORS[d.DEAL_STATUS] || "#475569" }}>{d.DEAL_STATUS}</span></td>
                    <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9", fontVariantNumeric: "tabular-nums" }}>{d.PURCHASE_PRICE_USD ? `$${(d.PURCHASE_PRICE_USD / 1e6).toFixed(0)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>{selected.DEAL_NAME}</h3>
                <div style={{ fontSize: 12, color: "#64748b" }}>{selected.SECTOR} · {selected.COUNTRY} · {selected.ASSET_TYPE}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { l: "Purchase Price", v: selected.PURCHASE_PRICE_USD ? `$${(selected.PURCHASE_PRICE_USD / 1e6).toFixed(1)}M` : "—" },
                { l: "Target IRR", v: selected.TARGET_IRR_PCT ? `${selected.TARGET_IRR_PCT}%` : "—" },
                { l: "LTV", v: selected.LTV_PCT ? `${selected.LTV_PCT}%` : "—" },
                { l: "NOI", v: selected.NOI_USD ? `$${(selected.NOI_USD / 1e6).toFixed(2)}M` : "—" },
                { l: "Underwriting NOI", v: selected.UNDERWRITING_NOI_USD ? `$${(selected.UNDERWRITING_NOI_USD / 1e6).toFixed(2)}M` : "—" },
                { l: "Current NOI", v: selected.CURRENT_NOI_USD ? `$${(selected.CURRENT_NOI_USD / 1e6).toFixed(2)}M` : "—" },
                { l: "Covenant Headroom", v: selected.COVENANT_HEADROOM_PCT ? `${selected.COVENANT_HEADROOM_PCT}%` : "—" },
                { l: "Exit Yield", v: selected.EXIT_YIELD_PCT ? `${selected.EXIT_YIELD_PCT}%` : "—" },
              ].map(f => (
                <div key={f.l} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>{f.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>{f.v}</div>
                </div>
              ))}
            </div>
            {selected.PASS_REASON && (
              <div style={{ marginTop: 16, padding: 12, background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>Reason for Passing</div>
                <div style={{ fontSize: 12, color: "#7f1d1d", lineHeight: 1.5 }}>{selected.PASS_REASON}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
