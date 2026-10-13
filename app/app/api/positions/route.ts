import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const entity = searchParams.get("entity")
  const strategy = searchParams.get("strategy")

  try {
    let where = "WHERE 1=1"
    if (entity) where += ` AND ENTITY = '${entity.replace(/'/g, "''")}'`
    if (strategy) where += ` AND STRATEGY = '${strategy.replace(/'/g, "''")}'`

    const [positions, byEntity, byStrategy, byProduct] = await Promise.all([
      querySnowflake(`SELECT * FROM ${DB}.POSITIONS_IT ${where} ORDER BY ABS(MARKET_VALUE_USD) DESC LIMIT 100`),
      querySnowflake(`SELECT ENTITY, SUM(MARKET_VALUE_USD) AS TOTAL_MV, COUNT(*) AS CNT FROM ${DB}.POSITIONS_IT ${where} GROUP BY ENTITY ORDER BY TOTAL_MV DESC`),
      querySnowflake(`SELECT STRATEGY, SUM(MARKET_VALUE_USD) AS TOTAL_MV, COUNT(*) AS CNT FROM ${DB}.POSITIONS_IT ${where} GROUP BY STRATEGY ORDER BY TOTAL_MV DESC`),
      querySnowflake(`SELECT PRODUCT, SUM(MARKET_VALUE_USD) AS TOTAL_MV, COUNT(*) AS CNT FROM ${DB}.POSITIONS_IT ${where} GROUP BY PRODUCT ORDER BY TOTAL_MV DESC`),
    ])
    return Response.json({ positions, byEntity, byStrategy, byProduct })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
