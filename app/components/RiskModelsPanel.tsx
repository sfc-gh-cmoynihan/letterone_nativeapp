"use client"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from "recharts"

const COLORS = ["#1e3a5f", "#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6"]

export function RiskModelsPanel() {
  const [hfData, setHfData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/hedge-funds").then(r => r.json()).then(d => { setHfData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>
  if (!hfData) return <div style={{ padding: 40, color: "#dc2626" }}>Failed to load</div>

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Risk Models & Hedge Fund Monitoring</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>Transparent calculations with Cortex Code. Parameters visible, assumptions changeable, results persisted.</p>

      <div style={{ background: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#1e40af" }}>Monte Carlo VaR (Demo Centrepiece)</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
          In the live demo, Sam prompts Cortex Code: "Build a 1-day 99% Monte Carlo VaR for the treasury portfolio with 10,000 paths, using a 3-year EWMA covariance matrix."
          Cortex Code writes the Snowpark Python. Parameters sit in visible cells. Change one assumption and the result moves. Persist and schedule daily.
        </p>
        <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
          {[{ label: "Confidence", value: "99%" }, { label: "Paths", value: "10,000" }, { label: "Lookback", value: "3Y EWMA" }, { label: "1-Day VaR", value: "$12.4M" }].map(p => (
            <div key={p.label} style={{ background: "#fff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>{p.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1e40af", marginTop: 2 }}>{p.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Hedge Fund AUM by Strategy</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hfData.byStrategy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="FUND_STRATEGY" fontSize={9} angle={-15} textAnchor="end" height={60} />
              <YAxis fontSize={10} tickFormatter={v => `$${(v/1e9).toFixed(0)}B`} />
              <Tooltip formatter={(v: number) => `$${(v/1e9).toFixed(2)}B`} />
              <Bar dataKey="TOTAL_AUM" fill="#1e3a5f" radius={[4, 4, 0, 0]}>
                {(hfData.byStrategy || []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Equity Correlation (3Y vs 5Y)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="CORRELATION_EQUITY_3Y" name="3Y Corr" fontSize={10} domain={[-1, 1]} />
              <YAxis dataKey="CORRELATION_EQUITY_5Y" name="5Y Corr" fontSize={10} domain={[-1, 1]} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={hfData.topCorrelation} fill="#2563eb" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <h3 style={{ margin: 0, padding: "16px 20px", fontSize: 14, fontWeight: 700, color: "#1e293b", borderBottom: "1px solid #e2e8f0" }}>Hedge Fund Returns — Latest Month</h3>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569" }}>Fund</th>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#475569" }}>Strategy</th>
              <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>Return</th>
              <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>AUM ($B)</th>
              <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>3Y Corr</th>
              <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 11, color: "#475569" }}>5Y Corr</th>
            </tr></thead>
            <tbody>
              {(hfData.topCorrelation || []).map((f: any, i: number) => (
                <tr key={f.FUND_NAME} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>{f.FUND_NAME}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>{f.FUND_STRATEGY}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: f.MONTHLY_RETURN_PCT >= 0 ? "#16a34a" : "#dc2626" }}>{f.MONTHLY_RETURN_PCT?.toFixed(2)}%</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9", fontVariantNumeric: "tabular-nums" }}>${(f.AUM_USD / 1e9).toFixed(2)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{f.CORRELATION_EQUITY_3Y?.toFixed(3)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{f.CORRELATION_EQUITY_5Y?.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
