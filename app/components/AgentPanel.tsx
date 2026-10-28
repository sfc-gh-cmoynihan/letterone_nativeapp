"use client"
import { useState, useRef, useEffect } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
}

const MODELS = [
  { value: "claude-sonnet-5", label: "Claude Sonnet 5 (Default)" },
  { value: "claude-opus-5", label: "Claude Opus 5" },
  { value: "claude-opus-4-8", label: "Claude Opus 4-8" },
  { value: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
  { value: "llama4-maverick", label: "Llama 4 Maverick" },
  { value: "openai-gpt-5.2", label: "OpenAI GPT 5.2" },
  { value: "mistral-large3", label: "Mistral Large 3" },
]

const AGENT_OPTIONS = [
  { id: "treasury-ops", label: "Treasury Ops", color: "#2563eb" },
  { id: "risk", label: "Risk", color: "#16a34a" },
  { id: "structured-credit", label: "Structured Credit", color: "#f59e0b" },
  { id: "direct-lending", label: "Direct Lending", color: "#8b5cf6" },
  { id: "finance", label: "Finance", color: "#be185d" },
  { id: "cfo", label: "Group CFO", color: "#11567F" },
  { id: "coo", label: "COO", color: "#0891b2" },
]

const SAMPLE_QUESTIONS: Record<string, string[]> = {
  // Robert Meadows, Finance
  finance: [
    "What is group NAV at the latest valuation date and how has it moved versus last quarter?",
    "Which holdings have the largest unrealised gain or loss versus cost?",
    "What is the MOIC for each holding at the latest valuation date?",
    "What is net debt to EBITDA for each portfolio business?",
    "How much dividend income has each holding paid us over the last four quarters?",
    "Which cost centres are over budget year to date and by how much?",
    "What is the full-year opex forecast versus budget by cost centre?",
    "Which entities fall below minimum liquidity policy in the 13-week forecast?",
    "What is total cash by entity and currency in USD equivalent?",
    "What is PnL by entity and strategy for the latest report date?",
  ],
  // Robert Maddows, Chief Operating Officer
  coo: [
    "Which bank counterparties hold more than 20% of our cash?",
    "Show total cash by legal entity, bank and currency",
    "Which entities have the least liquidity headroom over the next 13 weeks?",
    "What are the largest forecast cash outflows by entity and week?",
    "Which cost centres are over budget year to date and by how much?",
    "Break down advisory and professional fees by cost centre versus budget",
    "What is the full-year opex forecast versus budget by cost centre?",
    "Show USD-equivalent exposure by entity",
    "What is PnL by entity and strategy for the latest report date?",
    "How much cash is held in non-USD currencies by entity?",
    "Which entities hold cash with more than three banks?",
    "Show monthly opex actual vs budget trend for the last 12 months",
    "What share of group cash sits in each legal entity?",
    "Give me an operational control summary: concentration, liquidity and cost overruns",
    "Which People cost lines are running more than 5% over budget?",
  ],
  // Jonathan Tubb, Group CFO / Chief of Staff
  cfo: [
    "What is our current group NAV by business unit?",
    "How has group NAV moved quarter on quarter over the last two years?",
    "Which holdings have the largest unrealised gain or loss versus cost?",
    "What is the MOIC for each holding at the latest valuation date?",
    "How much dividend income did the portfolio businesses pay us this year?",
    "Which entities fall below minimum liquidity policy in the 13-week forecast?",
    "What is total group liquidity including undrawn RCF by week?",
    "Show net cash outflows by entity over the next 13 weeks",
    "Which cost centres are over budget year to date and by how much?",
    "What is the full-year opex forecast versus budget by category?",
    "What is the net debt to EBITDA for each portfolio business?",
    "Show USD-equivalent exposure by entity",
    "What is our total cash by bank counterparty and currency?",
    "Give me a board-ready summary of NAV, liquidity and opex variance",
    "Which holdings are valued on DCF versus market price, and what share of NAV is each?",
  ],
  "treasury-ops": [
    "What is our total cash by bank counterparty and currency?",
    "Show USD-equivalent exposure by entity and the unhedged non-USD amount",
    "Which banking counterparties hold more than 20% of our cash?",
    "What are the top five positions by market value?",
    "Show me today's open reconciliation breaks with AI explanations",
    "What is our net USD-equivalent exposure across all entities?",
    "Show the cash balance trend for our GBP accounts",
    "Which FX positions are unhedged above $10M equivalent?",
    "What is the settlement status of recent trades?",
    "How does our cash concentration compare to policy limits?",
    "What is the total PnL by asset class year to date?",
    "Show me the largest cash movements in the last 7 days",
    "Which accounts have balances below their minimum threshold?",
    "Break down our EUR-denominated positions by counterparty",
    "What is the maturity profile of our fixed income holdings?",
  ],
  risk: [
    "Compare portfolio exposure by strategy",
    "Which hedge funds have the highest correlation to global equities?",
    "Show USD-equivalent exposure by entity",
    "What is the 95th-percentile VaR across the portfolio?",
    "Show month-over-month PnL by strategy",
    "Which positions contribute most to portfolio risk?",
    "Compare hedge fund returns against benchmarks",
    "What is our exposure to emerging market currencies?",
    "Show the risk-return scatter for all hedge fund allocations",
    "Which entities have the largest unhedged non-USD exposure?",
    "What is the Sharpe ratio for each hedge fund allocation?",
    "Show our top 10 single-name credit exposures",
    "Which strategies have drawn down more than 5% from peak?",
    "Compare volatility across asset classes over the last quarter",
    "What is the portfolio beta to the S&P 500?",
  ],
  "structured-credit": [
    "What is our exposure by CLO manager and rating?",
    "Which deals saw the CCC bucket rise by more than one point?",
    "What is the weighted average life of the portfolio?",
    "Show the OC test cushion across all active deals",
    "Which CLO tranches are rated below investment grade?",
    "Compare vintage performance across 2021-2024 deals",
    "What is total par value by manager?",
    "Show the diversity score trend for our largest positions",
    "Which deals have WARF above 3000?",
    "What is the default rate across the CLO portfolio?",
    "Show IC test cushions for deals in payment period this month",
    "Which managers have the highest weighted average spread?",
    "Compare reinvestment period end dates across the portfolio",
    "What is the total exposure to single-B rated collateral?",
    "Show the top 5 CLO managers by assets under management in our portfolio",
  ],
  "direct-lending": [
    "Have we looked at student housing in Spain or Germany before?",
    "Which closed deals are tracking more than 5% below underwriting-case NOI?",
    "Draft the counterparty background section for this deal",
    "Show all live deals by sector and geography",
    "What is the total pipeline value by deal status?",
    "Which deals were passed on and why?",
    "Compare IRR across closed deals by vintage year",
    "Show deals in the logistics sector across Europe",
    "What is the average deal size by geography?",
    "Which deals have ESG flags or considerations?",
    "What is the weighted average LTV across our live deals?",
    "Show the pass rate by sector over the last 12 months",
    "Which deals have covenant headroom below 15%?",
    "Compare purchase price to current valuation for closed deals",
    "Show all deals reviewed in the healthcare sector",
  ],
}

function FormattedAnswer({ content }: { content: string }) {
  if (!content.includes("|")) {
    const parts = content.split(/\*\*(.*?)\*\*/g)
    return (
      <div>
        {parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
        )}
      </div>
    )
  }

  const lines = content.trim().split("\n").filter(l => l.trim())
  const metaLines: string[] = []
  let tableStart = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("|") && !lines[i].startsWith("**")) {
      tableStart = i
      break
    }
    metaLines.push(lines[i])
  }

  const tableLines = lines.slice(tableStart).filter(l => l.includes("|"))
  if (tableLines.length < 3) {
    const parts = content.split(/\*\*(.*?)\*\*/g)
    return (
      <div>
        {parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
        )}
      </div>
    )
  }

  const headers = tableLines[0].split("|").map(h => h.trim()).filter(Boolean)
  const dataLines = tableLines.slice(2)

  const formatHeader = (h: string) => h.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  const formatValue = (v: string, col: string) => {
    if (!v || v === "-") return <span style={{ color: "#9ca3af" }}>—</span>
    if (col.match(/DATE|EXPIRY|MATURITY/i) && v.includes("GMT")) {
      return new Date(v).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })
    }
    if (col.match(/VALUE|COST|AMOUNT|EXPOSURE|NAV|AUM|BALANCE|PAR|NOTIONAL|PNL/i) && !isNaN(Number(v))) {
      return `$${Number(v).toLocaleString()}`
    }
    if (col.match(/RATE|YIELD|RETURN|IRR|COUPON|SPREAD/i) && !isNaN(Number(v))) {
      return `${Number(v).toFixed(2)}%`
    }
    if (col.match(/STATUS/i)) {
      const color = v.match(/Active|Open|Live/i) ? "#16a34a" : v.match(/Closed|Expired|Dead/i) ? "#dc2626" : "#f59e0b"
      return <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${color}18`, color }}>{v}</span>
    }
    if (col.match(/RATING/i)) {
      const color = v.match(/^A/i) ? "#16a34a" : v.match(/^BB/i) ? "#f59e0b" : v.match(/^B$|^B[^B]/i) ? "#ea580c" : "#6b7280"
      return <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${color}18`, color }}>{v}</span>
    }
    if (v.length > 60) return v.slice(0, 60) + "..."
    return v
  }

  const skipCols = new Set(["PDF_STAGE_PATH", "DOCUMENT_TEXT", "MASTER_ID"])
  const visibleHeaders = headers.filter(h => !skipCols.has(h))

  return (
    <div>
      {metaLines.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {metaLines.map((line, i) => {
            const parts = line.split(/\*\*(.*?)\*\*/g)
            return (
              <div key={i} style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
                {parts.map((part, j) =>
                  j % 2 === 1 ? <strong key={j} style={{ color: "#374151" }}>{part}</strong> : <span key={j}>{part}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{dataLines.length} result{dataLines.length !== 1 ? "s" : ""}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {dataLines.map((line, ri) => {
          const cells = line.split("|").map(c => c.trim()).filter(Boolean)
          return (
            <div key={ri} style={{ padding: "10px 14px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "6px 16px" }}>
                {visibleHeaders.map((h, ci) => {
                  const cellIdx = headers.indexOf(h)
                  const val = cells[cellIdx] || ""
                  return (
                    <div key={ci}>
                      <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", fontWeight: 600 }}>{formatHeader(h)}</div>
                      <div style={{ fontSize: 13, color: "#1f2937", marginTop: 2 }}>{formatValue(val, h)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AgentPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-5")
  const [selectedAgent, setSelectedAgent] = useState(AGENT_OPTIONS[0])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const preloadCache = useRef<Map<string, string>>(new Map())
  const preloadingRef = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (preloadingRef.current) return
    preloadingRef.current = true
    const questions = SAMPLE_QUESTIONS[selectedAgent.id] || []
    questions.forEach(async (q) => {
      try {
        const agentMessages = [{ role: "user", content: q }]
        const res = await fetch("/api/ande-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: agentMessages, agent: selectedAgent.id }),
        })
        const data = await res.json()
        if (data.answer) {
          preloadCache.current.set(`${selectedAgent.id}:${q}`, data.answer)
        }
      } catch {}
    })
  }, [selectedAgent.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: "user", content: text.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput("")
    setLoading(true)
    const askedAt = new Date().toLocaleString("en-IE", { dateStyle: "medium", timeStyle: "short" })
    const modelLabel = MODELS.find(m => m.value === selectedModel)?.label || selectedModel
    try {
      const cacheKey = `${selectedAgent.id}:${text.trim()}`
      const cached = preloadCache.current.get(cacheKey)
      if (cached) {
        const meta = `**Model:** ${modelLabel} | **Agent:** ${selectedAgent.label} | **Asked:** ${askedAt}`
        setMessages([...updated, { role: "assistant", content: `${meta}\n\n${cached}` }])
        return
      }
      const agentMessages = updated.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/ande-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: agentMessages, agent: selectedAgent.id }),
      })
      const data = await res.json()
      const answer = data.error ? `Error: ${data.error}` : (data.answer || data.response || "No response")
      const meta = `**Model:** ${modelLabel} | **Agent:** ${selectedAgent.label} | **Asked:** ${askedAt}`
      setMessages([...updated, { role: "assistant", content: `${meta}\n\n${answer}` }])
    } catch (err) {
      const meta = `**Model:** ${modelLabel} | **Agent:** ${selectedAgent.label} | **Asked:** ${askedAt}`
      setMessages([...updated, { role: "assistant", content: `${meta}\n\nError: ${err instanceof Error ? err.message : "Unknown"}` }])
    } finally {
      setLoading(false)
    }
  }

  const currentQuestions = SAMPLE_QUESTIONS[selectedAgent.id] || []

  return (
    <div style={{ display: "flex", gap: 24, height: "calc(100vh - 120px)", padding: "24px 0" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, background: "white", marginBottom: 12 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#6c757d" }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#1e293b" }}>LetterOne 360 AI Agent</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Ask about treasury positions, risk exposure, CLO portfolio, deals, finance, or owners</div>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12 }}>
                {AGENT_OPTIONS.map(a => (
                  <span key={a.id} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: `${a.color}15`, color: a.color, border: `1px solid ${a.color}30` }}>{a.label}</span>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div key={i} style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, maxWidth: "80%", fontSize: 14, lineHeight: 1.6, background: "#1e3a5f", color: "#fff", marginLeft: "auto", whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </div>
              )
            }
            const parts = msg.content.split("\n\n")
            const hasMetadata = parts[0]?.includes("**Model:**")
            const metaLine = hasMetadata ? parts[0] : null
            const answerContent = hasMetadata ? parts.slice(1).join("\n\n") : msg.content
            return (
              <div key={i} style={{ marginBottom: 16, maxWidth: "95%" }}>
                {metaLine && (
                  <div style={{ padding: "8px 12px", marginBottom: 6, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 6, fontSize: 11, color: "#4338ca" }}>
                    {metaLine.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                      j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                    )}
                  </div>
                )}
                <div style={{ padding: "12px 16px", borderRadius: 8, fontSize: 14, lineHeight: 1.6, background: "#f8f9fa", color: "#1e293b", border: "1px solid #e0e0e0" }}>
                  <FormattedAnswer content={answerContent} />
                </div>
              </div>
            )
          })}
          {loading && <div style={{ padding: "12px 16px", borderRadius: 8, background: "#f1f3f5", color: "#6c757d", maxWidth: "80%" }}>Thinking...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder={`Ask the ${selectedAgent.label} agent...`}
            disabled={loading}
            style={{ flex: 1, padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{ padding: "12px 24px", background: selectedAgent.color, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontWeight: 600, opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            Go
          </button>
          <button
            onClick={() => { setMessages([]); setInput("") }}
            style={{ padding: "12px 16px", background: "#e9ecef", color: "#6c757d", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ width: 300, minWidth: 300, background: "#f8f9fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, overflowY: "auto" }}>
        {/* Agent selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6c757d", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Agent</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {AGENT_OPTIONS.map(a => (
              <button
                key={a.id}
                onClick={() => { setSelectedAgent(a); setMessages([]); preloadingRef.current = false }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6,
                  border: selectedAgent.id === a.id ? `2px solid ${a.color}` : "1px solid #e2e8f0",
                  background: selectedAgent.id === a.id ? `${a.color}10` : "#fff",
                  color: selectedAgent.id === a.id ? a.color : "#475569",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left", width: "100%",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Model selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#6c757d", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Model</div>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            style={{ width: "100%", fontSize: 12, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer" }}
          >
            {MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Sample questions */}
        <div style={{ fontSize: 11, color: "#6c757d", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Sample Questions</div>
        {currentQuestions.map((q, i) => (
          <div
            key={i}
            onClick={() => sendMessage(q)}
            style={{
              padding: "8px 12px", marginBottom: 6,
              background: i < 5 ? "#f0fdf4" : "#fff",
              border: `1px solid ${i < 5 ? "#bbf7d0" : "#e2e8f0"}`,
              borderRadius: 6, fontSize: 12, cursor: "pointer",
              transition: "all 0.2s", position: "relative", color: "#1e293b",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = selectedAgent.color; e.currentTarget.style.color = selectedAgent.color }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = i < 5 ? "#bbf7d0" : "#e2e8f0"; e.currentTarget.style.color = "#1e293b" }}
          >
            {i < 5 && <span style={{ position: "absolute", top: 4, right: 6, fontSize: 9, color: "#16a34a", fontWeight: 600 }}>&#x26A1;</span>}
            {q}
          </div>
        ))}
      </div>
    </div>
  )
}
