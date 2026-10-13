"use client"
import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const DEAL_COLORS: Record<string, string> = { "BlueMountain CLO 2022-1": "#1e3a5f", "Carlyle Global CLO 2023-2": "#2563eb", "Blackstone Credit CLO 2024-1": "#16a34a", "PGIM CLO 2021-3": "#f59e0b", "Ares CLO 2020-1": "#dc2626" }

export function TrusteeReportsPanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [metric, setMetric] = useState<string>("OC_TEST_CUSHION_PCT")

  useEffect(() => {
    fetch("/api/trustee-metrics").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>
  if (!data) return <div style={{ padding: 40, color: "#dc2626" }}>Failed to load</div>

  const deals = [...new Set((data.metrics || []).map((m: any) => m.DEAL_NAME))]
  const months = [...new Set((data.metrics || []).map((m: any) => m.REPORT_MONTH))].sort()
  const chartData = months.map(month => {
    const row: any = { month }
    deals.forEach(deal => {
      const point = (data.metrics || []).find((m: any) => m.DEAL_NAME === deal && m.REPORT_MONTH === month)
      row[deal] = point ? point[metric] : null
    })
    return row
  })

  const metricLabels: Record<string, string> = { OC_TEST_CUSHION_PCT: "OC Test Cushion (%)", IC_TEST_CUSHION_PCT: "IC Test Cushion (%)", WARF: "WARF", CCC_BUCKET_PCT: "CCC Bucket (%)", DEFAULTED_PAR_PCT: "Defaulted Par (%)", DIVERSITY_SCORE: "Diversity Score" }

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Trustee Report Monitoring</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>AI_EXTRACT pulls key metrics from trustee PDFs. Trend and alert — no Excel step.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(metricLabels).map(([key, label]) => (
          <button key={key} onClick={() => setMetric(key)} style={{ padding: "6px 14px", borderRadius: 8, border: metric === key ? "1px solid #1e3a5f" : "1px solid #e2e8f0", background: metric === key ? "#1e3a5f" : "#fff", color: metric === key ? "#fff" : "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{label}</button>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{metricLabels[metric]} Trend (6 Months)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" fontSize={11} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Legend />
            {deals.map(deal => (
              <Line key={deal} type="monotone" dataKey={deal} stroke={DEAL_COLORS[deal] || "#94a3b8"} strokeWidth={2} dot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <h3 style={{ margin: 0, padding: "16px 20px", fontSize: 14, fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>Latest Trustee Report Summary</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "#f8fafc" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569" }}>Deal</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>OC Cushion</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>IC Cushion</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>WARF</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>CCC %</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>Default %</th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>Diversity</th>
          </tr></thead>
          <tbody>
            {(data.latest || []).map((m: any, i: number) => (
              <tr key={m.DEAL_NAME} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>{m.DEAL_NAME}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9", color: m.OC_TEST_CUSHION_PCT < 3 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{m.OC_TEST_CUSHION_PCT?.toFixed(2)}%</td>
                <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{m.IC_TEST_CUSHION_PCT?.toFixed(2)}%</td>
                <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{m.WARF}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9", color: m.CCC_BUCKET_PCT > 7.5 ? "#dc2626" : "#475569" }}>{m.CCC_BUCKET_PCT?.toFixed(2)}%</td>
                <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{m.DEFAULTED_PAR_PCT?.toFixed(2)}%</td>
                <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{m.DIVERSITY_SCORE}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
