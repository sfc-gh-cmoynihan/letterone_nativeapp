import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""
  try {
    if (q) {
      const results = await querySnowflake(`SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW('LETTERONE_DB.PUBLIC.CLO_DOCUMENT_SEARCH', '${q.replace(/'/g, "''")}', 5) AS RESULTS`)
      return Response.json({ results: results[0]?.RESULTS || [] })
    }
    const docs = await querySnowflake(`SELECT DOCUMENT_ID, DEAL_NAME, DOCUMENT_TYPE, PAGE_COUNT FROM LETTERONE_DB.PUBLIC.CLO_DOCUMENTS ORDER BY DEAL_NAME`)
    return Response.json({ documents: docs })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
