import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const [funds, byStrategy, topCorrelation] = await Promise.all([
      querySnowflake(`SELECT FUND_NAME, FUND_STRATEGY, REPORT_MONTH, MONTHLY_RETURN_PCT, AUM_USD, CORRELATION_EQUITY_3Y, CORRELATION_EQUITY_5Y FROM ${DB}.HEDGE_FUNDS_IT ORDER BY REPORT_MONTH DESC, AUM_USD DESC LIMIT 500`),
      querySnowflake(`SELECT FUND_STRATEGY, COUNT(DISTINCT FUND_NAME) AS FUND_COUNT, AVG(MONTHLY_RETURN_PCT) AS AVG_RETURN, SUM(AUM_USD) AS TOTAL_AUM FROM ${DB}.HEDGE_FUNDS_IT WHERE REPORT_MONTH = (SELECT MAX(REPORT_MONTH) FROM ${DB}.HEDGE_FUNDS_IT) GROUP BY FUND_STRATEGY ORDER BY TOTAL_AUM DESC`),
      querySnowflake(`SELECT FUND_NAME, FUND_STRATEGY, CORRELATION_EQUITY_3Y, CORRELATION_EQUITY_5Y, MONTHLY_RETURN_PCT, AUM_USD FROM ${DB}.HEDGE_FUNDS_IT WHERE REPORT_MONTH = (SELECT MAX(REPORT_MONTH) FROM ${DB}.HEDGE_FUNDS_IT) ORDER BY CORRELATION_EQUITY_3Y DESC`),
    ])
    return Response.json({ funds, byStrategy, topCorrelation })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
