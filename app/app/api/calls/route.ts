import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""
  try {
    if (q) {
      const safeQ = q.replace(/'/g, "''")
      const rows = await querySnowflake(`
        SELECT * FROM LETTERONE_DB.PUBLIC.EXECUTIVE_CALLS
        WHERE COMPANY ILIKE '%${safeQ}%' OR CONTACT_NAME ILIKE '%${safeQ}%' OR CALLER ILIKE '%${safeQ}%'
        ORDER BY CALL_DATE DESC
      `)
      return Response.json({ calls: rows })
    }
    const rows = await querySnowflake(`SELECT * FROM LETTERONE_DB.PUBLIC.EXECUTIVE_CALLS ORDER BY CALL_DATE DESC`)
    return Response.json({ calls: rows })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
