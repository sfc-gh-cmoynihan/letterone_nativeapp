"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["#1e3a5f", "#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#06b6d4", "#ec4899"]

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px", flex: 1, borderTop: `3px solid ${accent || "#1e3a5f"}` }}>
      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{label}</div>
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
}

export function DashboardPanel() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading dashboard...</div>
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#dc2626" }}>Failed to load</div>

  const dealPie = data.deals.map((d, i) => ({ ...d, fill: COLORS[i] }))
  const liveDeals = data.deals.find(d => d.DEAL_STATUS === "Live")?.CNT || 0

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>LetterOne Treasury Platform</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>One governed Data & AI platform for Treasury Operations, Risk, Trading and Direct Lending</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Portfolio Positions" value={data.positions.CNT?.toLocaleString() || "0"} sub={`$${((data.positions.TOTAL_MV || 0) / 1e9).toFixed(2)}B total exposure`} accent="#1e3a5f" />
        <MetricCard label="Cash Accounts" value={data.cash.ACCOUNTS?.toLocaleString() || "0"} sub={`$${((data.cash.TOTAL_CASH || 0) / 1e6).toFixed(0)}M total cash`} accent="#2563eb" />
        <MetricCard label="CLO/ABS Book" value={`${data.cloBook.TRANCHES || 0} tranches`} sub={`$${((data.cloBook.TOTAL_MV || 0) / 1e6).toFixed(0)}M market value`} accent="#16a34a" />
        <MetricCard label="Deal Pipeline" value={`${liveDeals} live`} sub={`${data.deals.reduce((s, d) => s + d.CNT, 0)} total deals reviewed`} accent="#8b5cf6" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Today's P&L" value={`$${((data.todayPnl.TODAY_PNL || 0) / 1e6).toFixed(2)}M`} accent="#16a34a" />
        <MetricCard label="Open Rec Breaks" value={data.openBreaks.OPEN_BREAKS?.toString() || "0"} sub={`$${((data.openBreaks.TOTAL_DIFF || 0) / 1e6).toFixed(2)}M total variance`} accent={data.openBreaks.OPEN_BREAKS > 5 ? "#dc2626" : "#f59e0b"} />
        <MetricCard label="Investors" value={data.investors.CNT?.toString() || "0"} sub={`$${((data.investors.TOTAL_COMMITTED || 0) / 1e9).toFixed(2)}B committed`} accent="#06b6d4" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Deal Pipeline by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={dealPie} dataKey="CNT" nameKey="DEAL_STATUS" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                label={({ DEAL_STATUS, CNT }) => `${DEAL_STATUS} (${CNT})`}>
                {dealPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Four Governed Experiences</h3>
          {[
            { name: "Treasury Ops Agent", desc: "Daily operations, cash, reconciliation", color: "#2563eb" },
            { name: "Risk Agent", desc: "Portfolio exposure, VaR, hedge fund monitoring", color: "#16a34a" },
            { name: "Structured Credit Agent", desc: "CLO/ABS monitoring, document analysis", color: "#f59e0b" },
            { name: "Direct Lending Agent", desc: "Deal review, counterparty validation", color: "#8b5cf6" },
          ].map(a => (
            <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{a.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
