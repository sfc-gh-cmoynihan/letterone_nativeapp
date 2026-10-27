import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

// One round trip: each check counts rows for the latest business date loaded in its
// table (not CURRENT_DATE, which is empty when the feed hasn't landed yet / demo data).
const SQL = `
WITH pnl AS (SELECT MAX(REPORT_DATE) AS D FROM ${DB}.ENFUSION_PNL),
     bank AS (SELECT MAX(STATEMENT_DATE) AS D FROM ${DB}.BANK_STATEMENTS),
     pos AS (SELECT MAX(SNAPSHOT_DATE) AS D FROM ${DB}.ENFUSION_POSITIONS),
     cash AS (SELECT MAX(SNAPSHOT_DATE) AS D FROM ${DB}.ENFUSION_CASH),
     trd AS (SELECT MAX(SETTLEMENT_DATE) AS D FROM ${DB}.ENFUSION_TRADES WHERE STATUS = 'Pending')
SELECT 1 AS ORD, 'P&L Report' AS NAME, TO_VARCHAR((SELECT D FROM pnl), 'YYYY-MM-DD') AS AS_OF,
       (SELECT COUNT(*) FROM ${DB}.ENFUSION_PNL WHERE REPORT_DATE = (SELECT D FROM pnl)) AS CNT
UNION ALL SELECT 2, 'Cash Reconciliation', TO_VARCHAR((SELECT D FROM bank), 'YYYY-MM-DD'),
       (SELECT COUNT(*) FROM ${DB}.BANK_STATEMENTS WHERE STATEMENT_DATE = (SELECT D FROM bank))
UNION ALL SELECT 3, 'Position Reconciliation', TO_VARCHAR((SELECT D FROM pos), 'YYYY-MM-DD'),
       (SELECT COUNT(*) FROM ${DB}.ENFUSION_POSITIONS WHERE SNAPSHOT_DATE = (SELECT D FROM pos))
UNION ALL SELECT 4, 'Cash Forecast', TO_VARCHAR((SELECT D FROM cash), 'YYYY-MM-DD'),
       (SELECT COUNT(*) FROM ${DB}.ENFUSION_CASH WHERE SNAPSHOT_DATE = (SELECT D FROM cash))
UNION ALL SELECT 5, 'Trade Settlement', TO_VARCHAR((SELECT D FROM trd), 'YYYY-MM-DD'),
       (SELECT COUNT(*) FROM ${DB}.ENFUSION_TRADES WHERE SETTLEMENT_DATE = (SELECT D FROM trd) AND STATUS = 'Pending')
UNION ALL SELECT 99, '__OPEN_BREAKS__', NULL,
       (SELECT COUNT(*) FROM ${DB}.RECONCILIATION_BREAKS WHERE STATUS IN ('Open', 'Escalated'))
ORDER BY ORD`

export async function GET() {
  try {
    const rows = await querySnowflake(SQL)
    const checks = rows
      .filter(r => r.NAME !== "__OPEN_BREAKS__")
      .map(r => {
        const count = Number(r.CNT) || 0
        const asOf = (r.AS_OF as string) || null
        return { name: r.NAME, status: count > 0 ? "Complete" : "Waiting", count, asOf }
      })
    const openBreaks = Number(rows.find(r => r.NAME === "__OPEN_BREAKS__")?.CNT) || 0
    return Response.json({ checks, openBreaks })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
