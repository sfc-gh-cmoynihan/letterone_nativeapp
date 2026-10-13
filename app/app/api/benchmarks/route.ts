import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const benchmarks = await querySnowflake(`SELECT BENCHMARK_NAME, BENCHMARK_DATE, VALUE, DAILY_CHANGE_PCT FROM ${DB}.MARKET_BENCHMARKS ORDER BY BENCHMARK_DATE DESC LIMIT 200`)
    return Response.json({ benchmarks })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
