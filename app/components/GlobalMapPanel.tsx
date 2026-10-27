"use client"
import { useState, useEffect, useRef } from "react"

interface Investment {
  INVESTMENT_ID: string
  COUNTRY: string
  COUNTRY_CODE: string
  SECTOR: string
  DIVISION: string
  KEY_ASSETS: string[]
  INVESTMENT_USD: number
  PERFORMANCE: "over" | "target" | "under"
  RETURN_PCT: number
  NOTES: string
  LATITUDE: number
  LONGITUDE: number
  GEOJSON: string
  LAST_UPDATED: string
}

const PERF_COLORS: Record<string, string> = { over: "#16a34a", target: "#f59e0b", under: "#dc2626" }
const PERF_LABELS: Record<string, string> = { over: "Overperforming", target: "On Target", under: "Underachieving" }

function circleSize(usd: number): number {
  const min = 48, max = 100
  const t = Math.min(1, Math.max(0, (usd - 400_000_000) / (6_000_000_000 - 400_000_000)))
  return min + t * (max - min)
}

function lngToX(lng: number): number { return ((lng + 180) / 360) * 100 }
function latToY(lat: number): number { return ((90 - lat) / 180) * 100 }

export function GlobalMapPanel() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Investment | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/global-investments")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setInvestments(data.map(d => ({ ...d, KEY_ASSETS: Array.isArray(d.KEY_ASSETS) ? d.KEY_ASSETS : [] })))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading global investments...</div>
  if (!investments.length) return <div style={{ padding: 40, textAlign: "center", color: "#dc2626" }}>No investment data available</div>

  const totalInvestment = investments.reduce((s, i) => s + i.INVESTMENT_USD, 0)
  const overCount = investments.filter(i => i.PERFORMANCE === "over").length
  const targetCount = investments.filter(i => i.PERFORMANCE === "target").length
  const underCount = investments.filter(i => i.PERFORMANCE === "under").length

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Global Investment Map</h2>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>
        LetterOne portfolio across {investments.length} key markets — powered by Snowflake geospatial data (GEOGRAPHY)
      </p>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 10, padding: "14px 18px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Invested</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginTop: 2 }}>${(totalInvestment / 1e9).toFixed(1)}B</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Across {investments.length} countries</div>
        </div>
        {([["over", overCount], ["target", targetCount], ["under", underCount]] as const).map(([perf, count]) => (
          <div key={perf} style={{ background: "#fff", borderRadius: 10, padding: "14px 18px", border: `2px solid ${PERF_COLORS[perf]}22` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: PERF_COLORS[perf] }} />
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{PERF_LABELS[perf]}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: PERF_COLORS[perf], marginTop: 2 }}>{count}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{count === 1 ? "market" : "markets"}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginBottom: 12, padding: "8px 16px", background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", width: "fit-content" }}>
        {(["over", "target", "under"] as const).map(p => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: PERF_COLORS[p], opacity: 0.85 }} />
            <span style={{ color: "#475569", fontWeight: 500 }}>{PERF_LABELS[p]}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
          <span>|</span>
          <span>Circle size = investment scale</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 20, transition: "grid-template-columns 0.3s" }}>
        {/* Map container */}
        <div style={{
          position: "relative", borderRadius: 14, overflow: "hidden",
          border: "1px solid #e2e8f0", background: "#f0f4f8", aspectRatio: "2 / 1",
        }}>
          {/* Real world map background */}
          <img src="/world-map.png" alt="" style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.12, filter: "grayscale(100%)", pointerEvents: "none",
          }} />

          {/* Markers */}
          {investments.map(inv => {
            const size = circleSize(inv.INVESTMENT_USD)
            const color = PERF_COLORS[inv.PERFORMANCE] || "#64748b"
            const isHovered = hovered === inv.COUNTRY_CODE
            const isSelected = selected?.COUNTRY_CODE === inv.COUNTRY_CODE

            return (
              <div key={inv.INVESTMENT_ID} style={{
                position: "absolute",
                left: `${lngToX(inv.LONGITUDE)}%`, top: `${latToY(inv.LATITUDE)}%`,
                transform: "translate(-50%, -50%)",
                zIndex: isHovered || isSelected ? 20 : 10,
              }}>
                {/* Pulse */}
                {!isSelected && (
                  <div style={{
                    position: "absolute", left: "50%", top: "50%",
                    width: size + 20, height: size + 20, borderRadius: "50%",
                    border: `2px solid ${color}`, transform: "translate(-50%, -50%)",
                    animation: "pulse-ring 2.5s ease-out infinite", opacity: 0,
                  }} />
                )}

                {/* Selection ring */}
                {isSelected && (
                  <div style={{
                    position: "absolute", left: "50%", top: "50%",
                    width: size + 12, height: size + 12, borderRadius: "50%",
                    border: `3px solid ${color}`, transform: "translate(-50%, -50%)", opacity: 0.5,
                  }} />
                )}

                {/* Shadow */}
                <div style={{
                  position: "absolute", left: 1, top: 2,
                  width: size, height: size, borderRadius: "50%",
                  background: "#000", opacity: 0.08,
                }} />

                {/* Main bubble */}
                <div
                  onClick={() => setSelected(isSelected ? null : inv)}
                  onMouseEnter={() => setHovered(inv.COUNTRY_CODE)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    width: isHovered ? size + 6 : size, height: isHovered ? size + 6 : size,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color})`,
                    border: "3px solid #fff",
                    boxShadow: isHovered || isSelected ? `0 4px 20px ${color}66, 0 0 0 4px ${color}22` : "0 2px 8px rgba(0,0,0,0.15)",
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease", position: "relative",
                  }}
                >
                  <span style={{ color: "#fff", fontSize: size > 70 ? 15 : size > 55 ? 12 : 10, fontWeight: 800, lineHeight: 1.1, fontFamily: "system-ui" }}>
                    ${(inv.INVESTMENT_USD / 1e9).toFixed(1)}B
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.9)", fontSize: size > 70 ? 11 : 8, fontWeight: 600, fontFamily: "system-ui", marginTop: 1 }}>
                    {inv.COUNTRY_CODE}
                  </span>
                </div>

                {/* Country label */}
                <div style={{
                  position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                  marginTop: 4, whiteSpace: "nowrap", fontSize: 10, fontWeight: 700,
                  color: "#475569", textShadow: "0 1px 2px rgba(255,255,255,0.8)", fontFamily: "system-ui",
                }}>
                  {inv.COUNTRY}
                </div>

                {/* Hover card */}
                {isHovered && !isSelected && (
                  <div style={{
                    position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
                    marginBottom: 8, background: "#1e293b", borderRadius: 10, padding: "10px 14px",
                    minWidth: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", zIndex: 30,
                  }}>
                    <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 700, marginBottom: 4, fontFamily: "system-ui" }}>{inv.COUNTRY}</div>
                    <div style={{ color: "#94a3b8", fontSize: 11, fontFamily: "system-ui" }}>{inv.SECTOR}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #334155" }}>
                      <span style={{ color: "#f8fafc", fontSize: 12, fontWeight: 700, fontFamily: "system-ui" }}>${(inv.INVESTMENT_USD / 1e9).toFixed(1)}B</span>
                      <span style={{ color, fontSize: 12, fontWeight: 700, fontFamily: "system-ui" }}>
                        {inv.RETURN_PCT >= 0 ? "+" : ""}{inv.RETURN_PCT}%
                      </span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: 10, marginTop: 4, fontFamily: "monospace" }}>
                      {inv.LATITUDE.toFixed(1)}N, {Math.abs(inv.LONGITUDE).toFixed(1)}{inv.LONGITUDE >= 0 ? "E" : "W"}
                    </div>
                    <div style={{
                      position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
                      width: 0, height: 0, borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent", borderTop: "6px solid #1e293b",
                    }} />
                  </div>
                )}
              </div>
            )
          })}

          <style>{`@keyframes pulse-ring { 0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.4; } 100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; } }`}</style>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: "#fff", borderRadius: 14, border: `2px solid ${PERF_COLORS[selected.PERFORMANCE]}`, padding: 0, overflow: "hidden", alignSelf: "start" }}>
            <div style={{ background: PERF_COLORS[selected.PERFORMANCE], padding: "16px 20px", color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{selected.COUNTRY}</div>
                  <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>{selected.SECTOR}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Close</button>
              </div>
            </div>

            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Investment</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>${(selected.INVESTMENT_USD / 1e9).toFixed(1)}B</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Return</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: selected.RETURN_PCT >= 0 ? "#16a34a" : "#dc2626" }}>
                    {selected.RETURN_PCT >= 0 ? "+" : ""}{selected.RETURN_PCT}%
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "8px 12px", background: `${PERF_COLORS[selected.PERFORMANCE]}11`, borderRadius: 8, border: `1px solid ${PERF_COLORS[selected.PERFORMANCE]}33` }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: PERF_COLORS[selected.PERFORMANCE] }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: PERF_COLORS[selected.PERFORMANCE] }}>{PERF_LABELS[selected.PERFORMANCE]}</span>
              </div>

              {/* Geospatial info */}
              <div style={{ marginBottom: 14, padding: "8px 12px", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
                <div style={{ fontSize: 10, color: "#0369a1", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Snowflake GEOGRAPHY</div>
                <div style={{ fontSize: 12, color: "#0c4a6e", fontWeight: 600, fontFamily: "monospace" }}>
                  POINT({selected.LONGITUDE} {selected.LATITUDE})
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                  {selected.LATITUDE.toFixed(4)}°N, {Math.abs(selected.LONGITUDE).toFixed(4)}°{selected.LONGITUDE >= 0 ? "E" : "W"}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Division</div>
                <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 600 }}>{selected.DIVISION}</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Key Assets</div>
                {selected.KEY_ASSETS.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: i < selected.KEY_ASSETS.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: PERF_COLORS[selected.PERFORMANCE], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>{a}</span>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Notes</div>
                <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, margin: 0 }}>{selected.NOTES}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Investment table */}
      <div style={{ marginTop: 20, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Investment Summary</h3>
          <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>Source: LETTERONE_DB.PUBLIC.GLOBAL_INVESTMENTS</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fafbfc" }}>
              {["Country", "Sector", "Division", "Key Assets", "Investment", "Return", "Coordinates", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: h === "Investment" || h === "Return" ? "right" : "left", fontWeight: 700, fontSize: 11, color: "#475569", borderBottom: "2px solid #e2e8f0", textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {investments.map((inv, i) => (
              <tr key={inv.INVESTMENT_ID} onClick={() => setSelected(inv)}
                style={{ background: selected?.INVESTMENT_ID === inv.INVESTMENT_ID ? `${PERF_COLORS[inv.PERFORMANCE]}08` : i % 2 === 0 ? "#fff" : "#fafbfc", cursor: "pointer", transition: "background 0.15s" }}>
                <td style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontWeight: 700 }}>
                  <span style={{ marginRight: 6 }}>{inv.COUNTRY_CODE === "US" ? "\u{1F1FA}\u{1F1F8}" : inv.COUNTRY_CODE === "UK" ? "\u{1F1EC}\u{1F1E7}" : inv.COUNTRY_CODE === "ES" ? "\u{1F1EA}\u{1F1F8}" : inv.COUNTRY_CODE === "TR" ? "\u{1F1F9}\u{1F1F7}" : "\u{1F1E9}\u{1F1EA}"}</span>
                  {inv.COUNTRY}
                </td>
                <td style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>{inv.SECTOR}</td>
                <td style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>{inv.DIVISION}</td>
                <td style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontSize: 12, color: "#475569" }}>{inv.KEY_ASSETS.join(", ")}</td>
                <td style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${(inv.INVESTMENT_USD / 1e9).toFixed(1)}B</td>
                <td style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: inv.RETURN_PCT >= 0 ? "#16a34a" : "#dc2626" }}>
                  {inv.RETURN_PCT >= 0 ? "+" : ""}{inv.RETURN_PCT}%
                </td>
                <td style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>
                  {inv.LATITUDE.toFixed(1)}°N, {Math.abs(inv.LONGITUDE).toFixed(1)}°{inv.LONGITUDE >= 0 ? "E" : "W"}
                </td>
                <td style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${PERF_COLORS[inv.PERFORMANCE]}15`, color: PERF_COLORS[inv.PERFORMANCE] }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: PERF_COLORS[inv.PERFORMANCE] }} />
                    {PERF_LABELS[inv.PERFORMANCE]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
