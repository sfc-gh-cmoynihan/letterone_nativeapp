import { querySnowflakeLongRunning } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const AGENTS: Record<string, string> = {
  "treasury-ops": "LETTERONE_DB.PUBLIC.TREASURY_OPS_AGENT",
  "risk": "LETTERONE_DB.PUBLIC.RISK_AGENT",
  "structured-credit": "LETTERONE_DB.PUBLIC.STRUCTURED_CREDIT_AGENT",
  "direct-lending": "LETTERONE_DB.PUBLIC.DIRECT_LENDING_AGENT",
}

export async function POST(req: Request) {
  try {
    const { messages, agent: agentKey } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages array required" }, { status: 400 })
    }

    const agentName = AGENTS[agentKey || "treasury-ops"] || AGENTS["treasury-ops"]

    const agentMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: [{ type: "text", text: m.content }],
    }))

    const requestBody = JSON.stringify({ messages: agentMessages, stream: false })
    const safeBody = requestBody.replace(/'/g, "''")

    // Use caller's rights so the logged-in user's role is enforced.
    const rows = await querySnowflakeLongRunning(`
      SELECT TRY_PARSE_JSON(
        SNOWFLAKE.CORTEX.DATA_AGENT_RUN(
          '${agentName}',
          '${safeBody}'
        )
      ) AS RESP
    `, { maxWaitMs: 120000, callersRights: true })

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

    return Response.json({ answer: answer.trim() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[ande-agent] error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
