import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const [portfolio, byManager, byRating, byVintage] = await Promise.all([
      querySnowflake(`SELECT * FROM ${DB}.CLO_PORTFOLIO_IT ORDER BY MARKET_VALUE_USD DESC`),
      querySnowflake(`SELECT MANAGER, COUNT(*) AS TRANCHES, SUM(NOTIONAL_USD) AS TOTAL_NOTIONAL, SUM(MARKET_VALUE_USD) AS TOTAL_MV, AVG(SPREAD_BPS) AS AVG_SPREAD FROM ${DB}.CLO_PORTFOLIO_IT GROUP BY MANAGER ORDER BY TOTAL_MV DESC`),
      querySnowflake(`SELECT TRANCHE_RATING, COUNT(*) AS TRANCHES, SUM(NOTIONAL_USD) AS TOTAL_NOTIONAL, SUM(MARKET_VALUE_USD) AS TOTAL_MV, AVG(WAL_YEARS) AS AVG_WAL FROM ${DB}.CLO_PORTFOLIO_IT GROUP BY TRANCHE_RATING ORDER BY CASE TRANCHE_RATING WHEN 'AAA' THEN 1 WHEN 'AA' THEN 2 WHEN 'A' THEN 3 WHEN 'BBB' THEN 4 WHEN 'BB' THEN 5 WHEN 'B' THEN 6 END`),
      querySnowflake(`SELECT VINTAGE_YEAR, COUNT(*) AS TRANCHES, SUM(MARKET_VALUE_USD) AS TOTAL_MV FROM ${DB}.CLO_PORTFOLIO_IT GROUP BY VINTAGE_YEAR ORDER BY VINTAGE_YEAR`),
    ])
    return Response.json({ portfolio, byManager, byRating, byVintage })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
