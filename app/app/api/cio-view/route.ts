import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const [exposureByEntity, pnlByStrategy, topPositions, cashConcentration, positions] = await Promise.all([
      querySnowflake(`SELECT ENTITY, SUM(MARKET_VALUE_USD) AS TOTAL_MV FROM ${DB}.POSITIONS_IT GROUP BY ENTITY ORDER BY TOTAL_MV DESC`),
      querySnowflake(`SELECT STRATEGY, SUM(TOTAL_PNL_USD) AS TOTAL_PNL FROM ${DB}.ENFUSION_PNL WHERE REPORT_DATE >= DATEADD('day', -30, CURRENT_DATE()) GROUP BY STRATEGY ORDER BY TOTAL_PNL DESC`),
      querySnowflake(`SELECT INSTRUMENT_NAME, ENTITY, STRATEGY, MARKET_VALUE_USD FROM ${DB}.POSITIONS_IT ORDER BY ABS(MARKET_VALUE_USD) DESC LIMIT 10`),
      querySnowflake(`WITH totals AS (SELECT SUM(BALANCE_USD) AS GRAND_TOTAL FROM ${DB}.CASH_IT) SELECT c.BANK_NAME, SUM(c.BALANCE_USD) AS BANK_TOTAL, SUM(c.BALANCE_USD) / t.GRAND_TOTAL * 100 AS PCT FROM ${DB}.CASH_IT c, totals t GROUP BY c.BANK_NAME, t.GRAND_TOTAL ORDER BY BANK_TOTAL DESC`),
      querySnowflake(`SELECT POSITION_ID, INSTRUMENT_NAME, INSTRUMENT_TYPE, ISIN, ENTITY, STRATEGY, BOOK, PRODUCT, QUANTITY, CURRENCY, MARKET_VALUE_USD, UNREALISED_PNL_USD FROM ${DB}.POSITIONS_IT ORDER BY ABS(MARKET_VALUE_USD) DESC`),
    ])
    return Response.json({ exposureByEntity, pnlByStrategy, topPositions, cashConcentration, positions })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
