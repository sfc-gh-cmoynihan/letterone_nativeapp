import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const checks = [
      { name: "P&L Report", query: `SELECT COUNT(*) AS CNT FROM ${DB}.ENFUSION_PNL WHERE REPORT_DATE = CURRENT_DATE()` },
      { name: "Cash Reconciliation", query: `SELECT COUNT(*) AS CNT FROM ${DB}.BANK_STATEMENTS WHERE STATEMENT_DATE = CURRENT_DATE()` },
      { name: "Position Reconciliation", query: `SELECT COUNT(*) AS CNT FROM ${DB}.ENFUSION_POSITIONS WHERE SNAPSHOT_DATE = CURRENT_DATE()` },
      { name: "Cash Forecast", query: `SELECT COUNT(*) AS CNT FROM ${DB}.ENFUSION_CASH WHERE SNAPSHOT_DATE = CURRENT_DATE()` },
      { name: "Trade Settlement", query: `SELECT COUNT(*) AS CNT FROM ${DB}.ENFUSION_TRADES WHERE SETTLEMENT_DATE = CURRENT_DATE() AND STATUS = 'Pending'` },
    ]
    const results = await Promise.all(
      checks.map(async (c) => {
        const rows = await querySnowflake(c.query)
        const count = rows[0]?.CNT || 0
        return { name: c.name, status: count > 0 ? "Complete" : "Waiting", count }
      })
    )
    const openBreaks = await querySnowflake(`SELECT COUNT(*) AS CNT FROM ${DB}.RECONCILIATION_BREAKS WHERE STATUS IN ('Open', 'Escalated')`)
    return Response.json({ checks: results, openBreaks: openBreaks[0]?.CNT || 0 })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
