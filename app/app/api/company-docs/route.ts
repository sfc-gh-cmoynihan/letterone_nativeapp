import { querySnowflake } from "@/lib/snowflake"
export const dynamic = "force-dynamic"

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "''")

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""
  const docType = searchParams.get("type") || ""
  try {
    if (q) {
      const req: any = { query: q.slice(0, 500), columns: ["DOC_TITLE", "COMPANY", "DOC_TYPE"], limit: 5 }
      if (docType && docType !== "All") req.filter = { "@eq": { DOC_TYPE: docType } }
      const rows = await querySnowflake(`SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW('LETTERONE_DB.PUBLIC.COMPANY_DOCUMENT_SEARCH', '${esc(JSON.stringify(req))}') AS RESULTS`)
      const raw = rows[0]?.RESULTS
      const hits: any[] = (typeof raw === "string" ? JSON.parse(raw) : raw)?.results || []
      const titles = hits.map(h => h.DOC_TITLE).filter(Boolean)
      if (!titles.length) return Response.json({ results: [], answer: "" })

      const inList = titles.map(t => `'${esc(t)}'`).join(",")
      const docs = await querySnowflake(`SELECT * EXCLUDE DOC_DATE, TO_VARCHAR(DOC_DATE,'YYYY-MM-DD') AS DOC_DATE FROM LETTERONE_DB.PUBLIC.COMPANY_DOCUMENTS WHERE DOC_TITLE IN (${inList})`)
      const ordered = titles.map(t => docs.find((d: any) => d.DOC_TITLE === t)).filter(Boolean) as any[]

      const context = ordered.slice(0, 3).map((d, i) => `[${i + 1}] ${d.DOC_TITLE} (${d.COMPANY}, ${d.DOC_TYPE})\n${String(d.PARSED_TEXT || d.SUMMARY || "").slice(0, 4000)}`).join("\n\n")
      const prompt = `You are an investment analyst at LetterOne. Answer the question using only the documents below. Be concise (3-6 sentences or a short bullet list), include specific figures and dates, and cite sources as [1], [2], [3]. If the documents do not contain the answer, say so.\n\nQuestion: ${q}\n\nDocuments:\n${context}`
      const ans = await querySnowflake(`SELECT AI_COMPLETE('claude-sonnet-4-5', '${esc(prompt)}') AS ANSWER`)
      let answer = ans[0]?.ANSWER || ""
      try { if (typeof answer === "string" && answer.startsWith("\"")) answer = JSON.parse(answer) } catch {}
      return Response.json({ results: ordered, answer })
    }
    let sql = `SELECT * EXCLUDE DOC_DATE, TO_VARCHAR(DOC_DATE,'YYYY-MM-DD') AS DOC_DATE FROM LETTERONE_DB.PUBLIC.COMPANY_DOCUMENTS`
    if (docType) sql += ` WHERE DOC_TYPE = '${esc(docType)}'`
    sql += ` ORDER BY DOC_DATE DESC`
    const docs = await querySnowflake(sql)
    return Response.json({ documents: docs })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
