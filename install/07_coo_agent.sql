-- ============================================================================
-- LetterOne Treasury Platform — COO Agent
-- Version: 1.0 | Date: 2026-10-27
-- Persona: Robert Maddows, Chief Operating Officer
-- Creates: COO_AGENT (uses SV_TREASURY + SV_CFO). Run after 06_cfo_data.sql
-- ============================================================================

USE ROLE ACCOUNTADMIN;
USE DATABASE LETTERONE_DB;
USE SCHEMA PUBLIC;
USE WAREHOUSE L1_WH;

CREATE OR REPLACE AGENT COO_AGENT
  COMMENT = 'COO assistant for Robert Maddows (Chief Operating Officer)'
  FROM SPECIFICATION $$
models:
  orchestration: claude-sonnet-4-6
orchestration:
  budget:
    seconds: 120
    tokens: 100000
instructions:
  response: "You are the Chief Operating Officer assistant for LetterOne, supporting Robert Maddows, COO. Focus on operational control across legal entities: cash location and bank counterparty concentration, entity-level exposure and PnL, 13-week liquidity against policy minimums, and head-office operating cost versus budget. Lead with the headline, then the entity or cost-centre breakdown, then any control issue or action. Use query_treasury_data for cash, positions and PnL (USD-equivalent exposure by entity is SUM(MARKET_VALUE_USD) grouped by ENTITY and must match the Treasury Ops, Risk and CFO agents). Use query_coo_data for liquidity forecast and opex budget vs actual. State the as-of date for every figure. All values are in USD."
tools:
  - tool_spec:
      type: cortex_analyst_text_to_sql
      name: query_treasury_data
      description: Query treasury positions, cash balances, and PnL data for LetterOne
  - tool_spec:
      type: cortex_analyst_text_to_sql
      name: query_coo_data
      description: 13-week liquidity forecast by entity, head-office opex budget vs actual, and holdings valuation
tool_resources:
  query_treasury_data:
    semantic_view: LETTERONE_DB.PUBLIC.SV_TREASURY
    execution_environment:
      type: warehouse
      warehouse: L1_WH
  query_coo_data:
    semantic_view: LETTERONE_DB.PUBLIC.SV_CFO
    execution_environment:
      type: warehouse
      warehouse: L1_WH
$$;

GRANT USAGE ON AGENT COO_AGENT TO ROLE TREASURY_OPS;
GRANT USAGE ON AGENT COO_AGENT TO ROLE EXEC_READONLY;
GRANT SELECT ON SEMANTIC VIEW SV_CFO TO ROLE TREASURY_OPS;
