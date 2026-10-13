import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const [byStrategy, byEntity, timeSeries] = await Promise.all([
      querySnowflake(`SELECT STRATEGY, SUM(MARKET_VALUE_USD) AS TOTAL_MV, COUNT(*) AS POSITIONS FROM ${DB}.POSITIONS_IT GROUP BY STRATEGY ORDER BY TOTAL_MV DESC`),
      querySnowflake(`SELECT ENTITY, SUM(MARKET_VALUE_USD) AS TOTAL_MV, COUNT(*) AS POSITIONS FROM ${DB}.POSITIONS_IT GROUP BY ENTITY ORDER BY TOTAL_MV DESC`),
      querySnowflake(`SELECT SNAPSHOT_DATE, SUM(MARKET_VALUE_USD) AS TOTAL_MV FROM ${DB}.ENFUSION_POSITIONS GROUP BY SNAPSHOT_DATE ORDER BY SNAPSHOT_DATE DESC LIMIT 30`),
    ])
    return Response.json({ byStrategy, byEntity, timeSeries })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
