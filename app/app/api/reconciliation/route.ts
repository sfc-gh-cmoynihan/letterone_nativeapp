import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const [breaks, summary] = await Promise.all([
      querySnowflake(`SELECT * FROM ${DB}.RECONCILIATION_BREAKS ORDER BY CASE STATUS WHEN 'Escalated' THEN 0 WHEN 'Open' THEN 1 WHEN 'Under Review' THEN 2 ELSE 3 END, ABS(DIFFERENCE_USD) DESC`),
      querySnowflake(`SELECT STATUS, COUNT(*) AS CNT, SUM(ABS(DIFFERENCE_USD)) AS TOTAL_DIFF FROM ${DB}.RECONCILIATION_BREAKS GROUP BY STATUS`),
    ])
    return Response.json({ breaks, summary })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
