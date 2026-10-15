# Plan: LetterOne Call Intelligence Feature

## Overview

Add a **Calls** tab to the LetterOne Treasury app that provides AI-powered intelligence on C-level calls with LetterOne portfolio company executives. Adapted from the AND-E call intelligence pattern but tailored for investment management: calls are with CEOs, CFOs, and CIOs of portfolio companies (Dia Group, Wintershall Dea, Holland & Barrett, Veon, Uber, etc.).

## Context

- **AND-E pattern**: Pre-computed sentiment, summaries, and red flags stored as table columns (not runtime AI). The app reads and displays them.
- **LetterOne context**: Calls are investor-company interactions, not customer support. Topics include quarterly reviews, restructuring, governance, capital allocation, ESG, and market strategy.
- **Red flags**: Unlike AND-E's word-matching governance, LetterOne red flags are investment-relevant: covenant breach language, management turnover signals, liquidity warnings, regulatory concerns, earnings misses.

## Implementation

### 1. Database Layer (`install/02_tables.sql`)

```sql
CREATE TABLE IF NOT EXISTS EXECUTIVE_CALLS (
  CALL_ID            VARCHAR(20),
  COMPANY            VARCHAR(200),
  CONTACT_NAME       VARCHAR(200),
  CONTACT_ROLE       VARCHAR(100),    -- CEO, CFO, CIO, COO
  CALL_DATE          TIMESTAMP_NTZ(9),
  DURATION_SECONDS   NUMBER(38,0),
  CALLER             VARCHAR(100),    -- LetterOne team member
  CALL_TYPE          VARCHAR(30),     -- Quarterly Review, Ad-hoc, Board Update, Due Diligence
  SENTIMENT          VARCHAR(20),     -- Positive, Negative, Neutral, Mixed
  TRANSCRIPTION      VARCHAR(16777216),
  SUMMARY            VARCHAR(16777216),
  RED_FLAGS          VARCHAR(4000),   -- JSON array of flagged items
  RED_FLAG_COUNT     NUMBER(38,0) DEFAULT 0,
  KEYWORDS           VARCHAR(500)
);
```

### 2. Seed Data (`install/04_load_data.sql`)

15-20 synthetic calls across LetterOne portfolio companies:
- **Companies**: Dia Group (retail), Wintershall Dea (energy), Holland & Barrett (health), Veon (telecom), Turk Telekom, LetterOne Technology
- **Contacts**: CEO, CFO, CIO level
- **Callers**: LetterOne investment team (Daniele Gualdani, Jason Lai, etc.)
- **Topics**: Q3 earnings, restructuring progress, capital reallocation, digital transformation, regulatory updates, ESG commitments
- **Red flags**: Management changes, covenant headroom concerns, capex overruns, regulatory delays, margin compression, key person departures

Each record has a realistic 200-400 word transcript, a 2-3 sentence summary, sentiment, and a JSON array of red flags.

### 3. UI Component (`app/components/CallIntelligencePanel.tsx`)

**Layout:**
- **Header**: "Call Intelligence" title, subtitle "AI analysis of C-level calls with portfolio company executives"
- **KPI row**: Total Calls | Positive % | Flagged Calls | Avg Duration
- **Filter bar**: Search by company/contact, sentiment filter dropdown
- **Call list**: Cards showing company, contact (name + role), date, duration, sentiment badge (green/grey/red), red flag count badge
- **Expanded detail view** (click to expand):
  - **Summary card** (blue accent border)
  - **Sentiment card** (colour-coded: green/amber/red)
  - **Red Flags section** (amber background, each flag as a bullet)
  - **Full Transcript** (scrollable monospace box)

### 4. API Route (`app/app/api/calls/route.ts`)

```
GET /api/calls          → all calls ordered by date desc
GET /api/calls?q=term   → filtered by company/contact name
```

Queries `LETTERONE_DB.PUBLIC.EXECUTIVE_CALLS`.

### 5. Navigation (`app/app/page.tsx`)

- Import `Phone` icon from lucide-react
- Add lazy import for `CallIntelligencePanel`
- Add `{ id: "calls", label: "Calls", icon: Phone }` to NAV_ITEMS (after "CIO View", before "Governance")
- Render `<CallIntelligencePanel />` when active

### 6. No Runtime AI Needed

Following the AND-E pattern, all AI analysis is pre-computed in the seed data. This keeps the demo fast and deterministic. The summaries, sentiment, and red flags are written as realistic synthetic data that demonstrates what Cortex AI functions would produce in production.

### Files Changed

| File | Change |
|------|--------|
| `install/02_tables.sql` | Add EXECUTIVE_CALLS table DDL |
| `install/04_load_data.sql` | Add 15-20 INSERT statements with synthetic call data |
| `app/components/CallIntelligencePanel.tsx` | New component (~200 lines) |
| `app/app/api/calls/route.ts` | New API route |
| `app/app/page.tsx` | Add Calls tab to navigation + lazy import |
