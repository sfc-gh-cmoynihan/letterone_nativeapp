import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const AGENTS: Record<string, string> = {
  "treasury-ops": "LETTERONE_DB.PUBLIC.TREASURY_OPS_AGENT",
  "risk": "LETTERONE_DB.PUBLIC.RISK_AGENT",
  "structured-credit": "LETTERONE_DB.PUBLIC.STRUCTURED_CREDIT_AGENT",
  "direct-lending": "LETTERONE_DB.PUBLIC.DIRECT_LENDING_AGENT",
}

export async function POST(request: Request) {
  try {
    const { message, agent: agentKey } = await request.json()
    if (!message) return Response.json({ error: "Message required" }, { status: 400 })

    const agentName = AGENTS[agentKey] || AGENTS["treasury-ops"]
    const safeMessage = message.replace(/'/g, "''")

    // Use caller's rights so the logged-in user's role is enforced.
    // A TRADING_SC user asking the Direct Lending agent will be refused
    // because TRADING_SC has no SELECT on deal tables.
    const rows = await querySnowflake(`
      SELECT SNOWFLAKE.CORTEX.AGENT(
        '${agentName}',
        PARSE_JSON('[{"role": "user", "content": "${safeMessage}"}]')
      ) AS RESPONSE
    `, { callersRights: true })

    const raw = rows[0]?.RESPONSE
    let response = ""
    if (typeof raw === "string") {
      try { response = JSON.parse(raw)?.content || raw } catch { response = raw }
    } else if (raw?.content) {
      response = raw.content
    } else {
      response = JSON.stringify(raw)
    }

    return Response.json({ response })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
