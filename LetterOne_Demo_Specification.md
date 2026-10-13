# LetterOne: End-to-End Demo Specification

Prepared for: Colm Moynihan (Principal Solution Engineer)
Owner: Cian McCartney (Account Director)
Value input: Lawrence King (Senior Value Advisor)
Version: 1.0, 29 September 2026
Runtime: 60 minutes, hard stop

## 1. Purpose

LetterOne asked us for a bespoke demo after each of the four discovery interviews. Risk asked to see "the workflow and how calculations work on the platform". Direct Lending asked for a demo with a section built for Daniele's use case. Trading asked to see how they would actually query the system. This demo answers all four requests in one session and supports the BVA readout.

The demo has one job: show that a single governed Snowflake platform, starting with Enfusion data in Treasury Operations, can serve Risk, Trading and Direct Lending with AI and natural-language access. No extra point solutions, no extra headcount.

## 2. The art of the possible: the storyline

One governed Data & AI platform for LetterOne. It gives one reliable view of liquidity, positions and risk, automates operations, and shares insight across teams. Start with Operations, then scale into Risk, Trading and Direct Lending ([BVA Deck](https://docs.google.com/presentation/d/16MEhsISDHJNEvrg__hPbRop5WE0j7C2h2ghFDh496O0)).

The narrative arc for the hour:

1. The foundation. Enfusion, market data and LetterOne's own files and documents in one governed place.
2. Operations. The system produces the information and the team reviews exceptions.
3. Risk. History, calculations and scenarios on the same data, with full transparency on how every number is made.
4. Trading. Structured credit monitoring and document analysis that gives the same answer whoever asks.
5. Direct Lending. Unstructured counterparty data turned into validated, reusable information.
6. The close. It's easy to build, governed by design, and it scales without growing the team.

The golden thread: one business definition (for example, USD-equivalent exposure by entity) is defined once in the semantic layer. Colm asks the Ops agent and the Risk agent the same question during the demo and gets the same number. At the close, he shows that number's lineage back to Enfusion. This lands Matei's point that an answer "would be the same no matter who asks it", and it answers David's concern about control.

## 3. Audience

| Function | Attendees | What they care about most |
|---|---|---|
| COO Treasury (Operations) | David Talbot (COO), Steven Gladstone, Dmitry Yurin | Removing the 30 daily spreadsheets, governance and control, a small IT footprint, no added headcount |
| Risk (Treasury) | Jason Lai (CRO), Sam Drury | Historical time series, transparent calculations (VaR, Monte Carlo), consistent reusable analysis |
| Trading (Treasury) | Amy Abob, Matei Moprea | CLO/ABS monitoring, 300-400 page document review, one ledger, trustworthy AI answers |
| Direct Lending | Daniele Gualdani (Direct Investments) | Validating counterparty data and models, deal capacity, post-investment monitoring, flexible data access |

Note: don't describe Direct Lending as part of Treasury. Its reporting line isn't confirmed. Position it as a function that reuses the same governed foundation.

## 4. Demo principles

* Business users first. Every section is driven by a natural-language question or a no-code action before any code is shown. Code only appears when the audience asks for it (Risk will).
* Their data shapes, not generic data. Use synthetic data built to mirror LetterOne's world: Enfusion extracts, a USD-base portfolio with FX hedging, several hundred bank accounts, around 145 CLO/ABS lines, a hedge fund book, and bespoke real estate and asset-backed deals. Don't use real LetterOne data unless Steven explicitly agrees.
* Show the answer, then show the proof. After every AI answer, open the generated SQL, the verified query or the source document page. Jason said a number that simply comes "from Snowflake" doesn't work for him.
* One platform, visibly. Stay in Snowsight, Snowflake Intelligence and Streamlit in Snowflake. Avoid anything that looks like a separate product to buy. David's concern is a "shopping list of other platforms".
* Governance is shown, not stated. Switch roles live at least twice.
* Every section ends on a value hook that links to the BVA model.

## 5. Run of show (60 minutes)

| Time | Section | Lead persona | Key moment |
|---|---|---|---|
| 0:00-0:05 | Opening: one governed foundation | All | Enfusion share, Marketplace and documents sitting side by side in one catalogue |
| 0:05-0:17 | Section 1: COO Treasury Operations | David, Steven, Dmitry | The Excel checklist becomes a live control dashboard, with exceptions only |
| 0:17-0:28 | Section 2: Risk | Jason, Sam | Sam's new calculation built from a prompt, parameters visible, persisted and scheduled |
| 0:28-0:39 | Section 3: Trading | Amy, Matei | Trustee report PDF dropped in, metrics extracted and compared to last month in minutes |
| 0:39-0:50 | Section 4: Direct Lending | Daniele | Counterparty model and IM checked against each other automatically, with a Q&A list drafted |
| 0:50-0:55 | Close: build, govern, scale | All | Golden-thread lineage, role switch, budgets per function |
| 0:55-1:00 | Next steps | Cian | BVA readout, Phase 1 scope, reference call |

If the room runs late, cut the Ops month-end tracker (step 1.5) and the Trading P&L check (step 3.6) first. Never cut the governance moments.

## 6. Opening: one governed foundation (5 minutes)

Goal: in under five minutes, show that everything that follows sits on one platform.

1. Open the Horizon Catalog and show three kinds of data together:
   * Enfusion data via secure data share (trades, positions, P&L, cash). No pipeline, no SFTP.
   * Marketplace data, for example Bloomberg Data License Plus, which Steven confirmed LetterOne licenses and could deliver into Snowflake ([Trading call](https://us-60424.app.gong.io/call?id=4410302181004659962)).
   * LetterOne's own files: bank statements, pricing files, trustee reports, CLO documents and deal folders, landed in stages.
2. Show that it all runs on Azure UK South as fully managed SaaS, with nothing for LetterOne IT to run.
3. Show the four agents in Snowflake Intelligence: Treasury Ops, Risk, Structured Credit and Direct Lending. Say: "Same data foundation, four experiences, each governed by role."

Line to land: "Everything you see today runs on one platform and one bill. The foundation is built once and reused by every team."

## 7. Section 1: COO Treasury Operations (12 minutes)

### What we heard

From David Talbot's interview ([Gong](https://us-60424.app.gong.io/call?id=1211664343137341565)):

* Enfusion is the primary source for trade capture and reporting. Operational processes and internal reporting are built on exports, then manipulated and presented in spreadsheets.
* Around 30 spreadsheets are produced every business day, including P&L, cash rec, cash forecast, position rec, financials and closed-position validation ([BVA Interview Guide](https://docs.google.com/document/d/1lwJEEoz09hoQDD7M2UdZ3RdyDhfzcDoY0lebA5iqYoQ)).
* The team is small: David plus two others on BAU, four or five in finance acting as approvers, and Steven and Dmitry on the tech side.
* "At least half the time" goes on work that could go away. A lot of that is checking that instructions sent to banks and counterparties actually happened.
* Business logic sits in formulas and macros that one or two people understand, and there are multiple versions of the truth. David calls removing spreadsheets and macros "a no brainer".
* Month end allows six or seven business days before Enfusion is locked, mostly spent waiting for emails and FTP files such as portfolio pricing. David estimates 75% of the coordination work could be removed.
* Daily and monthly checklists are kept in Excel, which he described as "pretty archaic".
* The target state he described: dashboards and agents that gather information from Enfusion and external sources, apply a defined rule set, and produce exception reports. Users move from building information to reviewing it. He also wants a standard reporting layer for the front office and management, plus a governed repository of business rules with change management and role-based access.

His concerns:

* "How much can we actually just get natively out of Snowflake": he wants the smallest possible IT footprint.
* Control: "we're not creating a time bomb for ourselves." He needs documentation that stays current and the ability to "get under the hood when things go wrong".
* Running production and a parallel Snowflake build with a lean team.
* Operations isn't a revenue centre, so he wants peer proof of what buy-side firms have gained.

### What David needs to see

The morning run producing itself, his team reviewing exceptions only, and full control over the rules. All of it natively in Snowflake.

### Demo flow

1.1 Treasury Ops control dashboard (Streamlit in Snowflake), 3 minutes
* Open a "Today" view that replaces the Excel daily checklist: each daily output (P&L, cash rec, cash forecast, position rec, closed-position validation) shows a status of complete, running, waiting for input or exception.
* Show what drives it: Dynamic Tables and Tasks refreshing from the Enfusion share on arrival.
* Assign an exception to a named user, add a comment, mark it reviewed. This is the workflow David asked for, with users "brought in and out".

1.2 Cash and position reconciliation, exceptions only, 3 minutes
* Enfusion positions and cash against synthetic bank and custodian statements across a few hundred accounts.
* Matching rules live as governed SQL, not VBA. Only breaks are shown, ranked by value and age.
* Click a break: AI_COMPLETE writes a plain-English likely cause (for example "timing difference, settlement T+1, matched in tomorrow's statement") next to the underlying records.

1.3 Natural language with the Treasury Ops agent (Snowflake Intelligence), 3 minutes
Suggested prompts:
* "What is our total cash by bank counterparty and currency this morning, and what changed versus yesterday?"
* "Which reconciliation breaks over $250k are still open, and how long have they been open?"
* "Show USD-equivalent exposure by entity and the unhedged non-USD amount." (Golden-thread question, part 1.)
* "Which banking counterparties hold more than 20% of our cash?"
After each answer, open the SQL and the verified query to show where the number comes from.

1.4 The "no time bomb" moment, 2 minutes
* Business rules repository: rule definitions held in Git-integrated Snowflake objects, with version history and who changed what and when.
* Auto-generated documentation: object descriptions and column comments drafted by Cortex and approved by Dmitry.
* Time Travel: re-run yesterday's cash rec exactly as it was.
* Parallel-run check: the Snowflake output against the legacy spreadsheet output, with differences highlighted. This is how the team gains confidence before switching anything off.

1.5 Month-end completeness tracker (optional, 1 minute)
* Expected external files (pricing, statements, counterparty confirmations) against received files, landed automatically from email and SFTP via Openflow or stage auto-ingest.
* An alert fires to email or Teams when the last pricing file lands.

### Ease-of-use moment

Add a new bank account or entity to the reconciliation by adding one row to a mapping table in the Streamlit app. No new spreadsheet, no new macro. This backs up the BVA "growth cost avoidance" question: a new mandate or entity without new people.

### Snowflake capabilities shown

Enfusion secure data share, Dynamic Tables, Tasks, Alerts, Streamlit in Snowflake, Snowflake Intelligence (Cortex Agents, Cortex Analyst on a semantic view), AI_COMPLETE, Git integration, Time Travel, Openflow or stage auto-ingest.

### Value hook for the BVA

Ops headcount in the daily run multiplied by share of day spent producing and checking. Add month-end effort (David's 75% estimate), the third-party reconciliation vendor fee, and audit evidence effort ([BVA Interview Guide](https://docs.google.com/document/d/1lwJEEoz09hoQDD7M2UdZ3RdyDhfzcDoY0lebA5iqYoQ)).

## 8. Section 2: Risk (11 minutes)

### What we heard

From Jason Lai and Sam Drury's interview ([Gong](https://us-60424.app.gong.io/call?id=2935570053461375399), [Zoom summary](https://mail.google.com/mail/u/#inbox/1a0d905db4938410)):

* The work falls into three areas: reporting and monitoring (daily to quarterly, plus ad hoc event analysis), underwriting of hedge funds and deals, and research.
* Around 20-30% of time goes on processing. The real cost is reviewing and checking data: comparing today against the previous day, investigating threshold breaches, reloading or overriding.
* Enfusion is a snapshot with no history. To compare with yesterday, Jason opens two reports. Trend analysis runs on parameters stored in spreadsheets with macros and a "clunky" Excel P&L database.
* The book, strategy and product hierarchy is rigid, and regrouping P&L is hard.
* Hedge fund data is scraped from various sources into an Excel database. Treasury time series only go back about two years and aren't granular.
* Jason asked whether Snowflake can calculate standard deviation, VaR and Monte Carlo, and who controls the assumptions. A different correlation matrix gives a different result, and he needs to know "where does the number come from".
* Sam wants a calculation (for example three-year or five-year correlation) to be checked once, persisted as a column and reused, rather than a one-off AI answer he has to re-check in Excel.
* The goal is a dashboard where the CIO clicks to see return drivers, contribution by hedge fund and risk taken, without phoning Jason.
* With time freed up: scenario work (for example a 1970s-style oil shock) and niche market research such as EM hedge funds. Today they only get four or five hours a week for this.
* Data must stay inside LetterOne's governed boundary. Peer comparison needs external data.
* The agreed follow-up was a custom demo showing the workflow and how calculations work on the platform.

### What Jason and Sam need to see

Calculations they control, assumptions they can see and change, results that persist and stay consistent, and history that makes trend analysis trivial.

### Demo flow

2.1 History and automated data checks, 2 minutes
* Show daily Enfusion snapshots accumulating into a governed time-series table. Point out that ten years of Enfusion history can be loaded on day one.
* Ask the Risk agent: "Compare portfolio exposure by strategy today, yesterday and one year ago."
* Show Data Metric Functions with thresholds on the parameters Sam checks every day. Only breaches surface. This replaces the dump-and-compare routine.

2.2 Flexible hierarchy, 1 minute
* "Show Q3 P&L by strategy, then by product." Then: "Now regroup by product, then by book." The semantic view makes regrouping a question, not a restructure.

2.3 Transparent calculations with Cortex Code in a Snowflake Notebook, 4 minutes (the centrepiece)
* Sam's prompt: "Build a 1-day 99% Monte Carlo VaR for the treasury portfolio with 10,000 paths, using a 3-year EWMA covariance matrix."
* Cortex Code writes the Snowpark Python. Parameters sit in explicit, labelled cells: lookback, decay factor, confidence level, number of paths, random seed.
* Run it. Then change one assumption (a stressed correlation matrix) and show the result move. Jason keeps full control of the method.
* Persist the output as a governed table and schedule it daily as a Task. It's now available to the dashboard and the Risk agent. "Check once, reuse forever."
* Standard deviation and historical VaR as plain SQL functions next to it, to show that not everything needs Python.

2.4 Hedge fund monitoring, 2 minutes
* Synthetic hedge fund returns joined with market benchmarks from the Marketplace. Rolling 3-year and 5-year correlations are stored as columns.
* Prompts:
  * "Which hedge funds have the highest correlation to global equities over the last 12 months, and how has that changed versus three years ago?"
  * "What drove treasury portfolio return this month compared with the benchmark?"
  * "Show USD-equivalent exposure by entity." (Golden-thread question, part 2. It must match the Ops answer.)

2.5 CIO one-click view and a scenario, 2 minutes
* A Streamlit page for senior executives: return attribution, contribution by hedge fund, risk by strategy.
* A parameterised stress scenario (oil +X%, equities -Y%, USD +Z%) run from the same notebook, with the result saved and comparable to the previous run.

### Ease-of-use moment

Sam adds a new calculation in natural language, and it becomes a governed, scheduled, reusable column. This directly answers his question about how a new calculation and report get added.

### Concerns to land

* "Rubbish in, rubbish out": quality checks run before any calculation, and lineage shows the inputs.
* Models run inside Snowflake's security perimeter, and nothing leaves LetterOne's account.
* The LLM writes the code. The code runs deterministically and can be reviewed. The LLM doesn't "make up" the number.

### Snowflake capabilities shown

Snowflake Notebooks, Snowpark Python, Cortex Code, Tasks, Data Metric Functions, semantic views, Cortex Analyst, Snowflake Intelligence, Streamlit in Snowflake, Marketplace data.

### Value hook for the BVA

Analyst time recaptured from assembly and checking (20-30%), time to answer a new question, external data processing effort, and the adoption test: "What would make you stop keeping your own parallel copy?"

## 9. Section 3: Trading (11 minutes)

### What we heard

From Amy Abob and Matei Moprea's interview ([Gong](https://us-60424.app.gong.io/call?id=4410302181004659962)):

* The desk runs a structured credit portfolio, mainly CLOs plus ABS, of roughly 141-145 lines. There are three people on the desk.
* Tools: Bloomberg (pricing, market data, messaging), Intex (analytics, trustee data, yields and discount margins), a CLO platform with BWIC data and a new-issue calendar, loan-level pricing, and DealScribe for document comparison (with a limited number of enquiries per year). "Excel is our backbone."
* There are four workstreams:
  * New-issue document review: 300-400 page documents compared with other deals and market standards in a spreadsheet. One or two deals at a time, a few hours to a day each.
  * Monitoring collateral performance and manager behaviour: trustee reports reviewed every two or three months, or monthly for sensitive names, by clicking through Intex.
  * Portfolio-level monitoring of exposures, managers, ratings and allocations: Intex to Excel to Perplexity dashboards.
  * Daily agreement of P&L with Enfusion's P&L.
* Around 10-20% of the week is manual work.
* The AI trust problem: Perplexity and ChatGPT dashboards still have to be sense-checked by hand against Intex. The goal is one ledger with plain-English answers "that would be the same no matter who asks it".
* Pricing will stay in Intex, but "the output has to sit somewhere and ideally not in an excel spreadsheet".
* Management reporting is monthly, in line with monthly marks.
* With freed-up time, the desk could look at other asset classes. Capacity limits what they cover today.

### What Amy and Matei need to see

Their CLO book in one governed place, AI answers they don't have to re-check, and hundreds of pages of documents reduced to comparable data.

### Demo flow

3.1 One structured credit ledger, 2 minutes
* Enfusion positions joined with Intex output files (yield, DM, WAL, cash flows) and Bloomberg pricing and ratings. The result is one table per tranche: manager, vintage, rating, spread, WAL, exposure.
* Show the Intex export landing automatically from a stage. Before the demo, confirm whether Intex offers a Snowflake share. Don't claim it.

3.2 Natural language with the Structured Credit agent, 3 minutes
Suggested prompts:
* "What is our exposure by CLO manager and rating, and how has it changed since last month's marks?"
* "Which tranches are past their non-call date with a spread above the current new-issue level?" (refinancing candidates)
* "Chart BB exposure by vintage."
* "What is the weighted average life of the portfolio, and which ten positions contribute most?"
Then log in as Matei and ask one of the same questions. The answer is identical because it comes from the same semantic view and verified queries. This is the direct fix for the Perplexity sense-check problem.

3.3 Trustee report monitoring, 3 minutes (the wow moment)
* Drop three monthly trustee report PDFs into a stage live.
* AI_EXTRACT pulls the key metrics into a table: OC and IC test cushions, WARF, CCC bucket, defaulted par, diversity score.
* Ask: "Which deals saw the CCC bucket rise by more than one point versus the prior report?" and "Show the OC cushion trend for this deal over six months."
* Show an alert that fires when an OC cushion falls below a set threshold.

3.4 CLO document review, 2 minutes
* A library of offering documents and indentures for the deals they hold, parsed with AI_PARSE_DOCUMENT and indexed in Cortex Search.
* Prompt: "Compare the reinvestment period, CCC haircut and collateral quality test language in this new-issue document with our three most recent holdings from the same manager. Return a table with page references."
* Position this as a complement to DealScribe: it has no enquiry limit on documents LetterOne already holds, and it lives next to the portfolio data.

3.5 Monthly management summary, 1 minute
* A generated monthly portfolio summary (exposures, rating migration, watchlist) with an AI-written commentary draft for Amy to edit.

3.6 Daily P&L check (optional, if time allows)
* Desk P&L against Enfusion P&L with differences flagged. This reuses the Ops reconciliation pattern.

### Ease-of-use moment

A new trustee report goes from PDF to queryable, trended data in minutes, with no Excel step and no re-keying.

### Snowflake capabilities shown

AI_EXTRACT, AI_PARSE_DOCUMENT, Cortex Search, Snowflake Intelligence, semantic views with verified queries, Marketplace (Bloomberg DL+), Alerts, Streamlit in Snowflake.

### Value hook for the BVA

10-20% manual time recaptured across three people, fewer data requests to Ops, and capacity to cover new asset classes. That last one is a revenue story, not only a cost story.

## 10. Section 4: Direct Lending (11 minutes)

### What we heard

From Daniele Gualdani's interview ([Gong](https://us-60424.app.gong.io/call?id=1041622442274814782), [Zoom summary](https://mail.google.com/mail/u/#inbox/1a0e8e699fc3d868)):

* The team covers real estate equity and credit plus asset-backed finance: mortgage pools, inventory loans, tax credit funding, aviation leasing, pharma and music royalties. Every deal is bespoke and there are no off-the-shelf templates.
* Data arrives as Excel and PDF by email, or through a different VDR for each deal. Everything is downloaded into a shared folder split into live, dead and closed deals.
* Around 100 deals have been reviewed this year. The team closes three or four a year, and live deals take two to four months.
* 30% or more of Daniele's time goes on understanding and validating counterparty data and models, and checking that the model matches the PDF describing the deal. There's an issue every time.
* Formats differ by region (US, UK, Far East), so every deal needs a "mental translation".
* She uses ChatGPT as an extra analyst to find inconsistencies between the model and the PDF.
* The IC paper covers counterparty background, track record, market research (CBRE, JLL, Savills) and data points. The team is trialling Moody's EDFx for private credit data.
* On data access, she'd need 15 subscriptions all year round to use data she needs occasionally. She asked whether the Marketplace can be more flexible.
* After investment, holds run three to five years and quarterly counterparty reporting becomes a repeating template. It still takes a lot of time to tie out against the previous quarter and the original underwriting case.
* The team has five people: two co-heads, Daniele and two associates. They're turning away opportunities for lack of capacity. Cutting a three-day review to one day would let them look at more deals.

### What Daniele needs to see

Counterparty files turned into validated, comparable data. Faster first review, institutional memory across 100+ deals, and automated quarterly monitoring.

### Demo flow

4.1 The deal room, 2 minutes
* Point Snowflake at a synthetic copy of the shared folder (live, dead, closed). Before the demo, confirm the connector route (SharePoint connector via Openflow, or stage upload).
* AI_CLASSIFY tags each file by type: operating model, information memorandum, valuation, legal, monitoring report.

4.2 Model-against-IM consistency check, 3 minutes (the centrepiece)
* Take a synthetic Spanish student housing deal. AI_EXTRACT pulls key figures from the counterparty's Excel model and from the IM PDF: purchase price, NOI, market rent, rental growth, exit yield, LTV, target IRR.
* Show a side-by-side table with mismatches flagged, each linked to the source cell and page.
* AI_COMPLETE drafts the list of questions for the counterparty.
* Line to land: "This is what you do with ChatGPT today, but governed, logged, repeatable, and next to your own data."

4.3 Deal memory across 100+ deals, 2 minutes
Cortex Search over the whole deal library:
* "Have we looked at student housing in Spain or Germany before? What rent growth did those counterparties assume, and why did we pass?"
* "Show every asset-backed deal we reviewed this year with royalty cash flows and a summary of each."

4.4 IC paper first draft, 2 minutes
* The Direct Lending agent assembles counterparty background, track record and market context from the deal documents, with citations. Daniele edits the draft. She doesn't start from a blank page.
* Show where Marketplace data would plug in (for example Moody's datasets). Be clear that commercial terms are set by each vendor and flexibility varies. Cian already made this point on the call.

4.5 Post-investment monitoring, 2 minutes
* A quarterly operator report for a closed deal lands, is extracted, and is compared automatically against the prior quarter and the underwriting case.
* Ask: "Which closed deals are tracking more than 5% below underwriting-case NOI, and where is covenant headroom tightest?"

### Governance moment

Switch to a Trading user and ask the Direct Lending agent about a live deal. Access is refused. Deal documents and counterparty data are visible only to the Direct Lending role.

### Ease-of-use moment

Drop a new deal folder in and it's classified, searchable and ready for the consistency check without any setup.

### Snowflake capabilities shown

AI_CLASSIFY, AI_EXTRACT, AI_PARSE_DOCUMENT, AI_COMPLETE, Cortex Search, Snowflake Intelligence, row access and role-based policies, Marketplace.

### Value hook for the BVA

A 30% share of time on validation, review time cut from days to hours, more deals assessed with the same team, and duplicated-build avoidance, because Direct Lending reuses the Treasury foundation rather than building its own. This is the reason for a three-year platform commitment rather than a one-year Treasury project ([BVA Interview Guide](https://docs.google.com/document/d/1lwJEEoz09hoQDD7M2UdZ3RdyDhfzcDoY0lebA5iqYoQ)).

## 11. Close: build it, govern it, scale it (5 minutes)

1. Golden-thread lineage. Open the lineage for the USD-equivalent exposure metric used by both Ops and Risk: from the Enfusion share, through the Dynamic Table and semantic view, to both agents. One definition, one answer, full audit trail.
2. Build speed. Colm uses Cortex Code to create a new view and a Streamlit chart from one prompt in about 60 seconds. Link it to Dmitry's existing Streamlit work: the same instinct, now governed and productionised.
3. AI where people already work. LetterOne has Copilot licences, so show the Snowflake MCP server connecting a governed agent to an external assistant with the same role-based access. This answers the "everyone is using AI differently" problem David raised.
4. Cost control. Budgets and consumption by function (Ops, Risk, Trading, Direct Lending), so spend stays tied to value.
5. Delivery model. Phase 1 takes 10-12 weeks with Kipi.ai, then roughly six-week increments for each new use case. There's no infrastructure to buy or run.

## 12. Next steps (5 minutes, Cian)

* BVA readout with Lawrence, using the numbers from these four sessions.
* Agree Phase 1 scope: the heaviest of the 30 daily spreadsheets first.
* Reference call with a peer COO on Enfusion and Snowflake (Broadreach Investment Management or Svelland Capital).
* Follow-up materials: Monte Carlo and Snowpark examples for Jason and Sam, and a recording of this demo for anyone who missed it.

## 13. Demo environment and data specification

### Synthetic datasets

| Dataset | Mirrors | Used in | Notes |
|---|---|---|---|
| Enfusion trades, positions, P&L, cash (daily snapshots, 3+ years) | Enfusion share / extract | All sections | Align table shapes with the 15-25 Enfusion tables scoped with Kipi.ai |
| Bank and custodian statements (300+ accounts, multi-currency) | Cash rec inputs | Ops | Seed 10-15 realistic breaks |
| External file arrival log (pricing, statements, confirmations) | Month-end dependencies | Ops | Include late files |
| Business rules and mapping tables | Excel/VBA logic | Ops | Versioned in Git |
| Legacy spreadsheet outputs | Parallel run | Ops | For the diff view |
| Book, strategy, product hierarchy | P&L hierarchy | Risk | Supports regrouping |
| Hedge fund returns (20-30 funds, monthly, 5+ years) | Scraped HF database | Risk | Include some EM funds |
| Market benchmarks, FX, rates, oil | Bloomberg / Marketplace | Risk, Trading | Use Marketplace listings where possible |
| CLO/ABS book (~145 tranches) | Intex plus Enfusion | Trading | Manager, vintage, rating, spread, WAL, non-call date |
| Trustee reports (PDF, 6 months, 5 deals) | Monthly trustee reports | Trading | Vary the OC and CCC metrics |
| CLO offering documents (3-4 long synthetic documents) | 300-400 page indentures | Trading | Synthetic or public-domain equivalents only |
| Deal folders (live, dead, closed; ~20 deals) | Direct Lending shared drive | Direct Lending | Include student housing, royalties, aviation |
| Counterparty Excel models plus IM PDFs | Deal inputs | Direct Lending | Seed 4-6 deliberate inconsistencies |
| Quarterly operator reports | Post-investment monitoring | Direct Lending | Include one deal under-performing its underwriting case |

### Roles and access

| Role | Sees | Used to demonstrate |
|---|---|---|
| TREASURY_OPS | Positions, cash, recs, rules | Ops agent, workflow |
| RISK | Full treasury book, hedge fund data, models | Calculations, CIO view |
| TRADING_SC | Structured credit book, trustee data, CLO docs | Structured Credit agent |
| DIRECT_LENDING | Deal library, counterparty data, monitoring | Access refusal to other roles |
| EXEC_READONLY | Dashboards and summary views only | CIO one-click view |

### Agents and semantic layer

* Four Cortex Agents in Snowflake Intelligence, each scoped to one role, with tools for Cortex Analyst (semantic view) and Cortex Search (documents) where relevant.
* One shared semantic view for core Treasury definitions (exposure, cash, P&L), extended per function. Load verified queries for every scripted prompt in this document.
* Rehearse every prompt at least three times. Pin the model choice so answers are stable on the day.

## 14. Likely questions and how to answer

| Question | Who will ask | Answer to demonstrate |
|---|---|---|
| "How much of this is native, and what else do we need to buy?" | David | Everything shown runs in Snowflake on one consumption contract. Point to the single catalogue and bill. |
| "Who controls the assumptions in a calculation?" | Jason | The user. Show parameter cells, a changed correlation matrix, and the code and version history. |
| "Will the AI give different answers to different people?" | Matei | No. The semantic view and verified queries give the same answer to both roles, as shown live. |
| "Does our data leave LetterOne?" | Jason | No. Models run inside Snowflake's perimeter and access is governed by role. |
| "Can I get short-term access to a dataset for one deal?" | Daniele | Delivery is instant through the Marketplace. Commercial flexibility depends on the vendor. Offer to check specific providers. |
| "How do we run this alongside production with a small team?" | David, Steven | Parallel-run diff view, Kipi.ai delivery, and the free Snowflake activation team. |
| "What have peers achieved?" | David | Broadreach reference, a peer COO call, and BVA benchmarks from Lawrence. |
| "Is this a replacement for Intex or DealScribe?" | Amy, Matei | No. Intex remains the pricing standard. Snowflake holds the output and joins it with everything else. |

## 15. Prep checklist

| Item | Owner | Due |
|---|---|---|
| Confirm demo date and attendee list with Steven | Cian | This week |
| Agree synthetic-data approach with Steven and Dmitry | Cian | Before build |
| Build synthetic datasets and roles | Colm | Build week 1 |
| Build four agents, semantic view and verified queries | Colm | Build week 1-2 |
| Streamlit apps: Ops control dashboard, CIO view | Colm | Build week 2 |
| Confirm Intex and Moody's Marketplace availability (don't claim until confirmed) | Colm | Before build |
| Confirm Enfusion table shapes against the Kipi.ai scope | Colm, Kipi.ai | Before build |
| Line up the BVA value hooks for each section | Lawrence | Before dry run |
| Internal dry run, timed to 55 minutes | All | 2 days before |
| Send Jason and Sam the Monte Carlo follow-up materials ahead of the demo | Cian | Before demo |
| Record the session for anyone absent | Cian | Demo day |

## 16. Open points to confirm

* Direct Lending's reporting line and whether Daniele's co-heads attend.
* Whether Trading wants liquidity and cash-buffer visibility in scope, or whether that stays with Operations.
* Whether any real (anonymised) LetterOne sample, such as a trustee report or a redacted deal model, can be used to make the demo more convincing.
* Whether Steven wants a Board-level cut (15 minutes) from the same build for the business case presentation.

## Sources

* [Letterone / Snowflake: COO Treasury Operations interview (Gong)](https://us-60424.app.gong.io/call?id=1211664343137341565)
* [Letterone / Snowflake: Trading interview (Gong)](https://us-60424.app.gong.io/call?id=4410302181004659962)
* [Snowflake / Letterone: Risk interview (Gong)](https://us-60424.app.gong.io/call?id=2935570053461375399)
* [Letterone / Snowflake: Direct Lending interview (Gong)](https://us-60424.app.gong.io/call?id=1041622442274814782)
* [Risk meeting summary (Zoom)](https://mail.google.com/mail/u/#inbox/1a0d905db4938410)
* [Direct Lending meeting summary (Zoom)](https://mail.google.com/mail/u/#inbox/1a0e8e699fc3d868)
* [LetterOne BVA Interview Guide 24/09](https://docs.google.com/document/d/1lwJEEoz09hoQDD7M2UdZ3RdyDhfzcDoY0lebA5iqYoQ)
* [LetterOne BVA Deck Treasury](https://docs.google.com/presentation/d/16MEhsISDHJNEvrg__hPbRop5WE0j7C2h2ghFDh496O0)
