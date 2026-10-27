import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

async function safeQuery(sql: string, fallback: any = []) {
  try { return await querySnowflake(sql) }
  catch (e) { console.error("[dashboard] query failed:", sql, e); return fallback }
}

export async function GET() {
  try {
    const [positions, cash, cloBook, deals, investors, pnl, breaks, cashByBank] = await Promise.all([
      safeQuery(`SELECT COUNT(*) AS CNT, SUM(MARKET_VALUE_USD) AS TOTAL_MV FROM ${DB}.POSITIONS_IT`, [{ CNT: 0, TOTAL_MV: 0 }]),
      safeQuery(`SELECT COUNT(DISTINCT ACCOUNT_ID) AS ACCOUNTS, SUM(BALANCE_USD) AS TOTAL_CASH FROM ${DB}.CASH_IT`, [{ ACCOUNTS: 0, TOTAL_CASH: 0 }]),
      safeQuery(`SELECT COUNT(*) AS TRANCHES, SUM(MARKET_VALUE_USD) AS TOTAL_MV FROM ${DB}.CLO_PORTFOLIO_IT`, [{ TRANCHES: 0, TOTAL_MV: 0 }]),
      safeQuery(`SELECT DEAL_STATUS, COUNT(*) AS CNT FROM ${DB}.DEALS_IT GROUP BY DEAL_STATUS`, []),
      safeQuery(`SELECT COUNT(*) AS CNT, SUM(COMMITTED_CAPITAL_USD) AS TOTAL_COMMITTED FROM ${DB}.INVESTORS`, [{ CNT: 0, TOTAL_COMMITTED: 0 }]),
      safeQuery(`SELECT SUM(TOTAL_PNL_USD) AS TODAY_PNL FROM ${DB}.ENFUSION_PNL WHERE REPORT_DATE = (SELECT MAX(REPORT_DATE) FROM ${DB}.ENFUSION_PNL)`, [{ TODAY_PNL: 0 }]),
      safeQuery(`SELECT COUNT(*) AS OPEN_BREAKS, SUM(ABS(DIFFERENCE_USD)) AS TOTAL_DIFF FROM ${DB}.RECONCILIATION_BREAKS WHERE STATUS IN ('Open', 'Escalated')`, [{ OPEN_BREAKS: 0, TOTAL_DIFF: 0 }]),
      safeQuery(`SELECT BANK_NAME, CURRENCY, COUNT(*) AS ACCOUNTS, SUM(BALANCE_USD) AS TOTAL_USD FROM ${DB}.CASH_IT GROUP BY BANK_NAME, CURRENCY ORDER BY TOTAL_USD DESC`, []),
    ])
    return Response.json({
      positions: positions[0],
      cash: cash[0],
      cloBook: cloBook[0],
      deals: deals,
      investors: investors[0],
      todayPnl: pnl[0],
      openBreaks: breaks[0],
      cashByBank: cashByBank,
    })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
