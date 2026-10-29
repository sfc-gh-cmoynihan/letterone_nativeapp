-- ============================================================================
-- LetterOne Treasury Platform — Load Real Files from Stages
-- Version: 1.0 | Date: 2026-10-29
-- Run after 04_load_data.sql. Requires files already uploaded to:
--   @PUBLIC.L1_DOCUMENT_STAGE/letterone_website/*.pdf   (4 LetterOne PDFs)
--   @TREASURY.L1_CALLS/mp4/*.mp4 and /transcripts/*.txt (11 CFO calls)
-- Uses AI_PARSE_DOCUMENT and AI_COMPLETE for text, summaries and sentiment.
-- ============================================================================

USE ROLE ACCOUNTADMIN;
USE DATABASE LETTERONE_DB;
USE SCHEMA PUBLIC;
USE WAREHOUSE L1_WH;

-- Whole-file text reader for transcripts
CREATE FILE FORMAT IF NOT EXISTS L1_TXT_FMT
  TYPE = CSV FIELD_DELIMITER = NONE RECORD_DELIMITER = NONE FIELD_OPTIONALLY_ENCLOSED_BY = NONE;

-- ============================================================================
-- COMPANY DOCUMENTS — LetterOne website PDFs
-- ============================================================================

CREATE OR REPLACE TABLE L1_WEBSITE_DOCS_PARSED AS
SELECT RELATIVE_PATH,
  AI_PARSE_DOCUMENT(TO_FILE('@LETTERONE_DB.PUBLIC.L1_DOCUMENT_STAGE', RELATIVE_PATH), {'mode':'OCR','page_split':TRUE}) AS PARSED
FROM DIRECTORY(@LETTERONE_DB.PUBLIC.L1_DOCUMENT_STAGE)
WHERE RELATIVE_PATH ILIKE 'letterone_website/%.pdf';

DELETE FROM COMPANY_DOCUMENTS WHERE DOC_ID IN ('DOC-019','DOC-020','DOC-021','DOC-022');

INSERT INTO COMPANY_DOCUMENTS
  (DOC_ID, COMPANY, DOC_TYPE, DOC_TITLE, DOC_DATE, AUTHOR, FILE_PATH, PARSED_TEXT, SUMMARY, SENTIMENT, KEYWORDS, SOURCE_URL)
WITH src AS (
  SELECT d.RELATIVE_PATH,
         LISTAGG(p.value:content::STRING, '\n\n') WITHIN GROUP (ORDER BY p.value:index::INT) AS TXT
  FROM L1_WEBSITE_DOCS_PARSED d, LATERAL FLATTEN(d.PARSED:pages) p
  GROUP BY d.RELATIVE_PATH
), meta AS (
  SELECT * FROM VALUES
    ('letterone_website/L1-Annual-Review-2024-FINAL-interactive.pdf', 'DOC-019', 'Annual Report', 'LetterOne Annual Review 2024', '2025-04-30'::DATE),
    ('letterone_website/L1-Annual-Review-2025-FINAL-interactive.pdf', 'DOC-020', 'Annual Report', 'LetterOne Annual Review 2025', '2026-04-30'::DATE),
    ('letterone_website/L1-Impact-Report-2025-FINAL.pdf',             'DOC-021', 'ESG Report',    'LetterOne Impact Report 2025', '2025-06-30'::DATE),
    ('letterone_website/2025-LetterOne-IMPACT-Report.pdf',            'DOC-022', 'ESG Report',    'LetterOne IMPACT Report 2025 (Summary Edition)', '2025-06-30'::DATE)
    AS m(PATH, DOC_ID, DOC_TYPE, DOC_TITLE, DOC_DATE)
), ai AS (
  SELECT m.*, s.TXT,
    TRY_PARSE_JSON(REGEXP_SUBSTR(AI_COMPLETE('claude-sonnet-4-5',
      'Read this LetterOne document excerpt and return ONLY a JSON object with keys: "summary" (2-3 sentences with specific figures), "sentiment" (one of Positive, Negative, Neutral, Mixed), "keywords" (5-8 comma-separated keywords as one string).\n\n' || LEFT(s.TXT, 15000)),
      '\\{.*\\}', 1, 1, 's')) AS J
  FROM meta m JOIN src s ON s.RELATIVE_PATH = m.PATH
)
SELECT DOC_ID, 'LetterOne Holdings', DOC_TYPE, DOC_TITLE, DOC_DATE, 'LetterOne',
       '@L1_DOCUMENT_STAGE/' || PATH, TXT, J:summary::STRING, COALESCE(J:sentiment::STRING, 'Neutral'), J:keywords::STRING, NULL
FROM ai;

ALTER CORTEX SEARCH SERVICE COMPANY_DOCUMENT_SEARCH REFRESH;

-- ============================================================================
-- EXECUTIVE CALLS — CFO call recordings + transcripts
-- ============================================================================

DELETE FROM EXECUTIVE_CALLS WHERE RECORDING_PATH IS NOT NULL;

INSERT INTO EXECUTIVE_CALLS
  (CALL_ID, COMPANY, CONTACT_NAME, CONTACT_ROLE, CALL_DATE, DURATION_SECONDS, CALLER, CALL_TYPE, SENTIMENT, TRANSCRIPTION, SUMMARY, RED_FLAGS, RED_FLAG_COUNT, KEYWORDS, RECORDING_PATH, TRANSCRIPT_PATH)
WITH t AS (
  SELECT REGEXP_SUBSTR(METADATA$FILENAME, 'transcripts/(.*)\\.txt', 1, 1, 'e') AS STEM,
         -- strip the "SYNTHETIC SAMPLE - ..." header line (files contain literal \n sequences)
         TRIM(REGEXP_REPLACE($1::STRING, '^SYNTHETIC SAMPLE[^\\\\\\n]*(\\\\n|\\s)+', '')) AS TXT
  FROM @LETTERONE_DB.TREASURY.L1_CALLS/transcripts/ (FILE_FORMAT => 'LETTERONE_DB.PUBLIC.L1_TXT_FMT')
), m AS (
  SELECT * FROM VALUES
    ('dia_cfo_call','DIA'), ('holland_and_barrett_cfo_call','Holland & Barrett'), ('l1_digital_cfo_call','L1 Digital'),
    ('l1_energy_cfo_call','L1 Energy'), ('l1_health_cfo_call','L1 Health'), ('l1_retail_cfo_call','L1 Retail'),
    ('l1_technology_cfo_call','L1 Technology'), ('l1_water_cfo_call','L1 Water'), ('letterone_holdings_cfo_call','LetterOne Holdings'),
    ('veon_cfo_call','VEON'), ('wintershall_dea_stake_cfo_call','Wintershall Dea (stake)')
    AS m(STEM, COMPANY)
), ai AS (
  SELECT m.STEM, m.COMPANY, t.TXT,
    TRY_PARSE_JSON(REGEXP_SUBSTR(AI_COMPLETE('claude-sonnet-4-5',
      'Analyse this treasury call transcript and return ONLY a JSON object with keys: "summary" (2 sentences), "sentiment" (one of Positive, Negative, Neutral, Mixed), "red_flags" (array of short strings for genuine risks; empty array if none), "keywords" (4-6 comma-separated keywords as one string).\n\n' || t.TXT),
      '\\{.*\\}', 1, 1, 's')) AS J
  FROM m JOIN t ON t.STEM = m.STEM
)
SELECT 'EC-2026-' || LPAD(18 + ROW_NUMBER() OVER (ORDER BY STEM), 3, '0'),
  COMPANY, 'CFO', 'CFO', '2026-10-28 09:00:00'::TIMESTAMP_NTZ,
  ROUND(ARRAY_SIZE(SPLIT(TXT, ' ')) / 150 * 60),   -- estimated at 150 words/min
  'LetterOne Treasury', 'Quarterly Review',
  COALESCE(J:sentiment::STRING, 'Neutral'), TXT, J:summary::STRING,
  TO_JSON(COALESCE(J:red_flags, ARRAY_CONSTRUCT())), ARRAY_SIZE(COALESCE(J:red_flags, ARRAY_CONSTRUCT())), J:keywords::STRING,
  '@LETTERONE_DB.TREASURY.L1_CALLS/mp4/' || STEM || '.mp4', '@LETTERONE_DB.TREASURY.L1_CALLS/transcripts/' || STEM || '.txt'
FROM ai;

-- Verify
SELECT 'COMPANY_DOCUMENTS (staged)' AS TBL, COUNT(*) AS ROWS FROM COMPANY_DOCUMENTS WHERE FILE_PATH ILIKE '%letterone_website%'
UNION ALL SELECT 'EXECUTIVE_CALLS (staged)', COUNT(*) FROM EXECUTIVE_CALLS WHERE RECORDING_PATH IS NOT NULL;
