import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const [metrics, latest] = await Promise.all([
      querySnowflake(`SELECT * FROM ${DB}.TRUSTEE_METRICS ORDER BY DEAL_NAME, REPORT_DATE DESC`),
      querySnowflake(`SELECT DEAL_NAME, OC_TEST_CUSHION_PCT, IC_TEST_CUSHION_PCT, WARF, CCC_BUCKET_PCT, DEFAULTED_PAR_PCT, DIVERSITY_SCORE, REPORT_DATE FROM ${DB}.TRUSTEE_METRICS WHERE REPORT_DATE = (SELECT MAX(REPORT_DATE) FROM ${DB}.TRUSTEE_METRICS) ORDER BY OC_TEST_CUSHION_PCT ASC`),
    ])
    return Response.json({ metrics, latest })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
