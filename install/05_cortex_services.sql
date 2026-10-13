-- ============================================================================
-- LetterOne Treasury Platform — Cortex Services
-- Version: 1.0 | Date: 2026-09-29
-- Creates: 2 Cortex Search services, 5 Semantic Views, 4 Cortex Agents
-- ============================================================================

USE ROLE ACCOUNTADMIN;
USE DATABASE LETTERONE_DB;
USE SCHEMA PUBLIC;
USE WAREHOUSE L1_WH;

-- ============================================================================
-- CORTEX SEARCH SERVICES
-- ============================================================================

CREATE OR REPLACE CORTEX SEARCH SERVICE DEAL_DOCUMENT_SEARCH
  ON PARSED_TEXT
  ATTRIBUTES DEAL_NAME, FILE_TYPE, CLASSIFICATION
  WAREHOUSE = L1_WH
  TARGET_LAG = '1 hour'
  AS (
    SELECT PARSED_TEXT, DEAL_NAME, FILE_TYPE, CLASSIFICATION
    FROM DEAL_DOCUMENTS
    WHERE PARSED_TEXT IS NOT NULL
  );

CREATE OR REPLACE CORTEX SEARCH SERVICE CLO_DOCUMENT_SEARCH
  ON PARSED_TEXT
  ATTRIBUTES DEAL_NAME, DOCUMENT_TYPE
  WAREHOUSE = L1_WH
  TARGET_LAG = '1 hour'
  AS (
    SELECT PARSED_TEXT, DEAL_NAME, DOCUMENT_TYPE
    FROM CLO_DOCUMENTS
    WHERE PARSED_TEXT IS NOT NULL
  );

-- ============================================================================
-- SEMANTIC VIEWS
-- ============================================================================

-- 1. SV_TREASURY — The golden thread view (used by Ops and Risk agents)
CREATE OR REPLACE SEMANTIC VIEW SV_TREASURY
  COMMENT = 'Core treasury view: positions, cash, P&L. Defines USD-equivalent exposure by entity.'
  AS $$
  name: Treasury Operations
  tables:
    - name: LETTERONE_DB.PUBLIC.POSITIONS_IT
      base_table:
        database: LETTERONE_DB
        schema: PUBLIC
        table: POSITIONS_IT
      primary_key:
        columns: [POSITION_ID, SNAPSHOT_DATE]
      dimensions:
        - name: INSTRUMENT_NAME
          expr: INSTRUMENT_NAME
          description: Name of the instrument held
          data_type: VARCHAR
        - name: INSTRUMENT_TYPE
          expr: INSTRUMENT_TYPE
          description: Type of instrument (Government Bond, FX Forward, ETF, etc.)
          data_type: VARCHAR
        - name: ENTITY
          expr: ENTITY
          description: LetterOne entity (L1 Treasury, L1 Energy, L1 Technology, L1 Health, L1 Retail)
          data_type: VARCHAR
        - name: STRATEGY
          expr: STRATEGY
          description: Investment strategy (Rates, Credit, FX Hedging, Cash Mgmt, Macro, Structured, Direct)
          data_type: VARCHAR
        - name: BOOK
          expr: BOOK
          description: Trading book within a strategy
          data_type: VARCHAR
        - name: PRODUCT
          expr: PRODUCT
          description: Product category (Fixed Income, Cash, Derivatives, Equity, etc.)
          data_type: VARCHAR
        - name: CURRENCY
          expr: CURRENCY
          description: Local currency of the position
          data_type: VARCHAR
        - name: SNAPSHOT_DATE
          expr: SNAPSHOT_DATE
          description: Date of the position snapshot
          data_type: DATE
      facts:
        - name: MARKET_VALUE_USD
          expr: MARKET_VALUE_USD
          description: Market value in USD equivalent. This is the USD-equivalent exposure.
          data_type: NUMBER
        - name: MARKET_VALUE_LOCAL
          expr: MARKET_VALUE_LOCAL
          description: Market value in local currency
          data_type: NUMBER
        - name: QUANTITY
          expr: QUANTITY
          description: Number of units or notional amount
          data_type: NUMBER
        - name: UNREALISED_PNL_USD
          expr: UNREALISED_PNL_USD
          description: Unrealised profit or loss in USD
          data_type: NUMBER

    - name: LETTERONE_DB.PUBLIC.CASH_IT
      base_table:
        database: LETTERONE_DB
        schema: PUBLIC
        table: CASH_IT
      primary_key:
        columns: [ACCOUNT_ID, SNAPSHOT_DATE]
      dimensions:
        - name: BANK_NAME
          expr: BANK_NAME
          description: Name of the bank or custodian holding the cash
          data_type: VARCHAR
        - name: ACCOUNT_NUMBER
          expr: ACCOUNT_NUMBER
          description: Bank account number
          data_type: VARCHAR
        - name: CURRENCY
          expr: CURRENCY
          description: Currency of the cash balance
          data_type: VARCHAR
        - name: ENTITY
          expr: ENTITY
          description: LetterOne entity owning the account
          data_type: VARCHAR
        - name: SNAPSHOT_DATE
          expr: SNAPSHOT_DATE
          description: Date of the cash snapshot
          data_type: DATE
      facts:
        - name: BALANCE_USD
          expr: BALANCE_USD
          description: Cash balance in USD equivalent
          data_type: NUMBER
        - name: BALANCE_LOCAL
          expr: BALANCE_LOCAL
          description: Cash balance in local currency
          data_type: NUMBER

    - name: LETTERONE_DB.PUBLIC.ENFUSION_PNL
      base_table:
        database: LETTERONE_DB
        schema: PUBLIC
        table: ENFUSION_PNL
      primary_key:
        columns: [REPORT_DATE, ENTITY, STRATEGY, BOOK]
      dimensions:
        - name: ENTITY
          expr: ENTITY
          description: LetterOne entity
          data_type: VARCHAR
        - name: STRATEGY
          expr: STRATEGY
          description: Investment strategy
          data_type: VARCHAR
        - name: BOOK
          expr: BOOK
          description: Trading book
          data_type: VARCHAR
        - name: REPORT_DATE
          expr: REPORT_DATE
          description: P&L report date
          data_type: DATE
      facts:
        - name: TOTAL_PNL_USD
          expr: TOTAL_PNL_USD
          description: Total P&L in USD
          data_type: NUMBER
        - name: REALISED_PNL_USD
          expr: REALISED_PNL_USD
          description: Realised P&L in USD
          data_type: NUMBER
        - name: UNREALISED_PNL_USD
          expr: UNREALISED_PNL_USD
          description: Unrealised P&L in USD
          data_type: NUMBER
        - name: FX_PNL_USD
          expr: FX_PNL_USD
          description: FX-related P&L in USD
          data_type: NUMBER
        - name: INTEREST_PNL_USD
          expr: INTEREST_PNL_USD
          description: Interest income P&L in USD
          data_type: NUMBER

  verified_queries:
    - name: Total cash by bank counterparty and currency
      question: What is our total cash by bank counterparty and currency?
      sql: |
        SELECT BANK_NAME, CURRENCY, SUM(BALANCE_USD) AS TOTAL_BALANCE_USD, SUM(BALANCE_LOCAL) AS TOTAL_BALANCE_LOCAL
        FROM LETTERONE_DB.PUBLIC.CASH_IT
        GROUP BY BANK_NAME, CURRENCY
        ORDER BY TOTAL_BALANCE_USD DESC

    - name: USD-equivalent exposure by entity
      question: Show USD-equivalent exposure by entity
      sql: |
        SELECT ENTITY, SUM(MARKET_VALUE_USD) AS TOTAL_EXPOSURE_USD
        FROM LETTERONE_DB.PUBLIC.POSITIONS_IT
        GROUP BY ENTITY
        ORDER BY TOTAL_EXPOSURE_USD DESC

    - name: Unhedged non-USD exposure
      question: Show USD-equivalent exposure by entity and the unhedged non-USD amount
      sql: |
        SELECT
          p.ENTITY,
          SUM(p.MARKET_VALUE_USD) AS TOTAL_EXPOSURE_USD,
          SUM(CASE WHEN p.CURRENCY != 'USD' THEN p.MARKET_VALUE_USD ELSE 0 END) AS NON_USD_EXPOSURE,
          SUM(CASE WHEN p.INSTRUMENT_TYPE = 'FX Forward' THEN ABS(p.MARKET_VALUE_USD) ELSE 0 END) AS FX_HEDGE_USD,
          SUM(CASE WHEN p.CURRENCY != 'USD' THEN p.MARKET_VALUE_USD ELSE 0 END) -
          SUM(CASE WHEN p.INSTRUMENT_TYPE = 'FX Forward' THEN ABS(p.MARKET_VALUE_USD) ELSE 0 END) AS UNHEDGED_NON_USD
        FROM LETTERONE_DB.PUBLIC.POSITIONS_IT p
        GROUP BY p.ENTITY
        ORDER BY TOTAL_EXPOSURE_USD DESC

    - name: Banking counterparties over 20 percent
      question: Which banking counterparties hold more than 20% of our cash?
      sql: |
        WITH totals AS (
          SELECT SUM(BALANCE_USD) AS GRAND_TOTAL FROM LETTERONE_DB.PUBLIC.CASH_IT
        )
        SELECT c.BANK_NAME, SUM(c.BALANCE_USD) AS BANK_TOTAL_USD,
               SUM(c.BALANCE_USD) / t.GRAND_TOTAL * 100 AS PCT_OF_TOTAL
        FROM LETTERONE_DB.PUBLIC.CASH_IT c, totals t
        GROUP BY c.BANK_NAME, t.GRAND_TOTAL
        HAVING SUM(c.BALANCE_USD) / t.GRAND_TOTAL > 0.20
        ORDER BY BANK_TOTAL_USD DESC
  $$;

-- 2. SV_RISK
CREATE OR REPLACE SEMANTIC VIEW SV_RISK
  COMMENT = 'Risk view: hedge fund returns, benchmarks, portfolio exposure'
  AS $$
  name: Risk Analytics
  tables:
    - name: LETTERONE_DB.PUBLIC.HEDGE_FUNDS_IT
      base_table:
        database: LETTERONE_DB
        schema: PUBLIC
        table: HEDGE_FUNDS_IT
      primary_key:
        columns: [FUND_NAME, REPORT_MONTH]
      dimensions:
        - name: FUND_NAME
          expr: FUND_NAME
          description: Name of the hedge fund
          data_type: VARCHAR
        - name: FUND_STRATEGY
          expr: FUND_STRATEGY
          description: Strategy category (Multi-Strategy, Global Macro, Quantitative, etc.)
          data_type: VARCHAR
        - name: REPORT_MONTH
          expr: REPORT_MONTH
          description: Month of the return data
          data_type: DATE
      facts:
        - name: MONTHLY_RETURN_PCT
          expr: MONTHLY_RETURN_PCT
          description: Monthly return percentage
          data_type: NUMBER
        - name: AUM_USD
          expr: AUM_USD
          description: Assets under management in USD
          data_type: NUMBER
        - name: NAV_PER_SHARE
          expr: NAV_PER_SHARE
          description: Net asset value per share
          data_type: NUMBER
        - name: CORRELATION_EQUITY_3Y
          expr: CORRELATION_EQUITY_3Y
          description: 3-year rolling correlation to global equities
          data_type: NUMBER
        - name: CORRELATION_EQUITY_5Y
          expr: CORRELATION_EQUITY_5Y
          description: 5-year rolling correlation to global equities
          data_type: NUMBER

    - name: LETTERONE_DB.PUBLIC.MARKET_BENCHMARKS
      base_table:
        database: LETTERONE_DB
        schema: PUBLIC
        table: MARKET_BENCHMARKS
      primary_key:
        columns: [BENCHMARK_DATE, BENCHMARK_NAME]
      dimensions:
        - name: BENCHMARK_NAME
          expr: BENCHMARK_NAME
          description: Name of the benchmark (MSCI World, S&P 500, Brent Crude Oil, etc.)
          data_type: VARCHAR
        - name: BENCHMARK_DATE
          expr: BENCHMARK_DATE
          description: Date of the benchmark value
          data_type: DATE
      facts:
        - name: VALUE
          expr: VALUE
          description: Benchmark value or level
          data_type: NUMBER
        - name: DAILY_CHANGE_PCT
          expr: DAILY_CHANGE_PCT
          description: Daily percentage change
          data_type: NUMBER

  verified_queries:
    - name: Highest equity correlation funds
      question: Which hedge funds have the highest correlation to global equities over the last 12 months?
      sql: |
        SELECT FUND_NAME, FUND_STRATEGY, CORRELATION_EQUITY_3Y, CORRELATION_EQUITY_5Y,
               AVG(MONTHLY_RETURN_PCT) AS AVG_MONTHLY_RETURN
        FROM LETTERONE_DB.PUBLIC.HEDGE_FUNDS_IT
        WHERE REPORT_MONTH >= DATEADD('month', -12, CURRENT_DATE())
        GROUP BY FUND_NAME, FUND_STRATEGY, CORRELATION_EQUITY_3Y, CORRELATION_EQUITY_5Y
        ORDER BY CORRELATION_EQUITY_3Y DESC
        LIMIT 10
  $$;

-- 3. SV_STRUCTURED_CREDIT
CREATE OR REPLACE SEMANTIC VIEW SV_STRUCTURED_CREDIT
  COMMENT = 'Structured credit view: CLO/ABS portfolio with trustee metrics'
  AS $$
  name: Structured Credit
  tables:
    - name: LETTERONE_DB.PUBLIC.CLO_PORTFOLIO_IT
      base_table:
        database: LETTERONE_DB
        schema: PUBLIC
        table: CLO_PORTFOLIO_IT
      primary_key:
        columns: [TRANCHE_ID]
      dimensions:
        - name: DEAL_NAME
          expr: DEAL_NAME
          description: Name of the CLO or ABS deal
          data_type: VARCHAR
        - name: MANAGER
          expr: MANAGER
          description: CLO manager name
          data_type: VARCHAR
        - name: VINTAGE_YEAR
          expr: VINTAGE_YEAR
          description: Year the CLO was issued
          data_type: NUMBER
        - name: TRANCHE_RATING
          expr: TRANCHE_RATING
          description: Current credit rating (AAA, AA, A, BBB, BB, B)
          data_type: VARCHAR
        - name: ASSET_TYPE
          expr: ASSET_TYPE
          description: CLO or ABS
          data_type: VARCHAR
        - name: NON_CALL_DATE
          expr: NON_CALL_DATE
          description: Date after which the deal can be called
          data_type: DATE
        - name: MATURITY_DATE
          expr: MATURITY_DATE
          description: Final maturity date of the tranche
          data_type: DATE
      facts:
        - name: SPREAD_BPS
          expr: SPREAD_BPS
          description: Credit spread in basis points
          data_type: NUMBER
        - name: WAL_YEARS
          expr: WAL_YEARS
          description: Weighted average life in years
          data_type: NUMBER
        - name: NOTIONAL_USD
          expr: NOTIONAL_USD
          description: Face value notional in USD
          data_type: NUMBER
        - name: MARKET_VALUE_USD
          expr: MARKET_VALUE_USD
          description: Current market value in USD
          data_type: NUMBER

    - name: LETTERONE_DB.PUBLIC.TRUSTEE_METRICS
      base_table:
        database: LETTERONE_DB
        schema: PUBLIC
        table: TRUSTEE_METRICS
      primary_key:
        columns: [DEAL_NAME, REPORT_DATE]
      dimensions:
        - name: DEAL_NAME
          expr: DEAL_NAME
          description: Name of the CLO deal
          data_type: VARCHAR
        - name: REPORT_DATE
          expr: REPORT_DATE
          description: Date of the trustee report
          data_type: DATE
        - name: REPORT_MONTH
          expr: REPORT_MONTH
          description: Month string (YYYY-MM) of the report
          data_type: VARCHAR
      facts:
        - name: OC_TEST_CUSHION_PCT
          expr: OC_TEST_CUSHION_PCT
          description: Over-collateralisation test cushion percentage
          data_type: NUMBER
        - name: IC_TEST_CUSHION_PCT
          expr: IC_TEST_CUSHION_PCT
          description: Interest coverage test cushion percentage
          data_type: NUMBER
        - name: WARF
          expr: WARF
          description: Weighted average rating factor
          data_type: NUMBER
        - name: CCC_BUCKET_PCT
          expr: CCC_BUCKET_PCT
          description: Percentage of portfolio rated CCC or below
          data_type: NUMBER
        - name: DEFAULTED_PAR_PCT
          expr: DEFAULTED_PAR_PCT
          description: Percentage of portfolio in default
          data_type: NUMBER
        - name: DIVERSITY_SCORE
          expr: DIVERSITY_SCORE
          description: Moody's diversity score
          data_type: NUMBER

  verified_queries:
    - name: Exposure by CLO manager and rating
      question: What is our exposure by CLO manager and rating?
      sql: |
        SELECT MANAGER, TRANCHE_RATING, COUNT(*) AS TRANCHE_COUNT,
               SUM(NOTIONAL_USD) AS TOTAL_NOTIONAL, SUM(MARKET_VALUE_USD) AS TOTAL_MV
        FROM LETTERONE_DB.PUBLIC.CLO_PORTFOLIO_IT
        GROUP BY MANAGER, TRANCHE_RATING
        ORDER BY MANAGER, TRANCHE_RATING

    - name: CCC bucket increases
      question: Which deals saw the CCC bucket rise by more than one point versus the prior report?
      sql: |
        SELECT t1.DEAL_NAME, t1.REPORT_MONTH AS CURRENT_MONTH, t1.CCC_BUCKET_PCT AS CURRENT_CCC,
               t2.REPORT_MONTH AS PRIOR_MONTH, t2.CCC_BUCKET_PCT AS PRIOR_CCC,
               t1.CCC_BUCKET_PCT - t2.CCC_BUCKET_PCT AS CCC_CHANGE
        FROM LETTERONE_DB.PUBLIC.TRUSTEE_METRICS t1
        JOIN LETTERONE_DB.PUBLIC.TRUSTEE_METRICS t2
          ON t1.DEAL_NAME = t2.DEAL_NAME
          AND t2.REPORT_DATE = (
            SELECT MAX(REPORT_DATE) FROM LETTERONE_DB.PUBLIC.TRUSTEE_METRICS t3
            WHERE t3.DEAL_NAME = t1.DEAL_NAME AND t3.REPORT_DATE < t1.REPORT_DATE
          )
        WHERE t1.REPORT_DATE = (SELECT MAX(REPORT_DATE) FROM LETTERONE_DB.PUBLIC.TRUSTEE_METRICS)
          AND t1.CCC_BUCKET_PCT - t2.CCC_BUCKET_PCT > 1.0
        ORDER BY CCC_CHANGE DESC

    - name: Weighted average life contribution
      question: What is the weighted average life of the portfolio and which positions contribute most?
      sql: |
        SELECT DEAL_NAME, TRANCHE_RATING, WAL_YEARS, NOTIONAL_USD, MARKET_VALUE_USD,
               NOTIONAL_USD * WAL_YEARS AS WAL_CONTRIBUTION
        FROM LETTERONE_DB.PUBLIC.CLO_PORTFOLIO_IT
        ORDER BY WAL_CONTRIBUTION DESC
        LIMIT 10
  $$;

-- 4. SV_DIRECT_LENDING
CREATE OR REPLACE SEMANTIC VIEW SV_DIRECT_LENDING
  COMMENT = 'Direct lending view: deal library with performance tracking'
  AS $$
  name: Direct Lending
  tables:
    - name: LETTERONE_DB.PUBLIC.DEALS_IT
      base_table:
        database: LETTERONE_DB
        schema: PUBLIC
        table: DEALS_IT
      primary_key:
        columns: [DEAL_ID]
      dimensions:
        - name: DEAL_NAME
          expr: DEAL_NAME
          description: Name of the deal
          data_type: VARCHAR
        - name: SECTOR
          expr: SECTOR
          description: Sector (Student Housing, Pharma Royalties, Industrial, etc.)
          data_type: VARCHAR
        - name: REGION
          expr: REGION
          description: Geographic region
          data_type: VARCHAR
        - name: COUNTRY
          expr: COUNTRY
          description: Country of the deal
          data_type: VARCHAR
        - name: DEAL_STATUS
          expr: DEAL_STATUS
          description: Status of the deal (Live, Closed, Dead)
          data_type: VARCHAR
        - name: ASSET_TYPE
          expr: ASSET_TYPE
          description: Type of asset (Real Estate, Asset-Backed, Infrastructure)
          data_type: VARCHAR
        - name: DEAL_TYPE
          expr: DEAL_TYPE
          description: Type of debt (Senior Secured, Mezzanine, Whole Loan, etc.)
          data_type: VARCHAR
        - name: PASS_REASON
          expr: PASS_REASON
          description: Reason for passing on a dead deal
          data_type: VARCHAR
      facts:
        - name: PURCHASE_PRICE_USD
          expr: PURCHASE_PRICE_USD
          description: Purchase price in USD
          data_type: NUMBER
        - name: NOI_USD
          expr: NOI_USD
          description: Net operating income in USD
          data_type: NUMBER
        - name: TARGET_IRR_PCT
          expr: TARGET_IRR_PCT
          description: Target internal rate of return percentage
          data_type: NUMBER
        - name: LTV_PCT
          expr: LTV_PCT
          description: Loan-to-value ratio percentage
          data_type: NUMBER
        - name: UNDERWRITING_NOI_USD
          expr: UNDERWRITING_NOI_USD
          description: NOI assumed at underwriting
          data_type: NUMBER
        - name: CURRENT_NOI_USD
          expr: CURRENT_NOI_USD
          description: Most recent actual NOI
          data_type: NUMBER
        - name: COVENANT_HEADROOM_PCT
          expr: COVENANT_HEADROOM_PCT
          description: Percentage headroom above covenant threshold
          data_type: NUMBER

  verified_queries:
    - name: Deals below underwriting NOI
      question: Which closed deals are tracking more than 5% below underwriting-case NOI?
      sql: |
        SELECT DEAL_NAME, SECTOR, COUNTRY, UNDERWRITING_NOI_USD, CURRENT_NOI_USD,
               ROUND((1 - CURRENT_NOI_USD / NULLIF(UNDERWRITING_NOI_USD, 0)) * 100, 2) AS PCT_BELOW_UNDERWRITING,
               COVENANT_HEADROOM_PCT
        FROM LETTERONE_DB.PUBLIC.DEALS_IT
        WHERE DEAL_STATUS = 'Closed'
          AND CURRENT_NOI_USD < UNDERWRITING_NOI_USD * 0.95
        ORDER BY PCT_BELOW_UNDERWRITING DESC

    - name: Student housing deals reviewed
      question: Have we looked at student housing in Spain or Germany before?
      sql: |
        SELECT DEAL_NAME, COUNTRY, DEAL_STATUS, TARGET_IRR_PCT, LTV_PCT,
               RENTAL_GROWTH_PCT, PASS_REASON, REVIEW_DATE
        FROM LETTERONE_DB.PUBLIC.DEALS_IT
        WHERE SECTOR = 'Student Housing'
          AND COUNTRY IN ('Spain', 'Germany')
        ORDER BY REVIEW_DATE DESC
  $$;

-- 5. SV_INVESTOR_REPORTING
CREATE OR REPLACE SEMANTIC VIEW SV_INVESTOR_REPORTING
  COMMENT = 'Investor reporting view: capital accounts, NAV, performance metrics'
  AS $$
  name: Investor Reporting
  tables:
    - name: LETTERONE_DB.PUBLIC.CAPITAL_ACCOUNTS_IT
      base_table:
        database: LETTERONE_DB
        schema: PUBLIC
        table: CAPITAL_ACCOUNTS_IT
      primary_key:
        columns: [INVESTOR_ID, PERIOD_END_DATE]
      dimensions:
        - name: INVESTOR_ID
          expr: INVESTOR_ID
          description: Unique investor identifier
          data_type: VARCHAR
        - name: FUND_VEHICLE
          expr: FUND_VEHICLE
          description: Name of the fund vehicle
          data_type: VARCHAR
        - name: PERIOD_END_DATE
          expr: PERIOD_END_DATE
          description: End date of the reporting period (quarterly)
          data_type: DATE
      facts:
        - name: OPENING_NAV_USD
          expr: OPENING_NAV_USD
          description: Opening net asset value in USD
          data_type: NUMBER
        - name: CLOSING_NAV_USD
          expr: CLOSING_NAV_USD
          description: Closing net asset value in USD
          data_type: NUMBER
        - name: CONTRIBUTIONS_USD
          expr: CONTRIBUTIONS_USD
          description: Capital contributions during the period in USD
          data_type: NUMBER
        - name: DISTRIBUTIONS_USD
          expr: DISTRIBUTIONS_USD
          description: Distributions during the period in USD
          data_type: NUMBER
        - name: MANAGEMENT_FEE_USD
          expr: MANAGEMENT_FEE_USD
          description: Management fees charged in USD
          data_type: NUMBER
        - name: PERFORMANCE_FEE_USD
          expr: PERFORMANCE_FEE_USD
          description: Performance fees charged in USD
          data_type: NUMBER
        - name: TVPI
          expr: TVPI
          description: Total value to paid-in multiple
          data_type: NUMBER
        - name: DPI
          expr: DPI
          description: Distributions to paid-in multiple
          data_type: NUMBER
        - name: NET_IRR_PCT
          expr: NET_IRR_PCT
          description: Net internal rate of return percentage
          data_type: NUMBER

    - name: LETTERONE_DB.PUBLIC.INVESTORS
      base_table:
        database: LETTERONE_DB
        schema: PUBLIC
        table: INVESTORS
      primary_key:
        columns: [INVESTOR_ID]
      dimensions:
        - name: INVESTOR_NAME
          expr: INVESTOR_NAME
          description: Name of the investor (LP)
          data_type: VARCHAR
        - name: INVESTOR_TYPE
          expr: INVESTOR_TYPE
          description: Type of investor (Sovereign Wealth Fund, Pension Fund, Insurance Company)
          data_type: VARCHAR
        - name: DOMICILE
          expr: DOMICILE
          description: Country of domicile
          data_type: VARCHAR
        - name: FUND_VEHICLE
          expr: FUND_VEHICLE
          description: Fund vehicle the investor is committed to
          data_type: VARCHAR
        - name: STATUS
          expr: STATUS
          description: Active or Inactive
          data_type: VARCHAR
      facts:
        - name: COMMITTED_CAPITAL_USD
          expr: COMMITTED_CAPITAL_USD
          description: Total committed capital in USD
          data_type: NUMBER

  relationships:
    - name: investor_capital_accounts
      left_table: LETTERONE_DB.PUBLIC.INVESTORS
      right_table: LETTERONE_DB.PUBLIC.CAPITAL_ACCOUNTS_IT
      join_type: inner
      relationship_columns:
        - left_column: INVESTOR_ID
          right_column: INVESTOR_ID
  $$;

-- ============================================================================
-- CORTEX AGENTS
-- ============================================================================

-- 1. Treasury Ops Agent
CREATE OR REPLACE AGENT TREASURY_OPS_AGENT
  COMMENT = 'Treasury Operations assistant for LetterOne COO team'
  FROM SPECIFICATION $$
models:
  orchestration: claude-sonnet-4-6
orchestration:
  budget:
    seconds: 120
    tokens: 100000
instructions:
  response: "You are the Treasury Operations assistant for LetterOne. You help the COO team with daily operations: cash positions, reconciliation status, P&L reporting, and position monitoring. Always cite specific numbers and show the data behind your answers. When asked about USD-equivalent exposure, use the MARKET_VALUE_USD field from positions. When asked about cash, use BALANCE_USD from cash accounts. Be precise with figures and always specify the date of the data."
tools:
  - tool_spec:
      type: cortex_analyst_text_to_sql
      name: query_treasury_data
      description: Query treasury positions, cash balances, and PnL data for LetterOne
tool_resources:
  query_treasury_data:
    semantic_view: LETTERONE_DB.PUBLIC.SV_TREASURY
    execution_environment:
      type: warehouse
      warehouse: L1_WH
$$;

-- 2. Risk Agent
CREATE OR REPLACE AGENT RISK_AGENT
  COMMENT = 'Risk analytics assistant for LetterOne CRO team'
  FROM SPECIFICATION $$
models:
  orchestration: claude-sonnet-4-6
orchestration:
  budget:
    seconds: 120
    tokens: 100000
instructions:
  response: "You are the Risk analytics assistant for LetterOne. You help Jason Lai and Sam Drury with portfolio risk analysis, hedge fund monitoring, benchmark comparisons, and exposure analysis. You have access to both risk-specific data (hedge funds, benchmarks) and treasury data (positions, cash, PnL). When asked about USD-equivalent exposure by entity, query the positions table and sum MARKET_VALUE_USD grouped by ENTITY. This must return the same answer as the Treasury Ops agent. Always explain the methodology behind any calculation."
tools:
  - tool_spec:
      type: cortex_analyst_text_to_sql
      name: query_risk_data
      description: Query risk analytics including hedge fund returns and market benchmarks
  - tool_spec:
      type: cortex_analyst_text_to_sql
      name: query_treasury_data
      description: Query treasury positions, cash balances, and PnL data for LetterOne
tool_resources:
  query_risk_data:
    semantic_view: LETTERONE_DB.PUBLIC.SV_RISK
    execution_environment:
      type: warehouse
      warehouse: L1_WH
  query_treasury_data:
    semantic_view: LETTERONE_DB.PUBLIC.SV_TREASURY
    execution_environment:
      type: warehouse
      warehouse: L1_WH
$$;

-- 3. Structured Credit Agent
CREATE OR REPLACE AGENT STRUCTURED_CREDIT_AGENT
  COMMENT = 'Structured credit assistant for LetterOne trading desk'
  FROM SPECIFICATION $$
models:
  orchestration: claude-sonnet-4-6
orchestration:
  budget:
    seconds: 120
    tokens: 100000
instructions:
  response: "You are the Structured Credit assistant for LetterOne trading desk. You help Amy Abob and Matei Moprea monitor the CLO/ABS portfolio of approximately 145 tranches. You can query portfolio data (exposure by manager, rating, vintage, spread, WAL) and trustee report metrics (OC/IC test cushions, WARF, CCC bucket, defaults, diversity). You can also search CLO documents for clause comparisons. Always provide the same answer regardless of who asks - consistency is critical. When comparing documents, include page references where available."
tools:
  - tool_spec:
      type: cortex_analyst_text_to_sql
      name: query_credit_data
      description: Query structured credit CLO/ABS portfolio data and trustee metrics
  - tool_spec:
      type: cortex_search
      name: search_clo_docs
      description: Search CLO documents for clause comparisons and deal terms
tool_resources:
  query_credit_data:
    semantic_view: LETTERONE_DB.PUBLIC.SV_STRUCTURED_CREDIT
    execution_environment:
      type: warehouse
      warehouse: L1_WH
  search_clo_docs:
    search_service: LETTERONE_DB.PUBLIC.CLO_DOCUMENT_SEARCH
$$;

-- 4. Direct Lending Agent
CREATE OR REPLACE AGENT DIRECT_LENDING_AGENT
  COMMENT = 'Direct lending assistant for LetterOne investment team'
  FROM SPECIFICATION $$
models:
  orchestration: claude-sonnet-4-6
orchestration:
  budget:
    seconds: 120
    tokens: 100000
instructions:
  response: "You are the Direct Lending assistant for LetterOne. You help Daniele Gualdani and the investment team review deals, check counterparty data, search the deal library, and monitor closed investments. You have access to the deal library (live, dead, and closed deals across real estate, asset-backed finance, and infrastructure) and a document search service over deal files. When searching past deals, include the reason for passing where available. When monitoring closed deals, compare current NOI against the underwriting case. Deal data is confidential and only visible to the Direct Lending role."
tools:
  - tool_spec:
      type: cortex_analyst_text_to_sql
      name: query_deals
      description: Query deal library including live, dead, and closed transactions
  - tool_spec:
      type: cortex_search
      name: search_deals
      description: Search deal documents for institutional memory across transactions
tool_resources:
  query_deals:
    semantic_view: LETTERONE_DB.PUBLIC.SV_DIRECT_LENDING
    execution_environment:
      type: warehouse
      warehouse: L1_WH
  search_deals:
    search_service: LETTERONE_DB.PUBLIC.DEAL_DOCUMENT_SEARCH
$$;

-- Grant agent usage
GRANT USAGE ON AGENT TREASURY_OPS_AGENT TO ROLE TREASURY_OPS;
GRANT USAGE ON AGENT RISK_AGENT TO ROLE RISK;
GRANT USAGE ON AGENT STRUCTURED_CREDIT_AGENT TO ROLE TRADING_SC;
GRANT USAGE ON AGENT DIRECT_LENDING_AGENT TO ROLE DIRECT_LENDING;

-- Grant semantic view usage
GRANT SELECT ON SEMANTIC VIEW SV_TREASURY TO ROLE TREASURY_OPS;
GRANT SELECT ON SEMANTIC VIEW SV_TREASURY TO ROLE RISK;
GRANT SELECT ON SEMANTIC VIEW SV_RISK TO ROLE RISK;
GRANT SELECT ON SEMANTIC VIEW SV_STRUCTURED_CREDIT TO ROLE TRADING_SC;
GRANT SELECT ON SEMANTIC VIEW SV_DIRECT_LENDING TO ROLE DIRECT_LENDING;
GRANT SELECT ON SEMANTIC VIEW SV_INVESTOR_REPORTING TO ROLE TREASURY_OPS;
GRANT SELECT ON SEMANTIC VIEW SV_INVESTOR_REPORTING TO ROLE EXEC_READONLY;

-- Grant Cortex Search usage
GRANT USAGE ON CORTEX SEARCH SERVICE DEAL_DOCUMENT_SEARCH TO ROLE DIRECT_LENDING;
GRANT USAGE ON CORTEX SEARCH SERVICE CLO_DOCUMENT_SEARCH TO ROLE TRADING_SC;
