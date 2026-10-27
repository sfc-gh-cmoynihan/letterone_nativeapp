"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { geoNaturalEarth1, geoPath } from "d3-geo"
import { feature } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"
import type { FeatureCollection, Geometry } from "geojson"
import worldAtlas from "world-atlas/countries-110m.json"

const COLORS = ["#1e3a5f", "#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4", "#ec4899"]

const INVESTMENTS = [
  { id: "us", country: "United States", sector: "Health", name: "VAMED US Health", investment: 1200, lat: 39.8, lon: -98.5, color: "#2563eb" },
  { id: "uk", country: "United Kingdom", sector: "Health", name: "LetterOne Health UK", investment: 850, lat: 52.5, lon: -1.5, color: "#16a34a" },
  { id: "es", country: "Spain", sector: "DEA", name: "DEA Finance Spain", investment: 620, lat: 40.4, lon: -3.7, color: "#f59e0b" },
  { id: "tr", country: "Turkey", sector: "DIA", name: "DIA Holdings Turkey", investment: 480, lat: 39.9, lon: 32.9, color: "#dc2626" },
  { id: "de", country: "Germany", sector: "Health", name: "VAMED Germany", investment: 950, lat: 51.2, lon: 10.4, color: "#8b5cf6" },
]

// Country label placement, chosen so the close European markers (UK / DE) don't collide
const LABEL_POS: Record<string, "left" | "right" | "below"> = { uk: "left", de: "right" }

const MAP_W = 800, MAP_H = 420
// Fit the projection to the area covering all markets (North America to Turkey)
const PROJECTION = geoNaturalEarth1().fitExtent(
  [[30, 30], [MAP_W - 30, MAP_H - 30]],
  { type: "MultiPoint", coordinates: [[-125, 22], [45, 22], [-125, 62], [45, 62]] },
)
const PATH = geoPath(PROJECTION)
const COUNTRY_PATHS = (feature(
  worldAtlas as unknown as Topology,
  (worldAtlas as unknown as Topology).objects.countries as GeometryCollection,
) as FeatureCollection<Geometry>).features.map(f => PATH(f) || "")

function InvestmentMap() {
  const [selected, setSelected] = useState<string | null>(null)
  const W = MAP_W, H = MAP_H

  const maxInv = Math.max(...INVESTMENTS.map(i => i.investment))
  const minR = 10, maxR = 20

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Global Investments</h3>
      <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
          <rect x={0} y={0} width={W} height={H} rx={8} fill="#f0f4f8" />
          {COUNTRY_PATHS.map((d, i) => (
            <path key={i} d={d} fill="#dbe3ec" stroke="#fff" strokeWidth={0.5} />
          ))}

          {INVESTMENTS.map(inv => {
            const [cx, cy] = PROJECTION([inv.lon, inv.lat]) ?? [0, 0]
            const r = minR + ((inv.investment / maxInv) * (maxR - minR))
            const isSelected = selected === inv.id
            const pos = LABEL_POS[inv.id] ?? "below"
            const label = pos === "left" ? { x: cx - r - 6, y: cy + 4, anchor: "end" as const }
              : pos === "right" ? { x: cx + r + 6, y: cy + 4, anchor: "start" as const }
              : { x: cx, y: cy + r + 14, anchor: "middle" as const }
            return (
              <g key={inv.id} onClick={() => setSelected(isSelected ? null : inv.id)} style={{ cursor: "pointer" }}>
                <circle cx={cx} cy={cy} r={r + 4} fill={inv.color} opacity={0.15} />
                <circle cx={cx} cy={cy} r={r} fill={inv.color} opacity={isSelected ? 1 : 0.75}
                  stroke="#fff" strokeWidth={2.5} />
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central"
                  fill="#fff" fontSize={11} fontWeight={700} style={{ pointerEvents: "none" }}>
                  {inv.country === "United States" ? "US" : inv.country === "United Kingdom" ? "UK" : inv.country === "Spain" ? "ES" : inv.country === "Turkey" ? "TR" : "DE"}
                </text>
                <text x={label.x} y={label.y} textAnchor={label.anchor} fill="#475569" fontSize={10.5} fontWeight={600}
                  stroke="#f0f4f8" strokeWidth={3} paintOrder="stroke">
                  {inv.country}
                </text>
                {isSelected && (
                  <g>
                    <rect x={cx - 95} y={cy - r - 64} width={190} height={52} rx={8} fill="#1e293b" opacity={0.95} />
                    <polygon points={`${cx - 6},${cy - r - 12} ${cx + 6},${cy - r - 12} ${cx},${cy - r - 4}`} fill="#1e293b" opacity={0.95} />
                    <text x={cx} y={cy - r - 46} textAnchor="middle" fill="#f1f5f9" fontSize={12} fontWeight={700}>{inv.name}</text>
                    <text x={cx} y={cy - r - 30} textAnchor="middle" fill="#94a3b8" fontSize={10.5}>{inv.sector} &middot; ${inv.investment}M</text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {INVESTMENTS.map(inv => (
          <div key={inv.id}
            onClick={() => setSelected(selected === inv.id ? null : inv.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: selected === inv.id ? "#1e293b" : "#64748b", fontWeight: selected === inv.id ? 600 : 400, cursor: "pointer" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: inv.color }} />
            {inv.country}: ${inv.investment}M
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, accent, onClick }: { label: string; value: string; sub?: string; accent?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px", flex: 1,
        borderTop: `3px solid ${accent || "#1e3a5f"}`,
        cursor: onClick ? "pointer" : "default", transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)" } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none" }}
    >
      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{label}{onClick && <span style={{ marginLeft: 6, fontSize: 10, color: "#94a3b8" }}>&#8599;</span>}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

interface DashboardData {
  positions: { CNT: number; TOTAL_MV: number }
  cash: { ACCOUNTS: number; TOTAL_CASH: number }
  cloBook: { TRANCHES: number; TOTAL_MV: number }
  deals: { DEAL_STATUS: string; CNT: number }[]
  investors: { CNT: number; TOTAL_COMMITTED: number }
  todayPnl: { TODAY_PNL: number }
  openBreaks: { OPEN_BREAKS: number; TOTAL_DIFF: number }
  cashByBank: { BANK_NAME: string; CURRENCY: string; ACCOUNTS: number; TOTAL_USD: number }[]
}

export function DashboardPanel({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cashExpanded, setCashExpanded] = useState(false)

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading dashboard...</div>
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#dc2626" }}>Failed to load</div>

  const dealPie = data.deals.map((d, i) => ({ ...d, fill: COLORS[i] }))
  const liveDeals = data.deals.find(d => d.DEAL_STATUS === "Live")?.CNT || 0

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>LetterOne 360</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>One governed Data & AI platform for Treasury Operations, Risk, Trading and Direct Lending</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Portfolio Positions" value={data.positions.CNT?.toLocaleString() || "0"} sub={`$${((data.positions.TOTAL_MV || 0) / 1e9).toFixed(2)}B total exposure`} accent="#1e3a5f" onClick={() => onNavigate?.("risk")} />
        <MetricCard label="Cash Accounts" value={data.cash.ACCOUNTS?.toLocaleString() || "0"} sub={`$${((data.cash.TOTAL_CASH || 0) / 1e6).toFixed(0)}M total cash`} accent="#2563eb" onClick={() => setCashExpanded(!cashExpanded)} />
        <MetricCard label="CLO/ABS Book" value={`${data.cloBook.TRANCHES || 0} tranches`} sub={`$${((data.cloBook.TOTAL_MV || 0) / 1e6).toFixed(0)}M market value`} accent="#16a34a" onClick={() => onNavigate?.("structured-credit")} />
        <MetricCard label="Deal Pipeline" value={`${liveDeals} live`} sub={`${data.deals.reduce((s, d) => s + d.CNT, 0)} total deals reviewed`} accent="#8b5cf6" onClick={() => onNavigate?.("deal-room")} />
      </div>

      {cashExpanded && data.cashByBank && data.cashByBank.length > 0 && (
        <div style={{ background: "#fff", border: "2px solid #2563eb", borderRadius: 12, padding: 20, marginBottom: 24, animation: "fadeIn 0.2s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Cash Balances by Bank &amp; Currency</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>{data.cashByBank.length} rows</span>
              <button onClick={() => onNavigate?.("treasury-ops")} style={{ fontSize: 11, color: "#2563eb", background: "none", border: "1px solid #2563eb", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontWeight: 600 }}>Full view &#8599;</button>
              <button onClick={() => setCashExpanded(false)} style={{ fontSize: 11, color: "#64748b", background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>Close</button>
            </div>
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0" }}>Bank</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0" }}>Currency</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0" }}>Accounts</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0" }}>Balance (USD)</th>
                </tr>
              </thead>
              <tbody>
                {data.cashByBank.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", fontWeight: 600 }}>{r.BANK_NAME}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}><span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: "#eff6ff", color: "#1e40af" }}>{r.CURRENCY}</span></td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.ACCOUNTS}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#1e293b" }}>${((r.TOTAL_USD || 0) / 1e6).toFixed(1)}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Today's P&L" value={`$${((data.todayPnl.TODAY_PNL || 0) / 1e6).toFixed(2)}M`} accent="#16a34a" onClick={() => onNavigate?.("treasury-ops")} />
        <MetricCard label="Open Rec Breaks" value={data.openBreaks.OPEN_BREAKS?.toString() || "0"} sub={`$${((data.openBreaks.TOTAL_DIFF || 0) / 1e6).toFixed(2)}M total variance`} accent={data.openBreaks.OPEN_BREAKS > 5 ? "#dc2626" : "#f59e0b"} onClick={() => onNavigate?.("reconciliation")} />
        <MetricCard label="Owners" value={data.investors.CNT?.toString() || "0"} sub={`$${((data.investors.TOTAL_COMMITTED || 0) / 1e9).toFixed(2)}B committed`} accent="#06b6d4" onClick={() => onNavigate?.("cio-view")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>Deal Pipeline by Status<span onClick={() => onNavigate?.("deal-room")} style={{ fontSize: 12, fontWeight: 500, color: "#2563eb", cursor: "pointer" }}>View all &#8599;</span></h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={dealPie} dataKey="CNT" nameKey="DEAL_STATUS" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                label={({ DEAL_STATUS, CNT }) => `${DEAL_STATUS} (${CNT})`}
                onClick={() => onNavigate?.("deal-room")}
                style={{ cursor: "pointer" }}>
                {dealPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Four Governed Experiences</h3>
          {[
            { name: "Treasury Ops Agent", desc: "Daily operations, cash, reconciliation", color: "#2563eb", tab: "treasury-ops" },
            { name: "Risk Agent", desc: "Portfolio exposure, VaR, hedge fund monitoring", color: "#16a34a", tab: "risk" },
            { name: "Structured Credit Agent", desc: "CLO/ABS monitoring, document analysis", color: "#f59e0b", tab: "structured-credit" },
            { name: "Direct Lending Agent", desc: "Deal review, counterparty validation", color: "#8b5cf6", tab: "deal-room" },
          ].map(a => (
            <div key={a.name}
              onClick={() => onNavigate?.(a.tab)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f1f5f9", cursor: "pointer", borderRadius: 6, transition: "background 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{a.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{a.desc}</div>
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>&#8599;</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <InvestmentMap />
      </div>
    </div>
  )
}
