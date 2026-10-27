import { querySnowflake, querySnowflakeLongRunning } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

// Agent runs take 20-60s, so single-turn answers are cached in memory and in
// LETTERONE_DB.PUBLIC.AGENT_RESPONSE_CACHE (survives restarts, shared across instances).
const CACHE_TABLE = "LETTERONE_DB.PUBLIC.AGENT_RESPONSE_CACHE"
const CACHE_TTL_HOURS = 168
const memCache = new Map<string, { answer: string; at: number }>()
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "''")
const normalize = (q: string) => q.toLowerCase().replace(/\s+/g, " ").replace(/[?.!\s]+$/, "").trim()

const AGENTS: Record<string, string> = {
  "treasury-ops": "LETTERONE_DB.PUBLIC.TREASURY_OPS_AGENT",
  "risk": "LETTERONE_DB.PUBLIC.RISK_AGENT",
  "structured-credit": "LETTERONE_DB.PUBLIC.STRUCTURED_CREDIT_AGENT",
  "direct-lending": "LETTERONE_DB.PUBLIC.DIRECT_LENDING_AGENT",
  "finance": "LETTERONE_DB.PUBLIC.FINANCE_AGENT",
  "cfo": "LETTERONE_DB.PUBLIC.CFO_AGENT",
  "coo": "LETTERONE_DB.PUBLIC.COO_AGENT",
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = body
    const agentKey: string = body.agent || "treasury-ops"

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages array required" }, { status: 400 })
    }

    const agentName = AGENTS[agentKey || "treasury-ops"] || AGENTS["treasury-ops"]

    // Normalize messages: content can be a string or already an array
    const agentMessages = messages.map((m: any) => {
      if (Array.isArray(m.content)) {
        return { role: m.role, content: m.content }
      }
      return { role: m.role, content: [{ type: "text", text: String(m.content || "") }] }
    })

    const single = messages.length === 1 && messages[0].role === "user"
    const question = single ? String(Array.isArray(messages[0].content) ? messages[0].content[0]?.text || "" : messages[0].content || "") : ""
    const qKey = normalize(question)
    const memKey = `${agentKey}|${qKey}`
    if (single && qKey && !body.refresh) {
      const hit = memCache.get(memKey)
      if (hit && Date.now() - hit.at < CACHE_TTL_HOURS * 3600e3) return Response.json({ answer: hit.answer, cached: true })
      try {
        const rows = await querySnowflake(`SELECT ANSWER FROM ${CACHE_TABLE} WHERE AGENT_KEY = '${esc(agentKey)}' AND QUESTION_KEY = '${esc(qKey)}' AND CREATED_AT > DATEADD(hour, -${CACHE_TTL_HOURS}, CURRENT_TIMESTAMP()) ORDER BY CREATED_AT DESC LIMIT 1`)
        if (rows[0]?.ANSWER) {
          memCache.set(memKey, { answer: rows[0].ANSWER, at: Date.now() })
          return Response.json({ answer: rows[0].ANSWER, cached: true })
        }
      } catch (e) { console.error("[ande-agent] cache read failed:", e) }
    }

    const requestBody = JSON.stringify({ messages: agentMessages, stream: false })

    const rows = await querySnowflakeLongRunning(
      "SELECT TRY_PARSE_JSON(SNOWFLAKE.CORTEX.DATA_AGENT_RUN('" + agentName + "', $$" + requestBody + "$$)) AS RESP",
      { maxWaitMs: 120000 }
    )

    if (!rows || rows.length === 0 || !rows[0].RESP) {
      return Response.json({ answer: "No response from Agent." })
    }

    const data = typeof rows[0].RESP === "string" ? JSON.parse(rows[0].RESP) : rows[0].RESP

    let answer = ""
    if (data.content && Array.isArray(data.content)) {
      for (const item of data.content) {
        if (item.type === "text" && item.text) {
          answer += item.text + "\n"
        } else if (item.type === "table" && item.table?.result_set) {
          const rs = item.table.result_set
          const cols = rs.resultSetMetaData?.rowType?.map((c: { name: string }) => c.name) || []
          if (cols.length > 0 && rs.data?.length > 0) {
            let table = "| " + cols.join(" | ") + " |\n"
            table += "| " + cols.map(() => "---").join(" | ") + " |\n"
            for (const row of rs.data.slice(0, 30)) {
              table += "| " + row.map((v: string) => v ?? "").join(" | ") + " |\n"
            }
            answer += table + "\n"
          }
        }
      }
    }

    if (!answer.trim()) {
      answer = "I wasn't able to generate an answer. Please try rephrasing your question."
    }

    const final = answer.trim()
    if (single && qKey && !final.startsWith("I wasn't able")) {
      memCache.set(memKey, { answer: final, at: Date.now() })
      querySnowflake(`INSERT INTO ${CACHE_TABLE} (AGENT_KEY, QUESTION_KEY, QUESTION, ANSWER) SELECT '${esc(agentKey)}', '${esc(qKey)}', '${esc(question)}', '${esc(final)}'`)
        .catch(e => console.error("[ande-agent] cache write failed:", e))
    }
    return Response.json({ answer: final })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[ande-agent] error:", msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
