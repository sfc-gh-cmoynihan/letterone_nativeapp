import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const [positions, cash, cloBook, deals, investors, pnl, breaks] = await Promise.all([
      querySnowflake(`SELECT COUNT(*) AS CNT, SUM(MARKET_VALUE_USD) AS TOTAL_MV FROM ${DB}.POSITIONS_IT`),
      querySnowflake(`SELECT COUNT(DISTINCT ACCOUNT_ID) AS ACCOUNTS, SUM(BALANCE_USD) AS TOTAL_CASH FROM ${DB}.CASH_IT`),
      querySnowflake(`SELECT COUNT(*) AS TRANCHES, SUM(MARKET_VALUE_USD) AS TOTAL_MV FROM ${DB}.CLO_PORTFOLIO_IT`),
      querySnowflake(`SELECT DEAL_STATUS, COUNT(*) AS CNT FROM ${DB}.DEALS_IT GROUP BY DEAL_STATUS`),
      querySnowflake(`SELECT COUNT(*) AS CNT, SUM(COMMITTED_CAPITAL_USD) AS TOTAL_COMMITTED FROM ${DB}.INVESTORS`),
      querySnowflake(`SELECT SUM(TOTAL_PNL_USD) AS TODAY_PNL FROM ${DB}.ENFUSION_PNL WHERE REPORT_DATE = (SELECT MAX(REPORT_DATE) FROM ${DB}.ENFUSION_PNL)`),
      querySnowflake(`SELECT COUNT(*) AS OPEN_BREAKS, SUM(ABS(DIFFERENCE_USD)) AS TOTAL_DIFF FROM ${DB}.RECONCILIATION_BREAKS WHERE STATUS IN ('Open', 'Escalated')`),
    ])
    return Response.json({
      positions: positions[0],
      cash: cash[0],
      cloBook: cloBook[0],
      deals: deals,
      investors: investors[0],
      todayPnl: pnl[0],
      openBreaks: breaks[0],
    })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
