"use client"
import { useState, useEffect } from "react"

export function GovernancePanel() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/governance").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</div>
  if (!data) return <div style={{ padding: 40, color: "#dc2626" }}>Failed to load</div>

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Governance & Access Control</h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>Role-based access, business rules, and lineage — governance shown, not stated.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700 }}>Roles & Access</h3>
          {(data.roles || []).map((r: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#1e3a5f" }}>{r.ROLE_NAME}</span>
              </div>
              <span style={{ fontSize: 12, color: "#64748b", maxWidth: 300, textAlign: "right" }}>{r.ACCESS}</span>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: 16, background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", marginBottom: 6 }}>Demo Moment: Access Refusal</div>
            <div style={{ fontSize: 12, color: "#7f1d1d", lineHeight: 1.6 }}>
              <div style={{ marginBottom: 6 }}>Agents inherit the caller's Snowflake role — data access is enforced at query time, not the application layer.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 12px", background: "#fff5f5", borderRadius: 6 }}>
                <div><span style={{ fontWeight: 600 }}>1.</span> Log in as a <span style={{ fontFamily: "monospace", fontWeight: 600 }}>TRADING_SC</span> user</div>
                <div><span style={{ fontWeight: 600 }}>2.</span> Open the <span style={{ fontWeight: 600 }}>Agent</span> tab → select <span style={{ fontWeight: 600 }}>Direct Lending</span></div>
                <div><span style={{ fontWeight: 600 }}>3.</span> Ask: <em>"Show me live deals with LTV above 60%"</em></div>
                <div><span style={{ fontWeight: 600 }}>4.</span> Access is refused — <span style={{ fontFamily: "monospace" }}>DEAL_LIBRARY</span> and <span style={{ fontFamily: "monospace" }}>DEAL_DOCUMENTS</span> are granted only to <span style={{ fontFamily: "monospace", fontWeight: 600 }}>DIRECT_LENDING</span> and <span style={{ fontFamily: "monospace", fontWeight: 600 }}>EXEC_READONLY</span></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700 }}>Business Rules Repository</h3>
          <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px" }}>Rules in governed SQL, not VBA. Version-controlled with change history.</p>
          {(data.rules || []).map((r: any, i: number) => (
            <div key={r.RULE_ID} style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{r.RULE_NAME}</span>
                  <span style={{ marginLeft: 8, padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: "#f0f9ff", color: "#1e40af" }}>{r.RULE_CATEGORY}</span>
                </div>
                <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>v{r.VERSION}</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontFamily: "monospace" }}>{r.RULE_SQL}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Updated by {r.UPDATED_BY} · {r.UPDATED_AT?.split("T")[0]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: 24 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1e40af" }}>Golden Thread: One Definition, One Answer</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
          "USD-equivalent exposure by entity" is defined once in the SV_TREASURY semantic view. The Treasury Ops agent and the Risk agent both query the same definition.
          Ask each agent the same question — the number is identical. At the close, trace the lineage from the Enfusion data share through the Dynamic Table and semantic view to both agents.
          This directly addresses Matei's requirement that an answer "would be the same no matter who asks it".
        </p>
      </div>
    </div>
  )
}
