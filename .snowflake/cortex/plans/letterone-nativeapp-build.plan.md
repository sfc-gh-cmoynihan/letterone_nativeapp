# Plan: LetterOne Native App Build

## Context

Adapt the **ANDE_Native_App** template (Next.js 16 + SPCS) into a **LetterOne Treasury/Investment platform** for a 60-minute bespoke demo covering five areas: Treasury Ops, Risk, Trading (Structured Credit), Direct Lending, and Investor Reporting.

The template provides the scaffolding: SPCS deployment, Snowflake SDK connection layer, Interactive Tables + Interactive Warehouse, Cortex Search/Analyst/Agent, and a 12-tab Next.js dashboard. We re-skin all domain objects from insurance to investment management and add a 13th tab for Investor Reporting.

## Architecture Mapping

| Template (AND-E Insurance) | LetterOne |
|---|---|
| `ANDE_DB` | `LETTERONE_DB` |
| `ANDE_COMPUTE_POOL` | `L1_COMPUTE_POOL` |
| `ADHOC_WH` / `ANDE_IWH` | `L1_WH` / `L1_IWH` |
| Customer 360 (6.5M records) | Treasury Portfolio (positions, cash, P&L) |
| Call Center Analytics | Risk Analytics (time series, VaR, hedge funds) |
| Fraud Detection | Structured Credit Monitoring (CLO/ABS) |
| Document Search (policies) | Deal Room + CLO Document Library |
| Predictions (claims) | CIO Executive View (stress scenarios) |
| GeoSpatial (UK map) | Investor Reporting |
| 12 tabs | 13 tabs |
| 1 Cortex Agent | 4 Role-Scoped Agents |

## Tab Structure (13 tabs)

| # | Tab | Demo Section | Component | Key Feature |
|---|-----|-------------|-----------|-------------|
| 1 | **Home** | Opening | `DashboardPanel` | Platform KPIs: position count, cash balance, CLO book size, deal pipeline, investor count |
| 2 | **Treasury Ops** | Section 1 | `TreasuryOpsPanel` | Daily checklist replacing Excel: P&L, cash rec, position rec status, exception workflow |
| 3 | **Reconciliation** | Section 1 | `ReconciliationPanel` | Cash/position breaks ranked by value, AI_COMPLETE plain-English explanations |
| 4 | **Risk Dashboard** | Section 2 | `RiskDashboardPanel` | Portfolio exposure by strategy, time series comparison (today/yesterday/1Y), hedge fund correlations |
| 5 | **Risk Models** | Section 2 | `RiskModelsPanel` | Monte Carlo VaR display, stress scenario parameters, calculation transparency |
| 6 | **Structured Credit** | Section 3 | `StructuredCreditPanel` | CLO/ABS ledger: ~145 tranches with manager, vintage, rating, spread, WAL, non-call date |
| 7 | **Trustee Reports** | Section 3 | `TrusteeReportsPanel` | PDF upload to stage, AI_EXTRACT metrics (OC, IC, WARF, CCC), trend charts, threshold alerts |
| 8 | **Deal Room** | Section 4 | `DealRoomPanel` | Deal library (live/dead/closed), AI_CLASSIFY file types, model-vs-IM consistency check |
| 9 | **Deal Search** | Section 4 | `DealSearchPanel` | Cortex Search over 100+ deals: "Have we seen student housing in Spain before?" |
| 10 | **Investor Reporting** | New | `InvestorReportingPanel` | Investor-level views: capital accounts, NAV statements, fee calculations, distribution history, document generation |
| 11 | **CIO View** | Section 2/Close | `CIOViewPanel` | Executive dashboard: return attribution, contribution by fund, stress scenario results |
| 12 | **Governance** | Close | `GovernancePanel` | Role switching demo, lineage trace for golden-thread metric, budget by function |
| 13 | **Agent** | All | `AgentPanel` | 4-agent selector (Treasury Ops, Risk, Structured Credit, Direct Lending) with role context |

## Investor Reporting Tab — Detail

This tab answers the question: "How do we produce LP/investor communications from the same governed data?" It ties to the demo's "one platform" narrative — investor reporting is built from the same position, cash and P&L data that Treasury Ops and Risk already govern, not a separate export.

### What it shows

1. **Investor Overview** — Table of investors (LPs) with committed capital, called capital, distributions, NAV, TVPI, DPI, IRR. Filter by fund/vehicle.
2. **Capital Account Statement** — Per-investor waterfall: opening NAV, contributions, distributions, management fee, carry, performance allocation, closing NAV. Selectable period (quarterly).
3. **NAV Bridge** — Chart showing how NAV moved period-over-period: market value changes, realised gains, income, fees, FX.
4. **Distribution History** — Timeline of capital calls and distributions per investor, with status (pending, paid, received).
5. **Fee Transparency** — Management fee and performance fee calculations, showing the rate, the basis, and the result. Addresses David's "get under the hood" concern.
6. **Report Generation** — AI_COMPLETE drafts a quarterly investor letter from the underlying data, with key performance figures, market commentary context, and portfolio highlights. The user reviews and edits before sending.

### Value hook
Investor reporting is a separate workstream today, pulling the same data the COO team already produces but reformatting it for external consumption. Automating it from the governed source removes duplication and reduces the risk of sending investors a number that doesn't match internal reports.

## Data Model (17 tables)

### Core Treasury (from "Enfusion")
```
ENFUSION_POSITIONS (daily snapshots, 3+ years)
  SNAPSHOT_DATE, POSITION_ID, INSTRUMENT_NAME, INSTRUMENT_TYPE, ISIN,
  ENTITY, STRATEGY, BOOK, PRODUCT,
  QUANTITY, MARKET_VALUE_LOCAL, CURRENCY, MARKET_VALUE_USD,
  UNREALISED_PNL_USD

ENFUSION_CASH (daily, 300+ accounts)
  SNAPSHOT_DATE, ACCOUNT_ID, BANK_NAME, ACCOUNT_NUMBER,
  CURRENCY, BALANCE_LOCAL, BALANCE_USD, ENTITY

ENFUSION_PNL (daily P&L)
  REPORT_DATE, ENTITY, STRATEGY, BOOK,
  TOTAL_PNL_USD, REALISED_PNL_USD, UNREALISED_PNL_USD,
  FX_PNL_USD, INTEREST_PNL_USD

ENFUSION_TRADES (trade records)
  TRADE_DATE, SETTLEMENT_DATE, TRADE_ID, INSTRUMENT_NAME,
  BUY_SELL, QUANTITY, PRICE, NOTIONAL_USD,
  COUNTERPARTY, ENTITY, STRATEGY, STATUS
```

### Reconciliation
```
BANK_STATEMENTS (synthetic custodian/bank data)
  STATEMENT_DATE, BANK_NAME, ACCOUNT_NUMBER, CURRENCY,
  OPENING_BALANCE, CLOSING_BALANCE, CREDITS, DEBITS

RECONCILIATION_BREAKS (pre-seeded breaks)
  BREAK_ID, BREAK_DATE, BREAK_TYPE, ACCOUNT_ID, BANK_NAME,
  ENFUSION_AMOUNT, STATEMENT_AMOUNT, DIFFERENCE_USD,
  STATUS, AI_EXPLANATION, ASSIGNED_TO, DAYS_OPEN
```

### Risk / Hedge Funds
```
HEDGE_FUND_RETURNS (20-30 funds, 5+ years monthly)
  FUND_NAME, FUND_STRATEGY, REPORT_MONTH,
  MONTHLY_RETURN_PCT, AUM_USD, NAV_PER_SHARE,
  CORRELATION_EQUITY_3Y, CORRELATION_EQUITY_5Y

MARKET_BENCHMARKS (daily)
  BENCHMARK_DATE, BENCHMARK_NAME, VALUE, DAILY_CHANGE_PCT
```

### Trading / Structured Credit
```
CLO_PORTFOLIO (~145 tranches)
  TRANCHE_ID, DEAL_NAME, MANAGER, VINTAGE_YEAR,
  TRANCHE_RATING, ORIGINAL_RATING, SPREAD_BPS, WAL_YEARS,
  NON_CALL_DATE, MATURITY_DATE, NOTIONAL_USD, MARKET_VALUE_USD,
  ASSET_TYPE

TRUSTEE_METRICS (6 months x 5 deals = 30 rows)
  DEAL_NAME, REPORT_DATE, REPORT_MONTH,
  OC_TEST_CUSHION_PCT, IC_TEST_CUSHION_PCT,
  WARF, CCC_BUCKET_PCT, DEFAULTED_PAR_PCT, DIVERSITY_SCORE

CLO_DOCUMENTS (metadata for parsed docs)
  DOCUMENT_ID, DEAL_NAME, DOCUMENT_TYPE, FILE_PATH,
  REINVESTMENT_PERIOD_END, CCC_HAIRCUT_LANGUAGE, PAGE_COUNT,
  PARSED_TEXT
```

### Direct Lending
```
DEAL_LIBRARY (~20 deals)
  DEAL_ID, DEAL_NAME, SECTOR, REGION, COUNTRY,
  DEAL_STATUS, ASSET_TYPE, DEAL_TYPE,
  PURCHASE_PRICE_USD, NOI_USD, TARGET_IRR_PCT, LTV_PCT,
  EXIT_YIELD_PCT, RENTAL_GROWTH_PCT, MARKET_RENT_USD,
  UNDERWRITING_NOI_USD, CURRENT_NOI_USD,
  COVENANT_HEADROOM_PCT, QUARTERLY_REPORT_DATE,
  PASS_REASON, REVIEW_DATE

DEAL_DOCUMENTS (metadata for Cortex Search)
  DOC_ID, DEAL_ID, DEAL_NAME, FILE_TYPE,
  FILE_NAME, FILE_PATH, PARSED_TEXT, CLASSIFICATION
```

### Investor Reporting (new)
```
INVESTORS (LP master data, ~15 investors)
  INVESTOR_ID, INVESTOR_NAME, INVESTOR_TYPE,
  DOMICILE, FUND_VEHICLE, COMMITTED_CAPITAL_USD,
  FIRST_COMMITMENT_DATE, STATUS

CAPITAL_ACCOUNTS (quarterly snapshots, ~15 investors x 12 quarters = ~180 rows)
  INVESTOR_ID, PERIOD_END_DATE, FUND_VEHICLE,
  OPENING_NAV_USD, CONTRIBUTIONS_USD, DISTRIBUTIONS_USD,
  MANAGEMENT_FEE_USD, PERFORMANCE_FEE_USD,
  MARKET_VALUE_CHANGE_USD, REALISED_GAINS_USD,
  INCOME_USD, FX_IMPACT_USD, CLOSING_NAV_USD,
  CALLED_CAPITAL_USD, TOTAL_DISTRIBUTIONS_USD,
  TVPI, DPI, NET_IRR_PCT

CAPITAL_ACTIVITY (individual calls/distributions, ~100 rows)
  ACTIVITY_ID, INVESTOR_ID, FUND_VEHICLE,
  ACTIVITY_TYPE, ACTIVITY_DATE, AMOUNT_USD,
  STATUS, NOTICE_DATE, DUE_DATE, REFERENCE
```

### Reference
```
FX_RATES (daily)
  RATE_DATE, CURRENCY_PAIR, RATE

BUSINESS_RULES (reconciliation rules)
  RULE_ID, RULE_NAME, RULE_CATEGORY, RULE_SQL, VERSION, UPDATED_BY, UPDATED_AT
```

## Interactive Tables (6)

| IT Name | Source | Cluster Key |
|---------|--------|-------------|
| `POSITIONS_IT` | `ENFUSION_POSITIONS` | `ENTITY` |
| `CASH_IT` | `ENFUSION_CASH` | `BANK_NAME` |
| `CLO_PORTFOLIO_IT` | `CLO_PORTFOLIO` | `MANAGER` |
| `HEDGE_FUNDS_IT` | `HEDGE_FUND_RETURNS` | `FUND_NAME` |
| `DEALS_IT` | `DEAL_LIBRARY` | `DEAL_STATUS` |
| `CAPITAL_ACCOUNTS_IT` | `CAPITAL_ACCOUNTS` | `INVESTOR_ID` |

## Cortex Services

### Cortex Search (2 services)
1. **DEAL_DOCUMENT_SEARCH** — Over `DEAL_DOCUMENTS.PARSED_TEXT`, attributes: `DEAL_NAME`, `FILE_TYPE`, `CLASSIFICATION`
2. **CLO_DOCUMENT_SEARCH** — Over `CLO_DOCUMENTS.PARSED_TEXT`, attributes: `DEAL_NAME`, `DOCUMENT_TYPE`

### Semantic Views (5)
1. **SV_TREASURY** — Joins `POSITIONS_IT`, `CASH_IT`, `ENFUSION_PNL`. The **golden thread** view: defines `TOTAL_EXPOSURE_USD`, `CASH_BY_ENTITY`, `UNHEDGED_NON_USD`. Used by both Ops and Risk agents.
2. **SV_RISK** — Joins `HEDGE_FUNDS_IT`, `MARKET_BENCHMARKS`, `POSITIONS_IT`. Metrics: `MONTHLY_RETURN`, `CORRELATION_3Y`, `EXPOSURE_BY_STRATEGY`.
3. **SV_STRUCTURED_CREDIT** — `CLO_PORTFOLIO_IT` + `TRUSTEE_METRICS`. Metrics: `EXPOSURE_BY_MANAGER`, `SPREAD_BPS`, `OC_CUSHION_TREND`.
4. **SV_DIRECT_LENDING** — `DEALS_IT`. Metrics: `DEAL_COUNT_BY_STATUS`, `NOI_VS_UNDERWRITING`, `COVENANT_HEADROOM`.
5. **SV_INVESTOR_REPORTING** — `CAPITAL_ACCOUNTS_IT` + `INVESTORS`. Metrics: `CLOSING_NAV`, `TVPI`, `DPI`, `NET_IRR`, `TOTAL_CALLED`, `TOTAL_DISTRIBUTED`.

### Cortex Agents (4, role-scoped)
1. **TREASURY_OPS_AGENT** — Tools: `query_treasury_data` (SV_TREASURY)
2. **RISK_AGENT** — Tools: `query_risk_data` (SV_RISK), `query_treasury_data` (SV_TREASURY)
3. **STRUCTURED_CREDIT_AGENT** — Tools: `query_credit_data` (SV_STRUCTURED_CREDIT), `search_clo_docs` (CLO_DOCUMENT_SEARCH)
4. **DIRECT_LENDING_AGENT** — Tools: `query_deals` (SV_DIRECT_LENDING), `search_deals` (DEAL_DOCUMENT_SEARCH)

The Investor Reporting tab uses SV_INVESTOR_REPORTING via direct Cortex Analyst queries (no dedicated agent — the data is straightforward enough to query directly, and investor reporting users would typically use the structured tab rather than chat).

### Roles and Grants
```
TREASURY_OPS   -> POSITIONS_IT, CASH_IT, ENFUSION_PNL, BANK_STATEMENTS, RECONCILIATION_BREAKS, BUSINESS_RULES
RISK           -> POSITIONS_IT, CASH_IT, ENFUSION_PNL, HEDGE_FUNDS_IT, MARKET_BENCHMARKS
TRADING_SC     -> CLO_PORTFOLIO_IT, TRUSTEE_METRICS, CLO_DOCUMENTS
DIRECT_LENDING -> DEALS_IT, DEAL_DOCUMENTS (exclusive: no other role sees these)
EXEC_READONLY  -> All interactive tables (SELECT only), CAPITAL_ACCOUNTS_IT, INVESTORS
```

EXEC_READONLY also gets the investor reporting tables, since investor communications are typically a C-suite/COO concern.

## API Routes (20)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/dashboard` | GET | Home KPIs |
| `/api/positions` | GET | Position search/filter |
| `/api/cash` | GET | Cash balances |
| `/api/pnl` | GET | P&L summary |
| `/api/reconciliation` | GET | Breaks with AI explanations |
| `/api/treasury-ops` | GET | Daily checklist status |
| `/api/risk` | GET | Portfolio exposure, time series |
| `/api/hedge-funds` | GET | Fund returns, correlations |
| `/api/benchmarks` | GET | Market benchmarks |
| `/api/clo-portfolio` | GET | CLO/ABS positions |
| `/api/trustee-metrics` | GET | Trustee extracted metrics |
| `/api/deals` | GET | Deal library |
| `/api/deal-documents` | GET | Cortex Search - deals |
| `/api/clo-documents` | GET | Cortex Search - CLOs |
| `/api/investors` | GET | Investor overview, capital accounts, activity |
| `/api/investor-letter` | POST | AI_COMPLETE generates quarterly letter draft |
| `/api/cio-view` | GET | Executive aggregations |
| `/api/governance` | GET | Role info, lineage, budgets |
| `/api/agent` | POST | Route to correct Cortex Agent |
| `/api/query` | POST | Generic SQL proxy |

## Implementation Steps

### Step 1: Clone Template and Scaffold
- Clone ANDE_Native_App into working directory
- Rename all ANDE references to LETTERONE/L1
- Update `snowflake.yml`, `app.yml`, Dockerfile
- Update `package.json` name and version

### Step 2: SQL Infrastructure Scripts (01-03)
- `01_infrastructure.sql`: LETTERONE_DB, L1_WH, L1_IWH, L1_COMPUTE_POOL, stages, EAI, 5 roles with grants
- `02_tables.sql`: All 17 table DDLs
- `03_interactive_tables.sql`: 6 interactive tables on L1_IWH

### Step 3: Synthetic Data and Load Script (04)
- Generate CSV data for all 17 tables using inline SQL (VALUES clauses or scripted generation)
- `04_load_data.sql`: INSERT statements or PUT + COPY INTO
- Seed deliberate breaks, CLO metric variations, deal inconsistencies, and one under-performing investor fund

### Step 4: Cortex Services Script (05)
- `05_cortex_services.sql`: 2 search services, 5 semantic views (YAML), 4 agents
- Verified queries for every scripted demo prompt

### Step 5: Backend API Routes
- Adapt existing routes from insurance to investment domain
- Add new routes for treasury ops, reconciliation, CLO, deals, investors, investor letter generation
- Keep the Snowflake connection layer largely intact

### Step 6: Frontend Components (13 tabs)
- Build all 13 tab components with Recharts
- LetterOne branding: clean financial aesthetic, navy/white tones
- Investor Reporting tab: overview table, capital account waterfall, NAV bridge chart, distribution timeline, fee breakdown, AI letter generation

### Step 7: Deploy to SPCS and Test
- Run install scripts 01-05
- `snow app deploy`
- Walk through all 13 tabs
- Test every agent prompt from the demo spec
- Verify role-based access

## Verification

1. All 17 tables populated with correct row counts
2. All 6 interactive tables queryable via L1_IWH
3. All 4 agents respond correctly to scripted prompts
4. Golden-thread test: same exposure question returns same number from Ops and Risk agents
5. Role-based access: Trading user cannot query Direct Lending data
6. All 13 tabs render without errors
7. Investor Reporting: NAV bridge sums correctly (opening + changes = closing), TVPI/DPI calculations are consistent
8. App accessible via SPCS public URL

## Critical Files

- `install/01_infrastructure.sql` — All Snowflake objects: database, warehouses, compute pool, roles, grants
- `install/05_cortex_services.sql` — Semantic views (YAML), agents, search services — the AI backbone
- `app/app/page.tsx` — Main tabbed dashboard layout, all 13 tabs defined here
- `app/lib/snowflake.ts` — Snowflake connection layer (reused from template, minimal changes)
- `app/components/InvestorReportingPanel.tsx` — New component for the Investor Reporting tab
