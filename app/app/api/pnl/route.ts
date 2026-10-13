import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const [daily, byEntity, byStrategy] = await Promise.all([
      querySnowflake(`SELECT REPORT_DATE, SUM(TOTAL_PNL_USD) AS TOTAL_PNL, SUM(REALISED_PNL_USD) AS REALISED, SUM(UNREALISED_PNL_USD) AS UNREALISED, SUM(FX_PNL_USD) AS FX_PNL, SUM(INTEREST_PNL_USD) AS INTEREST_PNL FROM ${DB}.ENFUSION_PNL GROUP BY REPORT_DATE ORDER BY REPORT_DATE DESC LIMIT 20`),
      querySnowflake(`SELECT ENTITY, SUM(TOTAL_PNL_USD) AS TOTAL_PNL FROM ${DB}.ENFUSION_PNL WHERE REPORT_DATE = (SELECT MAX(REPORT_DATE) FROM ${DB}.ENFUSION_PNL) GROUP BY ENTITY ORDER BY TOTAL_PNL DESC`),
      querySnowflake(`SELECT STRATEGY, SUM(TOTAL_PNL_USD) AS TOTAL_PNL FROM ${DB}.ENFUSION_PNL WHERE REPORT_DATE = (SELECT MAX(REPORT_DATE) FROM ${DB}.ENFUSION_PNL) GROUP BY STRATEGY ORDER BY TOTAL_PNL DESC`),
    ])
    return Response.json({ daily, byEntity, byStrategy })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
