"""Build LetterOne_15min_Persona_Demo.pdf — 15-minute, six-persona demo script."""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, KeepTogether, PageBreak)

OUT = "/Users/cmoynihan/Documents/code/letterone_nativeapp/LetterOne_15min_Persona_Demo.pdf"
NAVY = colors.HexColor("#11567F")
SNOW = colors.HexColor("#29B5E8")
GREY = colors.HexColor("#5B5B5B")
LIGHT = colors.HexColor("#F2F6FA")

ss = {
    "title": ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=22, textColor=NAVY, leading=26),
    "sub": ParagraphStyle("s", fontName="Helvetica", fontSize=10.5, textColor=GREY, leading=14),
    "h": ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=13, textColor=colors.white, leading=16),
    "time": ParagraphStyle("tm", fontName="Helvetica-Bold", fontSize=10, textColor=colors.white, alignment=2),
    "b": ParagraphStyle("b", fontName="Helvetica", fontSize=9.5, leading=13),
    "lab": ParagraphStyle("l", fontName="Helvetica-Bold", fontSize=8.5, textColor=NAVY, leading=13),
    "small": ParagraphStyle("sm", fontName="Helvetica-Oblique", fontSize=8.5, textColor=GREY, leading=11),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=12, textColor=NAVY, leading=16, spaceBefore=6),
}

# (time, title, colour, audience, [(label, text)], value line)
SECTIONS = [
    ("0:00 – 1:00", "Opening: one platform, six roles", "#5B5B5B", "Everyone", [
        ("SAY", "\"Today LetterOne runs on Enfusion plus around 30 spreadsheets a day. In the next 15 minutes "
                "you'll see the same governed data serving six roles — CFO, CRO, traders, research, operations "
                "and IT — from one app running entirely inside Snowflake.\""),
        ("SHOW", "<b>Home</b> tab: the six-role summary and global entity map."),
    ], None),
    ("1:00 – 3:30", "CFO", "#29B5E8", "Group CFO / Chief of Staff", [
        ("SHOW", "<b>Home</b> dashboard: real-time <b>USD-equivalent exposure by entity</b>, converted with live FX_RATES."),
        ("ASK", "Treasury Ops agent: <i>\"Show USD-equivalent exposure by entity.\"</i> Then the Risk agent, same "
                "question. <b>Same number</b> — one definition in SV_TREASURY (the golden thread)."),
        ("SHOW", "<b>CIO View</b> tab: board-ready summary of holdings, liquidity and P&amp;L on demand."),
        ("SAY", "\"No extracts, no copies of the data — every team queries one governed source, so you pay "
                "to store and compute it once.\""),
    ], "One golden number for Ops and Risk; board pack on demand; lower cost with zero data copies."),
    ("3:30 – 6:00", "Chief Risk Officer", "#29B5E8", "CRO / Risk team", [
        ("SHOW", "<b>Risk Dashboard</b>: group-wide limits vs. utilisation in real time; concentration and "
                 "counterparty exposure with breaches highlighted."),
        ("SHOW", "<b>Risk Models</b>: run a stress test / VaR scenario. Change one assumption and the result "
                 "moves — all on the same governed data, no spreadsheet export."),
        ("ASK", "Risk agent: <i>\"Which counterparties are closest to their exposure limit?\"</i>"),
        ("SHOW", "<b>Governance</b> tab: query history and lineage for that answer — the audit trail a regulator asks for."),
    ], "Limits monitored live; stress tests on governed data; full audit trail for regulators."),
    ("6:00 – 8:30", "Traders", "#11567F", "Trading / Structured Credit desk", [
        ("SHOW", "<b>Treasury Ops</b> positions &amp; P&amp;L: filter and pivot — sub-second, served from Interactive "
                 "Tables on the L1_IWH interactive warehouse."),
        ("SHOW", "<b>Structured Credit</b> + <b>Trustee Reports</b>: live CLO portfolio and trustee metrics "
                 "(OC/IC cushions, WARF, CCC bucket)."),
        ("ASK", "Structured Credit agent: <i>\"Which CLOs have the thinnest OC cushion, and what is our exposure "
                "to each by rating?\"</i>"),
        ("SAY", "\"Plain-English question, governed answer, the SQL is one click away. That's a pre-trade check in "
                "seconds instead of a request to the risk team.\""),
    ], "Sub-second positions; live CLO metrics; faster pre-trade decisions."),
    ("8:30 – 11:00", "Research Analysts", "#7B3FC4", "Research / Direct Lending", [
        ("SHOW", "<b>Deal Search</b> and <b>Docs</b>: Cortex Search across deal documents and ESG / annual reports. "
                 "Search a theme and jump straight to the source passage."),
        ("SHOW", "<b>Calls</b> tab: C-level call transcripts with portfolio companies. Ask "
                 "<i>\"What did management say about refinancing risk?\"</i> across all calls."),
        ("ASK", "Risk agent: <i>\"How have our hedge fund holdings performed against their benchmarks this year?\"</i>"),
        ("SAY", "\"That's hours of reading turned into minutes — with every answer cited back to the document.\""),
    ], "Search docs, ESG reports and transcripts in one place; hours of reading become minutes."),
    ("11:00 – 13:00", "Operations", "#F5A033", "Treasury Operations", [
        ("SHOW", "<b>Reconciliation</b>: bank statements matched to Enfusion automatically; only breaks surface."),
        ("SHOW", "Open one break, add a comment and assign it. The <b>LAST_UPDATED / UPDATED_BY / COMMENT</b> "
                 "audit trail is written back to Snowflake."),
        ("SHOW", "<b>Treasury Ops</b>: cash by bank, currency and entity with FX in one view."),
        ("ASK", "Treasury Ops agent: <i>\"What is total cash by bank and currency, and what changed since yesterday?\"</i>"),
    ], "Automated reconciliation; breaks tracked with audit trail; fewer manual spreadsheets."),
    ("13:00 – 14:30", "IT", "#D45B90", "IT / Security / Architecture", [
        ("SHOW", "The app URL is a Snowflake endpoint: the app runs fully inside Snowflake "
                 "(Snowflake App Runtime). No servers to patch or scale."),
        ("SHOW", "<b>Governance</b> tab: role-based access (TREASURY_OPS, RISK, TRADING_SC, DIRECT_LENDING, "
                 "EXEC_READONLY), masking policies and lineage — built in, not bolted on."),
        ("SAY", "Governance moment: switch to a Trading role and ask about a Direct Lending deal. "
                "<b>Access is refused.</b> Same agent, different role, different answer."),
    ], "One platform to support; security and lineage inherited from Snowflake."),
    ("14:30 – 15:00", "Close", "#5B5B5B", "Everyone", [
        ("SAY", "\"Six roles, one governed copy of the data, one golden number, one platform for IT. "
                "Next step: pick the first two workflows to take to production.\""),
    ], None),
]


def section(t, title, col, aud, rows, value):
    c = colors.HexColor(col)
    head = Table([[Paragraph(title, ss["h"]), Paragraph(t, ss["time"])]], colWidths=[130*mm, 44*mm])
    head.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), c),
                              ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                              ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    body = [[Paragraph("FOR", ss["lab"]), Paragraph(aud, ss["b"])]]
    body += [[Paragraph(l, ss["lab"]), Paragraph(x, ss["b"])] for l, x in rows]
    if value:
        body.append([Paragraph("VALUE", ss["lab"]), Paragraph("<b>%s</b>" % value, ss["b"])])
    bt = Table(body, colWidths=[18*mm, 156*mm])
    bt.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), LIGHT),
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    return KeepTogether([head, bt, Spacer(1, 5*mm)])


def footer(canvas, doc):
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GREY)
    canvas.drawString(18*mm, 10*mm, "LetterOne Treasury Platform · 15-minute persona demo · Snowflake · October 2026")
    canvas.drawRightString(192*mm, 10*mm, "Page %d" % doc.page)


story = [
    Paragraph("LetterOne Treasury Platform", ss["title"]),
    Paragraph("15-Minute Demo Script — six roles, one governed platform", ss["sub"]),
    Paragraph("Presenter: Colm Moynihan · App: L1_APP (LETTERONE_DB) · Account SFSEEUROPE-COLM_USWEST", ss["sub"]),
    Spacer(1, 5*mm),
]

run = [["Time", "Section", "App tabs"],
       ["0:00", "Opening", "Home"],
       ["1:00", "CFO", "Home, Agent, CIO View"],
       ["3:30", "Chief Risk Officer", "Risk Dashboard, Risk Models, Governance"],
       ["6:00", "Traders", "Treasury Ops, Structured Credit, Trustee Reports, Agent"],
       ["8:30", "Research Analysts", "Deal Search, Docs, Calls, Agent"],
       ["11:00", "Operations", "Reconciliation, Treasury Ops, Agent"],
       ["13:00", "IT", "Governance"],
       ["14:30", "Close", "—"]]
rt = Table(run, colWidths=[18*mm, 45*mm, 111*mm])
rt.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
                        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D0D7DE"))]))
story += [Paragraph("Run of show", ss["h2"]), rt, Spacer(1, 6*mm)]
story += [section(*s) for s in SECTIONS]

story += [PageBreak(), Paragraph("Before you present", ss["h2"])]
prep = [
    "Resume the app if needed: <b>L1_APP</b> auto-resumes on first visit; open it 5 minutes early so it is warm.",
    "Resume the interactive warehouse <b>L1_IWH</b> so the Traders section is genuinely sub-second.",
    "Log in with a role that can see all tabs; have a Trading-only role ready for the governance moment.",
    "Run each agent question once beforehand so answers are cached and you know what to expect.",
    "The CFO and COO agents (install/06, install/07) were built but, as of the last notes, not yet redeployed "
    "to the live app. Either redeploy first or use the Treasury Ops and Risk agents for the CFO section as scripted.",
    "All data is synthetic. Say so if asked.",
]
story += [Paragraph("• " + p, ss["b"]) for p in prep]

SimpleDocTemplate(OUT, pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm,
                  bottomMargin=16*mm, title="LetterOne 15-Minute Persona Demo",
                  author="Colm Moynihan").build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
