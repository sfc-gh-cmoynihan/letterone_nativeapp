import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const [deals, byStatus, bySector, byRegion] = await Promise.all([
      querySnowflake(`SELECT * FROM ${DB}.DEALS_IT ORDER BY REVIEW_DATE DESC NULLS LAST`),
      querySnowflake(`SELECT DEAL_STATUS, COUNT(*) AS CNT, SUM(PURCHASE_PRICE_USD) AS TOTAL_VALUE FROM ${DB}.DEALS_IT GROUP BY DEAL_STATUS`),
      querySnowflake(`SELECT SECTOR, COUNT(*) AS CNT, SUM(PURCHASE_PRICE_USD) AS TOTAL_VALUE FROM ${DB}.DEALS_IT GROUP BY SECTOR ORDER BY TOTAL_VALUE DESC`),
      querySnowflake(`SELECT REGION, COUNT(*) AS CNT, SUM(PURCHASE_PRICE_USD) AS TOTAL_VALUE FROM ${DB}.DEALS_IT GROUP BY REGION ORDER BY TOTAL_VALUE DESC`),
    ])
    return Response.json({ deals, byStatus, bySector, byRegion })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
