import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const [byBank, byCurrency, byEntity, accounts] = await Promise.all([
      querySnowflake(`SELECT BANK_NAME, SUM(BALANCE_USD) AS TOTAL_USD, COUNT(DISTINCT ACCOUNT_ID) AS ACCOUNTS FROM ${DB}.CASH_IT GROUP BY BANK_NAME ORDER BY TOTAL_USD DESC`),
      querySnowflake(`SELECT CURRENCY, SUM(BALANCE_LOCAL) AS TOTAL_LOCAL, SUM(BALANCE_USD) AS TOTAL_USD FROM ${DB}.CASH_IT GROUP BY CURRENCY ORDER BY TOTAL_USD DESC`),
      querySnowflake(`SELECT ENTITY, SUM(BALANCE_USD) AS TOTAL_USD FROM ${DB}.CASH_IT GROUP BY ENTITY ORDER BY TOTAL_USD DESC`),
      querySnowflake(`SELECT ACCOUNT_ID, BANK_NAME, ACCOUNT_NUMBER, CURRENCY, BALANCE_LOCAL, BALANCE_USD, ENTITY FROM ${DB}.CASH_IT ORDER BY BALANCE_USD DESC LIMIT 50`),
    ])
    return Response.json({ byBank, byCurrency, byEntity, accounts })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
