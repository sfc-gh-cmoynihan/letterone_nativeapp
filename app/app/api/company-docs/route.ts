import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""
  const docType = searchParams.get("type") || ""
  try {
    if (q) {
      const results = await querySnowflake(`SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW('LETTERONE_DB.PUBLIC.COMPANY_DOCUMENT_SEARCH', '${q.replace(/'/g, "''")}', 5) AS RESULTS`)
      return Response.json({ results: results[0]?.RESULTS || [] })
    }
    let sql = `SELECT * FROM LETTERONE_DB.PUBLIC.COMPANY_DOCUMENTS`
    if (docType) sql += ` WHERE DOC_TYPE = '${docType.replace(/'/g, "''")}'`
    sql += ` ORDER BY DOC_DATE DESC`
    const docs = await querySnowflake(sql)
    return Response.json({ documents: docs })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
