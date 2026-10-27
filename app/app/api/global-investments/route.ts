import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const DB = "LETTERONE_DB.PUBLIC"

export async function GET() {
  try {
    const rows = await querySnowflake(`
      SELECT 
        INVESTMENT_ID,
        COUNTRY,
        COUNTRY_CODE,
        SECTOR,
        DIVISION,
        KEY_ASSETS,
        INVESTMENT_USD,
        PERFORMANCE,
        RETURN_PCT,
        NOTES,
        LATITUDE,
        LONGITUDE,
        ST_ASGEOJSON(LOCATION) AS GEOJSON,
        LAST_UPDATED
      FROM ${DB}.GLOBAL_INVESTMENTS 
      ORDER BY INVESTMENT_USD DESC
    `)
    return Response.json(rows)
  } catch (e: any) {
    console.error("[global-investments] error:", e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
