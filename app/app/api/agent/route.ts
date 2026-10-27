import { querySnowflakeLongRunning } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const AGENTS: Record<string, string> = {
  "treasury-ops": "LETTERONE_DB.PUBLIC.TREASURY_OPS_AGENT",
  "risk": "LETTERONE_DB.PUBLIC.RISK_AGENT",
  "structured-credit": "LETTERONE_DB.PUBLIC.STRUCTURED_CREDIT_AGENT",
  "direct-lending": "LETTERONE_DB.PUBLIC.DIRECT_LENDING_AGENT",
  "cfo": "LETTERONE_DB.PUBLIC.CFO_AGENT",
  "coo": "LETTERONE_DB.PUBLIC.COO_AGENT",
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, messages, agent: agentKey } = body

    const text = message || messages?.[messages.length - 1]?.content?.[0]?.text || messages?.[messages.length - 1]?.content
    if (!text) return Response.json({ error: "Message required" }, { status: 400 })

    const agentName = AGENTS[agentKey] || AGENTS["treasury-ops"]

    const agentMessages = messages?.map((m: any) => ({
      role: m.role,
      content: Array.isArray(m.content) ? m.content : [{ type: "text", text: String(m.content || "") }],
    })) || [{ role: "user", content: [{ type: "text", text: String(text) }] }]

    const requestBody = JSON.stringify({ messages: agentMessages, stream: false })

    const rows = await querySnowflakeLongRunning(
      "SELECT TRY_PARSE_JSON(SNOWFLAKE.CORTEX.DATA_AGENT_RUN('" + agentName + "', $$" + requestBody + "$$)) AS RESP",
      { maxWaitMs: 120000, callersRights: true }
    )

    if (!rows || rows.length === 0 || !rows[0].RESP) {
      return Response.json({ response: "No response from agent." })
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

    return Response.json({ response: answer.trim() })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[agent] error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
