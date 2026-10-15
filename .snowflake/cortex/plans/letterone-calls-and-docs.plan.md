# Plan: LetterOne Calls and Docs Tabs

## Context

Two new tabs are being added to the LetterOne Treasury app:

1. **Calls** — C-level call intelligence (adapted from the AND-E pattern). Pre-computed sentiment, summaries, and red flags for investor calls with portfolio company executives.
2. **Docs** — Document intelligence over ESG reports, annual reports, and news articles. Uses Cortex Search for semantic search, with pre-computed summaries, sentiment, and links to original PDFs on the `L1_DOCUMENT_STAGE` stage.

### Existing patterns to follow
- **Document tables**: `DEAL_DOCUMENTS` and `CLO_DOCUMENTS` — both have `PARSED_TEXT` (16MB), `FILE_PATH` (stage path), and metadata columns. Seeded via SQL INSERT with synthetic text.
- **Cortex Search**: `DEAL_DOCUMENT_SEARCH` and `CLO_DOCUMENT_SEARCH` — both use `SEARCH_PREVIEW()` in API routes.
- **API routes**: GET routes with optional `?q=` param for search, falling back to full listing.
- **UI components**: Consistent inline styles, card-based layouts, expandable detail views.
- **Stage**: `L1_DOCUMENT_STAGE` with directory enabled — intended for PDFs.

### Key files
- [install/02_tables.sql](install/02_tables.sql) — Table DDL (add 2 new tables)
- [install/04_load_data.sql](install/04_load_data.sql) — Seed data (add call + document records)
- [install/05_cortex_services.sql](install/05_cortex_services.sql) — Cortex Search service (add 1 new service)
- [app/app/page.tsx](app/app/page.tsx) — Navigation (add 2 tabs)
- [app/components/](app/components/) — New UI components (2 new files)

---

## Implementation Steps

### Task 1: Create database tables

Add to `install/02_tables.sql`:

**EXECUTIVE_CALLS** — C-level call records with pre-computed AI analysis:
```sql
CREATE OR REPLACE TABLE EXECUTIVE_CALLS (
  CALL_ID            VARCHAR(20),
  COMPANY            VARCHAR(200),       -- Dia Group, Wintershall Dea, Veon, etc.
  CONTACT_NAME       VARCHAR(200),       -- C-level contact
  CONTACT_ROLE       VARCHAR(100),       -- CEO, CFO, CIO, COO
  CALL_DATE          TIMESTAMP_NTZ(9),
  DURATION_SECONDS   NUMBER(38,0),
  CALLER             VARCHAR(100),       -- LetterOne team member
  CALL_TYPE          VARCHAR(30),        -- Quarterly Review, Ad-hoc, Board Update
  SENTIMENT          VARCHAR(20),        -- Positive, Negative, Neutral, Mixed
  TRANSCRIPTION      VARCHAR(16777216),
  SUMMARY            VARCHAR(16777216),
  RED_FLAGS          VARCHAR(4000),      -- JSON array of flagged items
  RED_FLAG_COUNT     NUMBER(38,0) DEFAULT 0,
  KEYWORDS           VARCHAR(500)
);
```

**COMPANY_DOCUMENTS** — ESG reports, annual reports, news articles:
```sql
CREATE OR REPLACE TABLE COMPANY_DOCUMENTS (
  DOC_ID             VARCHAR(20),
  COMPANY            VARCHAR(200),
  DOC_TYPE           VARCHAR(50),        -- ESG Report, Annual Report, News Article
  DOC_TITLE          VARCHAR(500),
  DOC_DATE           DATE,
  AUTHOR             VARCHAR(200),       -- Company name, journalist, or analyst
  FILE_PATH          VARCHAR(500),       -- @L1_DOCUMENT_STAGE/company-docs/...
  PARSED_TEXT        VARCHAR(16777216),
  SUMMARY            VARCHAR(16777216),
  SENTIMENT          VARCHAR(20),
  KEYWORDS           VARCHAR(500),
  SOURCE_URL         VARCHAR(1000)       -- Original article/report URL (for news)
);
```

### Task 2: Seed 15-20 call records

Add to `install/04_load_data.sql`. Calls across LetterOne portfolio companies:

| Company | Contact | Role | Topic | Sentiment | Red Flags |
|---------|---------|------|-------|-----------|-----------|
| Dia Group | Ricardo Rubi | CEO | Q3 earnings, store footprint rationalisation | Mixed | Margin compression in Iberia |
| Wintershall Dea | Mario Mehren | CEO | Energy transition, divestiture progress | Positive | None |
| Holland & Barrett | Sam Shersby-Sherston | CEO | Digital transformation, UK market growth | Positive | None |
| Veon | Kaan Terzioglu | CEO | Subscriber growth, regulatory | Negative | Regulatory fine in Pakistan, CFO departure |
| Turk Telekom | Umit Onel | CEO | Capex, fibre rollout, FX exposure | Mixed | Lira depreciation, capex overrun |
| LetterOne Technology | Various | CIO | Cloud migration, cybersecurity spend | Positive | None |

Each record has: realistic 200-400 word transcript, 2-3 sentence summary, sentiment, and JSON array of red flags (e.g. `["CFO departure announced","Regulatory fine of $15M in Pakistan market"]`).

### Task 3: Seed 15-20 company documents

Add to `install/04_load_data.sql`. Mix of document types:

| Type | Examples |
|------|---------|
| **ESG Report** | Dia Group Sustainability Report 2025, Veon ESG Impact Assessment, Holland & Barrett Carbon Neutral Commitment |
| **Annual Report** | Wintershall Dea Annual Report 2025, Turk Telekom Financial Statements H1 2026 |
| **News Article** | "Veon faces regulatory pressure in Central Asia" (FT), "Holland & Barrett accelerates international expansion" (Reuters), "LetterOne explores energy asset disposal" (Bloomberg) |

Each record has: synthetic parsed text (200-300 words), AI summary, sentiment, keywords, `FILE_PATH` pointing to `@L1_DOCUMENT_STAGE/company-docs/`, and `SOURCE_URL` for news articles.

### Task 4: Create Cortex Search service for company documents

Add to `install/05_cortex_services.sql`:

```sql
CREATE OR REPLACE CORTEX SEARCH SERVICE COMPANY_DOCUMENT_SEARCH
  ON PARSED_TEXT
  ATTRIBUTES COMPANY, DOC_TYPE, DOC_TITLE, SENTIMENT
  WAREHOUSE = L1_WH
  TARGET_LAG = '1 hour'
  AS (
    SELECT PARSED_TEXT, COMPANY, DOC_TYPE, DOC_TITLE, SENTIMENT
    FROM COMPANY_DOCUMENTS
    WHERE PARSED_TEXT IS NOT NULL
  );
```

### Task 5: Create CallIntelligencePanel.tsx

New component at `app/components/CallIntelligencePanel.tsx` (~200 lines):

- **Header**: "Call Intelligence" / "AI analysis of C-level calls with portfolio company executives"
- **KPI row** (4 cards): Total Calls, Positive Sentiment %, Flagged Calls, Avg Duration
- **Filter bar**: Text search (company/contact), sentiment dropdown filter
- **Call list**: Cards showing company, contact name + role, date, duration, sentiment badge (colour-coded), red flag count badge (red if > 0)
- **Expanded detail** (click card to expand):
  - Summary card (blue left border)
  - Sentiment indicator (green/amber/red)
  - Red Flags section (amber/red background, each flag as bullet) — only shown if flags exist
  - Full Transcript (scrollable monospace box, max-height 300px)

Fetches from `/api/calls`.

### Task 6: Create DocumentsPanel.tsx

New component at `app/components/DocumentsPanel.tsx` (~180 lines):

- **Header**: "Document Intelligence" / "ESG reports, annual reports, and news articles across portfolio companies"
- **Search bar**: Cortex Search input with suggested queries (e.g. "What is Dia Group's carbon reduction target?", "Show ESG commitments across the portfolio")
- **Filter chips**: All / ESG Report / Annual Report / News Article
- **Document cards**: Title, company, type badge (colour per type), date, sentiment badge, summary preview (first 100 chars)
- **Expanded detail** (click to expand):
  - Full Summary card
  - Sentiment card
  - Keywords as tags
  - "View Original" link — for PDFs: stage path reference; for news: external SOURCE_URL
  - Full parsed text in scrollable box

Two modes:
- **Search mode** (`?q=`): Uses `SEARCH_PREVIEW('LETTERONE_DB.PUBLIC.COMPANY_DOCUMENT_SEARCH', ...)` — same pattern as DealSearchPanel
- **Browse mode** (no query): Lists all documents from table, filterable by DOC_TYPE

Fetches from `/api/company-docs`.

### Task 7: Create API routes

**`app/app/api/calls/route.ts`**:
```typescript
GET /api/calls           -> all calls, ordered by CALL_DATE DESC
GET /api/calls?q=term    -> filtered by COMPANY or CONTACT_NAME ILIKE
```

**`app/app/api/company-docs/route.ts`**:
```typescript
GET /api/company-docs           -> all docs, ordered by DOC_DATE DESC
GET /api/company-docs?q=term    -> Cortex Search via SEARCH_PREVIEW
GET /api/company-docs?type=X    -> filtered by DOC_TYPE
```

### Task 8: Add tabs to page.tsx

- Import `Phone` and `FileSearch` icons from lucide-react
- Lazy-load `CallIntelligencePanel` and `DocumentsPanel`
- Add to NAV_ITEMS (after "CIO View", before "Governance"):
  - `{ id: "calls", label: "Calls", icon: Phone }`
  - `{ id: "docs", label: "Docs", icon: FileSearch }`
- Render panels when active

### Task 9: Execute SQL and deploy

- Run the table creation SQL against Snowflake
- Run the seed data SQL
- Create the Cortex Search service
- Verify data with SELECT queries

### Task 10: Commit and push

- Bump version to v2.2 in page.tsx
- Commit all changes
- Push to GitHub

---

## Verification

1. Query `SELECT COUNT(*) FROM EXECUTIVE_CALLS` — expect 15-20 rows
2. Query `SELECT COUNT(*) FROM COMPANY_DOCUMENTS` — expect 15-20 rows
3. Query `SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW('LETTERONE_DB.PUBLIC.COMPANY_DOCUMENT_SEARCH', 'ESG carbon', 3)` — expect results
4. After deploy: verify Calls tab shows call list with sentiment badges and expandable details
5. After deploy: verify Docs tab supports both search and browse modes
