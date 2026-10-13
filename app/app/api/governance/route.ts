import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const [roles, rules] = await Promise.all([
      querySnowflake(`SELECT 'TREASURY_OPS' AS ROLE_NAME, 'Positions, cash, recs, rules' AS ACCESS UNION ALL SELECT 'RISK', 'Full treasury book, hedge funds, models' UNION ALL SELECT 'TRADING_SC', 'Structured credit book, trustee data, CLO documents' UNION ALL SELECT 'DIRECT_LENDING', 'Deal library and monitoring (exclusive)' UNION ALL SELECT 'EXEC_READONLY', 'All interactive tables (read only)'`),
      querySnowflake(`SELECT * FROM ${DB}.BUSINESS_RULES ORDER BY RULE_ID`),
    ])
    return Response.json({ roles, rules })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
