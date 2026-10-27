-- ============================================================================
-- LetterOne Treasury Platform — Group CFO Data, Semantic View & Agent
-- Version: 1.0 | Date: 2026-10-27
-- Persona: Jonathan Tubb, Group Chief Financial Officer / Chief of Staff
-- Creates: 3 tables (synthetic, illustrative values), SV_CFO, CFO_AGENT
-- Run after 05_cortex_services.sql
-- ============================================================================

USE ROLE ACCOUNTADMIN;
USE DATABASE LETTERONE_DB;
USE SCHEMA PUBLIC;
USE WAREHOUSE L1_WH;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Quarterly valuation of group holdings (portfolio businesses + liquid book)
CREATE OR REPLACE TABLE GROUP_HOLDINGS_VALUATION (
    VALUATION_DATE      DATE NOT NULL,
    HOLDING_NAME        VARCHAR(100) NOT NULL,
    BUSINESS_UNIT       VARCHAR(50),
    SECTOR              VARCHAR(50),
    OWNERSHIP_PCT       NUMBER(5,2),
    VALUATION_METHOD    VARCHAR(50),
    FAIR_VALUE_USD      NUMBER(18,2),
    COST_BASIS_USD      NUMBER(18,2),
    NET_DEBT_USD        NUMBER(18,2),
    REVENUE_LTM_USD     NUMBER(18,2),
    EBITDA_LTM_USD      NUMBER(18,2),
    DIVIDENDS_RECEIVED_USD NUMBER(18,2)
);

-- 13-week rolling group liquidity forecast
CREATE OR REPLACE TABLE GROUP_LIQUIDITY_FORECAST (
    FORECAST_DATE       DATE NOT NULL,
    WEEK_NUMBER         NUMBER(2) NOT NULL,
    WEEK_START_DATE     DATE NOT NULL,
    ENTITY              VARCHAR(100) NOT NULL,
    OPENING_CASH_USD    NUMBER(18,2),
    INFLOWS_USD         NUMBER(18,2),
    OUTFLOWS_USD        NUMBER(18,2),
    CLOSING_CASH_USD    NUMBER(18,2),
    UNDRAWN_RCF_USD     NUMBER(18,2),
    MIN_LIQUIDITY_POLICY_USD NUMBER(18,2)
);

-- Monthly head-office operating expenses: budget vs actual
CREATE OR REPLACE TABLE GROUP_OPEX_BUDGET (
    PERIOD_MONTH        DATE NOT NULL,
    COST_CENTRE         VARCHAR(50) NOT NULL,
    CATEGORY            VARCHAR(50) NOT NULL,
    BUDGET_USD          NUMBER(18,2),
    ACTUAL_USD          NUMBER(18,2),
    FORECAST_FY_USD     NUMBER(18,2)
);

-- ============================================================================
-- SYNTHETIC DATA (illustrative only — not real LetterOne figures)
-- ============================================================================

-- 8 quarters x 7 holdings
INSERT INTO GROUP_HOLDINGS_VALUATION
WITH q AS (
    SELECT LAST_DAY(DATEADD('quarter', -seq4(), DATE_TRUNC('quarter', CURRENT_DATE()) - 1), 'quarter') AS VALUATION_DATE,
           seq4() AS QIDX
    FROM TABLE(GENERATOR(ROWCOUNT => 8))
),
h AS (
    SELECT * FROM VALUES
    ('Holland & Barrett', 'L1 Retail',      'Consumer Retail', 100.00, 'EV/EBITDA multiple', 3200, 2500, 1100, 1750, 240,  0),
    ('VEON',              'L1 Technology',  'Telecoms',         47.90, 'Listed market price', 1450, 2900,    0,    0,   0, 25),
    ('L1 Energy Portfolio','L1 Energy',     'Energy Transition',100.00, 'DCF',                 1900, 1600,  150,  420, 110,  0),
    ('L1 Health Portfolio','L1 Health',     'Healthcare',      100.00, 'Recent transaction',   650,  700,   20,   85, -15,  0),
    ('Treasury Liquid Portfolio','L1 Treasury','Liquid Assets', 100.00, 'Mark to market',      5200, 5000,    0,    0,   0, 30),
    ('Structured Credit Book','L1 Treasury','Structured Credit',100.00, 'Mark to market',      1350, 1300,    0,    0,   0, 22),
    ('Direct Lending Book','L1 Treasury',   'Private Credit',  100.00, 'Amortised cost',       980,  950,    0,    0,   0, 18)
    AS t(HOLDING_NAME, BUSINESS_UNIT, SECTOR, OWNERSHIP_PCT, VALUATION_METHOD, FV, COST, NETDEBT, REV, EBITDA, DIVS)
)
SELECT
    q.VALUATION_DATE, h.HOLDING_NAME, h.BUSINESS_UNIT, h.SECTOR, h.OWNERSHIP_PCT, h.VALUATION_METHOD,
    ROUND(h.FV * 1e6 * (1 - q.QIDX * 0.012 + UNIFORM(-0.03, 0.03, RANDOM())), 2),
    h.COST * 1e6,
    ROUND(h.NETDEBT * 1e6 * (1 + q.QIDX * 0.01), 2),
    ROUND(h.REV * 1e6 * (1 - q.QIDX * 0.008), 2),
    ROUND(h.EBITDA * 1e6 * (1 - q.QIDX * 0.01), 2),
    ROUND(h.DIVS * 1e6 * UNIFORM(0.7, 1.2, RANDOM()), 2)
FROM q CROSS JOIN h;

-- 13 weeks x 4 entities, current forecast
INSERT INTO GROUP_LIQUIDITY_FORECAST
WITH w AS (
    SELECT seq4() + 1 AS WEEK_NUMBER,
           DATEADD('week', seq4(), DATE_TRUNC('week', CURRENT_DATE())) AS WEEK_START_DATE
    FROM TABLE(GENERATOR(ROWCOUNT => 13))
),
e AS (
    SELECT * FROM VALUES
    ('LetterOne Holdings SA',          1800, 120, 140, 500, 750),
    ('LetterOne Investment Holdings SA',1200,  90, 110, 300, 400),
    ('L1 Treasury Services Ltd',         650,  60,  70,   0, 150),
    ('L1 Energy Holdings',               320,  25,  32, 100,  80)
    AS t(ENTITY, OPEN_M, IN_M, OUT_M, RCF_M, MIN_M)
),
flows AS (
    SELECT CURRENT_DATE() AS FORECAST_DATE, w.WEEK_NUMBER, w.WEEK_START_DATE, e.ENTITY,
           e.OPEN_M * 1e6 AS BASE_OPEN,
           ROUND(e.IN_M  * 1e6 * UNIFORM(0.6, 1.4, RANDOM()), 2) AS INFLOWS_USD,
           ROUND(e.OUT_M * 1e6 * UNIFORM(0.6, 1.4, RANDOM()), 2) AS OUTFLOWS_USD,
           e.RCF_M * 1e6 AS UNDRAWN_RCF_USD, e.MIN_M * 1e6 AS MIN_LIQUIDITY_POLICY_USD
    FROM w CROSS JOIN e
),
running AS (
    SELECT *, BASE_OPEN + SUM(INFLOWS_USD - OUTFLOWS_USD) OVER (PARTITION BY ENTITY ORDER BY WEEK_NUMBER) AS CLOSING_CASH_USD
    FROM flows
)
SELECT FORECAST_DATE, WEEK_NUMBER, WEEK_START_DATE, ENTITY,
       CLOSING_CASH_USD - (INFLOWS_USD - OUTFLOWS_USD) AS OPENING_CASH_USD,
       INFLOWS_USD, OUTFLOWS_USD, CLOSING_CASH_USD, UNDRAWN_RCF_USD, MIN_LIQUIDITY_POLICY_USD
FROM running;

-- 12 months x 6 cost centres x 3 categories
INSERT INTO GROUP_OPEX_BUDGET
WITH m AS (
    SELECT DATEADD('month', -seq4(), DATE_TRUNC('month', CURRENT_DATE())) AS PERIOD_MONTH
    FROM TABLE(GENERATOR(ROWCOUNT => 12))
),
c AS (
    SELECT * FROM VALUES
    ('Finance', 1.10), ('Legal', 0.90), ('Investment', 1.60),
    ('Technology', 1.30), ('Corporate Affairs', 0.50), ('Office of the CEO', 0.70)
    AS t(COST_CENTRE, SCALE)
),
k AS (
    SELECT * FROM VALUES ('People', 0.60), ('Advisory & Professional Fees', 0.25), ('Systems & Data', 0.15)
    AS t(CATEGORY, SHARE)
)
SELECT m.PERIOD_MONTH, c.COST_CENTRE, k.CATEGORY,
       ROUND(c.SCALE * k.SHARE * 1e6, 2) AS BUDGET_USD,
       ROUND(c.SCALE * k.SHARE * 1e6 * UNIFORM(0.80, 1.25, RANDOM()), 2) AS ACTUAL_USD,
       ROUND(c.SCALE * k.SHARE * 1e6 * 12 * UNIFORM(0.95, 1.10, RANDOM()), 2) AS FORECAST_FY_USD
FROM m CROSS JOIN c CROSS JOIN k;

-- ============================================================================
-- SEMANTIC VIEW: SV_CFO
-- ============================================================================
CALL SYSTEM$CREATE_SEMANTIC_VIEW_FROM_YAML('LETTERONE_DB.PUBLIC', $$
name: SV_CFO
description: Group CFO view for LetterOne - holdings valuation and NAV, 13-week liquidity forecast, and head-office opex budget vs actual.
tables:
  - name: HOLDINGS
    description: Quarterly fair value of each LetterOne holding (portfolio businesses and treasury books)
    base_table: {database: LETTERONE_DB, schema: PUBLIC, table: GROUP_HOLDINGS_VALUATION}
    dimensions:
      - {name: HOLDING_NAME, expr: HOLDING_NAME, data_type: VARCHAR, description: Name of the holding or portfolio}
      - {name: BUSINESS_UNIT, expr: BUSINESS_UNIT, data_type: VARCHAR, description: "LetterOne business unit (L1 Retail, L1 Technology, L1 Energy, L1 Health, L1 Treasury)"}
      - {name: SECTOR, expr: SECTOR, data_type: VARCHAR, description: Sector of the holding}
      - {name: VALUATION_METHOD, expr: VALUATION_METHOD, data_type: VARCHAR, description: Method used to determine fair value}
    time_dimensions:
      - {name: VALUATION_DATE, expr: VALUATION_DATE, data_type: DATE, description: Quarter-end valuation date. Use the latest date for current NAV.}
    facts:
      - {name: FAIR_VALUE_USD, expr: FAIR_VALUE_USD, data_type: NUMBER, description: Fair value of the LetterOne stake in USD}
      - {name: COST_BASIS_USD, expr: COST_BASIS_USD, data_type: NUMBER, description: Invested cost in USD}
      - {name: NET_DEBT_USD, expr: NET_DEBT_USD, data_type: NUMBER, description: Net debt of the underlying business in USD}
      - {name: REVENUE_LTM_USD, expr: REVENUE_LTM_USD, data_type: NUMBER, description: Last twelve months revenue in USD}
      - {name: EBITDA_LTM_USD, expr: EBITDA_LTM_USD, data_type: NUMBER, description: Last twelve months EBITDA in USD}
      - {name: DIVIDENDS_RECEIVED_USD, expr: DIVIDENDS_RECEIVED_USD, data_type: NUMBER, description: Dividends or income received by LetterOne in the quarter in USD}
      - {name: OWNERSHIP_PCT, expr: OWNERSHIP_PCT, data_type: NUMBER, description: LetterOne ownership percentage}
    metrics:
      - {name: TOTAL_NAV_USD, expr: SUM(FAIR_VALUE_USD), description: Group net asset value - sum of fair value across holdings for a valuation date}
      - {name: UNREALISED_GAIN_USD, expr: SUM(FAIR_VALUE_USD) - SUM(COST_BASIS_USD), description: Fair value minus cost}
      - {name: MOIC, expr: "SUM(FAIR_VALUE_USD) / NULLIF(SUM(COST_BASIS_USD), 0)", description: Multiple on invested capital}
      - {name: TOTAL_DIVIDENDS_USD, expr: SUM(DIVIDENDS_RECEIVED_USD), description: Total dividends and income received}
  - name: LIQUIDITY
    description: Current 13-week rolling liquidity forecast by legal entity
    base_table: {database: LETTERONE_DB, schema: PUBLIC, table: GROUP_LIQUIDITY_FORECAST}
    dimensions:
      - {name: ENTITY, expr: ENTITY, data_type: VARCHAR, description: Legal entity}
      - {name: WEEK_NUMBER, expr: WEEK_NUMBER, data_type: NUMBER, description: Forecast week 1-13}
    time_dimensions:
      - {name: WEEK_START_DATE, expr: WEEK_START_DATE, data_type: DATE, description: Start date of forecast week}
      - {name: FORECAST_DATE, expr: FORECAST_DATE, data_type: DATE, description: Date the forecast was produced}
    facts:
      - {name: OPENING_CASH_USD, expr: OPENING_CASH_USD, data_type: NUMBER, description: Opening cash for the week}
      - {name: INFLOWS_USD, expr: INFLOWS_USD, data_type: NUMBER, description: Forecast cash inflows}
      - {name: OUTFLOWS_USD, expr: OUTFLOWS_USD, data_type: NUMBER, description: Forecast cash outflows}
      - {name: CLOSING_CASH_USD, expr: CLOSING_CASH_USD, data_type: NUMBER, description: Forecast closing cash}
      - {name: UNDRAWN_RCF_USD, expr: UNDRAWN_RCF_USD, data_type: NUMBER, description: Undrawn revolving credit facility headroom}
      - {name: MIN_LIQUIDITY_POLICY_USD, expr: MIN_LIQUIDITY_POLICY_USD, data_type: NUMBER, description: Minimum liquidity required by treasury policy}
    metrics:
      - {name: TOTAL_LIQUIDITY_USD, expr: SUM(CLOSING_CASH_USD + UNDRAWN_RCF_USD), description: Closing cash plus undrawn RCF}
      - {name: LIQUIDITY_HEADROOM_USD, expr: SUM(CLOSING_CASH_USD + UNDRAWN_RCF_USD - MIN_LIQUIDITY_POLICY_USD), description: Liquidity above policy minimum; negative means breach}
  - name: OPEX
    description: Monthly head-office operating expenses, budget vs actual, by cost centre
    base_table: {database: LETTERONE_DB, schema: PUBLIC, table: GROUP_OPEX_BUDGET}
    dimensions:
      - {name: COST_CENTRE, expr: COST_CENTRE, data_type: VARCHAR, description: Head-office cost centre}
      - {name: CATEGORY, expr: CATEGORY, data_type: VARCHAR, description: Cost category}
    time_dimensions:
      - {name: PERIOD_MONTH, expr: PERIOD_MONTH, data_type: DATE, description: First day of the month}
    facts:
      - {name: BUDGET_USD, expr: BUDGET_USD, data_type: NUMBER, description: Budgeted spend}
      - {name: ACTUAL_USD, expr: ACTUAL_USD, data_type: NUMBER, description: Actual spend}
      - {name: FORECAST_FY_USD, expr: FORECAST_FY_USD, data_type: NUMBER, description: Full-year forecast spend}
    metrics:
      - {name: VARIANCE_USD, expr: SUM(ACTUAL_USD) - SUM(BUDGET_USD), description: Actual minus budget; positive means overspend}
      - {name: VARIANCE_PCT, expr: "(SUM(ACTUAL_USD) - SUM(BUDGET_USD)) / NULLIF(SUM(BUDGET_USD), 0) * 100", description: Variance as percent of budget}
verified_queries:
  - name: current_nav_by_business_unit
    question: What is our current group NAV by business unit?
    sql: "SELECT BUSINESS_UNIT, SUM(FAIR_VALUE_USD) AS NAV_USD FROM LETTERONE_DB.PUBLIC.GROUP_HOLDINGS_VALUATION WHERE VALUATION_DATE = (SELECT MAX(VALUATION_DATE) FROM LETTERONE_DB.PUBLIC.GROUP_HOLDINGS_VALUATION) GROUP BY BUSINESS_UNIT ORDER BY NAV_USD DESC"
$$);

-- ============================================================================
-- CFO AGENT
-- ============================================================================
CREATE OR REPLACE AGENT CFO_AGENT
  COMMENT = 'Group CFO assistant for Jonathan Tubb (Group CFO / Chief of Staff)'
  FROM SPECIFICATION $$
models:
  orchestration: claude-sonnet-4-6
orchestration:
  budget:
    seconds: 120
    tokens: 100000
instructions:
  response: "You are the Group CFO assistant for LetterOne, supporting Jonathan Tubb, Group Chief Financial Officer and Chief of Staff. Give board-ready answers: lead with the headline number, then the breakdown, then any risk or action. Use query_cfo_data for group NAV and holdings valuation, the 13-week liquidity forecast, and head-office opex budget vs actual. Use query_treasury_data for cash, positions, PnL and USD-equivalent exposure by entity (sum MARKET_VALUE_USD grouped by ENTITY - this must match the Treasury Ops and Risk agents). For current NAV always use the latest VALUATION_DATE. Flag any entity where forecast liquidity falls below the policy minimum. State the as-of date for every figure. All values are in USD."
tools:
  - tool_spec:
      type: cortex_analyst_text_to_sql
      name: query_cfo_data
      description: Group NAV and holdings valuation, 13-week liquidity forecast, and opex budget vs actual
  - tool_spec:
      type: cortex_analyst_text_to_sql
      name: query_treasury_data
      description: Query treasury positions, cash balances, and PnL data for LetterOne
tool_resources:
  query_cfo_data:
    semantic_view: LETTERONE_DB.PUBLIC.SV_CFO
    execution_environment:
      type: warehouse
      warehouse: L1_WH
  query_treasury_data:
    semantic_view: LETTERONE_DB.PUBLIC.SV_TREASURY
    execution_environment:
      type: warehouse
      warehouse: L1_WH
$$;

GRANT USAGE ON AGENT CFO_AGENT TO ROLE EXEC_READONLY;
GRANT SELECT ON SEMANTIC VIEW SV_CFO TO ROLE EXEC_READONLY;
GRANT SELECT ON SEMANTIC VIEW SV_TREASURY TO ROLE EXEC_READONLY;
GRANT SELECT ON TABLE GROUP_HOLDINGS_VALUATION TO ROLE EXEC_READONLY;
GRANT SELECT ON TABLE GROUP_LIQUIDITY_FORECAST TO ROLE EXEC_READONLY;
GRANT SELECT ON TABLE GROUP_OPEX_BUDGET TO ROLE EXEC_READONLY;
