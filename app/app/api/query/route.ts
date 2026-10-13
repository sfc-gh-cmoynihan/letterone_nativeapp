import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { sql } = await request.json()
    if (!sql) return Response.json({ error: "SQL required" }, { status: 400 })
    const rows = await querySnowflake(sql)
    return Response.json({ rows })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
