import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""
  try {
    if (q) {
      // SEARCH_PREVIEW takes a JSON request and returns a JSON string: {"results":[...]}
      const request = JSON.stringify({
        query: q.slice(0, 500),
        columns: ["DEAL_NAME", "FILE_TYPE", "CLASSIFICATION", "PARSED_TEXT"],
        limit: 8,
      })
      const literal = request.replace(/\\/g, "\\\\").replace(/'/g, "''")
      const rows = await querySnowflake(
        `SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW('LETTERONE_DB.PUBLIC.DEAL_DOCUMENT_SEARCH', '${literal}') AS RESULTS`,
      )
      const raw = rows[0]?.RESULTS
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
      return Response.json({ results: parsed?.results || [] })
    }
    const docs = await querySnowflake(`SELECT DOC_ID, DEAL_NAME, FILE_TYPE, FILE_NAME, CLASSIFICATION FROM LETTERONE_DB.PUBLIC.DEAL_DOCUMENTS ORDER BY DEAL_NAME`)
    return Response.json({ documents: docs })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
