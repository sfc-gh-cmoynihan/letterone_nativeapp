-- ============================================================================
-- LetterOne Treasury Platform — Synthetic Data Load
-- Version: 1.0 | Date: 2026-09-29
-- Generates all synthetic data using SQL INSERT statements
-- ============================================================================

USE ROLE ACCOUNTADMIN;
USE DATABASE LETTERONE_DB;
USE SCHEMA PUBLIC;
USE WAREHOUSE L1_WH;

-- ============================================================================
-- FX RATES (5 pairs, ~250 recent business days)
-- ============================================================================
INSERT INTO FX_RATES
SELECT
    DATEADD('day', -seq4(), CURRENT_DATE()) AS RATE_DATE,
    pair.VALUE AS CURRENCY_PAIR,
    CASE pair.VALUE
        WHEN 'GBP/USD' THEN 1.27 + (RANDOM() % 100) / 5000.0
        WHEN 'EUR/USD' THEN 1.09 + (RANDOM() % 100) / 5000.0
        WHEN 'CHF/USD' THEN 1.13 + (RANDOM() % 100) / 5000.0
        WHEN 'JPY/USD' THEN 0.0067 + (RANDOM() % 100) / 500000.0
        WHEN 'SEK/USD' THEN 0.096 + (RANDOM() % 100) / 50000.0
    END AS RATE
FROM TABLE(GENERATOR(ROWCOUNT => 250)) g,
     TABLE(SPLIT_TO_TABLE('GBP/USD,EUR/USD,CHF/USD,JPY/USD,SEK/USD', ',')) pair
WHERE DAYOFWEEK(DATEADD('day', -seq4(), CURRENT_DATE())) NOT IN (0, 6);

-- ============================================================================
-- ENFUSION POSITIONS (~50 instruments x recent 5 snapshots for demo)
-- ============================================================================
INSERT INTO ENFUSION_POSITIONS
WITH instruments AS (
    SELECT * FROM (VALUES
        ('POS001','US Treasury 10Y 2.5% 2035','Government Bond','US912810SL35','L1 Treasury','Rates','Govt Book','Fixed Income',50000000,50125000.00,'USD'),
        ('POS002','UK Gilt 4.25% 2034','Government Bond','GB00BMBL1G81','L1 Treasury','Rates','Govt Book','Fixed Income',30000000,28950000.00,'GBP'),
        ('POS003','German Bund 2.5% 2033','Government Bond','DE0001102580','L1 Treasury','Rates','Govt Book','Fixed Income',25000000,23750000.00,'EUR'),
        ('POS004','JPM USD Liquidity Fund','Money Market','IE00B4KBCP23','L1 Treasury','Cash Mgmt','MM Book','Cash',100000000,100050000.00,'USD'),
        ('POS005','GS EUR Liquidity Fund','Money Market','IE00B19Z7Y58','L1 Treasury','Cash Mgmt','MM Book','Cash',40000000,38200000.00,'EUR'),
        ('POS006','EUR/USD FX Forward Mar-27','FX Forward',NULL,'L1 Treasury','FX Hedging','FX Book','Derivatives',-20000000,-19800000.00,'EUR'),
        ('POS007','GBP/USD FX Forward Mar-27','FX Forward',NULL,'L1 Treasury','FX Hedging','FX Book','Derivatives',-15000000,-14850000.00,'GBP'),
        ('POS008','Barclays 5.5% 2028 Corp','Corporate Bond','XS2581390800','L1 Treasury','Credit','Corp Book','Fixed Income',10000000,10250000.00,'GBP'),
        ('POS009','HSBC 4.75% 2029','Corporate Bond','XS2594321100','L1 Treasury','Credit','Corp Book','Fixed Income',8000000,7680000.00,'GBP'),
        ('POS010','Apple 3.0% 2027','Corporate Bond','US037833DX89','L1 Treasury','Credit','Corp Book','Fixed Income',15000000,14925000.00,'USD'),
        ('POS011','Wintershall Dea Equity','Private Equity',NULL,'L1 Energy','Direct','Energy Book','Equity',0,2500000000.00,'EUR'),
        ('POS012','VEON Ltd ADR','Public Equity','US91822M1062','L1 Technology','Direct','Tech Book','Equity',125000000,3125000000.00,'USD'),
        ('POS013','Holland & Barrett','Private Equity',NULL,'L1 Health','Direct','Health Book','Equity',0,1800000000.00,'GBP'),
        ('POS014','DIA Group','Private Equity',NULL,'L1 Retail','Direct','Retail Book','Equity',0,950000000.00,'EUR'),
        ('POS015','Turkcell','Public Equity','US9001112047','L1 Technology','Direct','Tech Book','Equity',50000000,425000000.00,'USD'),
        ('POS016','iShares MSCI World ETF','ETF','IE00B4L5Y983','L1 Treasury','Macro','ETF Book','Equity',20000000,20150000.00,'USD'),
        ('POS017','Gold ETF (GLD)','Commodity ETF','US46428Q1094','L1 Treasury','Macro','Commodity Book','Commodity',5000000,5250000.00,'USD'),
        ('POS018','BlueMountain CLO 2022-1 BB','CLO','XS2423150001','L1 Treasury','Structured','CLO Book','Structured Credit',5000000,4850000.00,'USD'),
        ('POS019','Carlyle Global CLO 2023 B','CLO','XS2556780002','L1 Treasury','Structured','CLO Book','Structured Credit',3000000,2910000.00,'USD'),
        ('POS020','Blackstone CLO 2024-1 BBB','CLO','XS2678900003','L1 Treasury','Structured','CLO Book','Structured Credit',7000000,6930000.00,'USD'),
        ('POS021','CHF/USD FX Forward Jun-27','FX Forward',NULL,'L1 Treasury','FX Hedging','FX Book','Derivatives',-5000000,-4975000.00,'CHF'),
        ('POS022','JPY/USD FX Forward Jun-27','FX Forward',NULL,'L1 Treasury','FX Hedging','FX Book','Derivatives',-3000000000,-20100000.00,'JPY'),
        ('POS023','Destination Pet Holdings','Private Equity',NULL,'L1 Health','Direct','Health Book','Equity',0,350000000.00,'USD'),
        ('POS024','K2 HealthVentures','Private Equity',NULL,'L1 Health','Direct','Health Book','Equity',0,280000000.00,'USD'),
        ('POS025','Plastic Energy','Private Equity',NULL,'L1 Energy','Direct','Energy Book','Equity',0,175000000.00,'EUR')
    ) AS t(PID,INAME,ITYPE,ISIN_VAL,ENT,STRAT,BK,PROD,QTY,MV_LOCAL,CCY)
),
dates AS (
    SELECT DATEADD('day', -seq4(), CURRENT_DATE()) AS SNAP_DATE
    FROM TABLE(GENERATOR(ROWCOUNT => 5))
    WHERE DAYOFWEEK(DATEADD('day', -seq4(), CURRENT_DATE())) NOT IN (0, 6)
)
SELECT
    d.SNAP_DATE,
    i.PID,
    i.INAME,
    i.ITYPE,
    i.ISIN_VAL,
    i.ENT,
    i.STRAT,
    i.BK,
    i.PROD,
    i.QTY,
    i.MV_LOCAL * (1 + (RANDOM() % 100) / 100000.0),
    i.CCY,
    CASE i.CCY
        WHEN 'USD' THEN i.MV_LOCAL * (1 + (RANDOM() % 100) / 100000.0)
        WHEN 'GBP' THEN i.MV_LOCAL * 1.27 * (1 + (RANDOM() % 100) / 100000.0)
        WHEN 'EUR' THEN i.MV_LOCAL * 1.09 * (1 + (RANDOM() % 100) / 100000.0)
        WHEN 'CHF' THEN i.MV_LOCAL * 1.13 * (1 + (RANDOM() % 100) / 100000.0)
        WHEN 'JPY' THEN i.MV_LOCAL * 0.0067 * (1 + (RANDOM() % 100) / 100000.0)
        ELSE i.MV_LOCAL
    END,
    (RANDOM() % 10000000) / 100.0
FROM instruments i
CROSS JOIN dates d;

-- ============================================================================
-- ENFUSION CASH (100 accounts x 5 recent snapshots)
-- ============================================================================
INSERT INTO ENFUSION_CASH
WITH banks AS (
    SELECT * FROM (VALUES
        ('ACC001','JPMorgan Chase','JPM-001-USD','USD','L1 Treasury'),
        ('ACC002','JPMorgan Chase','JPM-002-GBP','GBP','L1 Treasury'),
        ('ACC003','JPMorgan Chase','JPM-003-EUR','EUR','L1 Treasury'),
        ('ACC004','Barclays','BARC-001-GBP','GBP','L1 Treasury'),
        ('ACC005','Barclays','BARC-002-USD','USD','L1 Treasury'),
        ('ACC006','HSBC','HSBC-001-USD','USD','L1 Treasury'),
        ('ACC007','HSBC','HSBC-002-GBP','GBP','L1 Treasury'),
        ('ACC008','Deutsche Bank','DB-001-EUR','EUR','L1 Treasury'),
        ('ACC009','Deutsche Bank','DB-002-USD','USD','L1 Treasury'),
        ('ACC010','BNP Paribas','BNP-001-EUR','EUR','L1 Treasury'),
        ('ACC011','BNP Paribas','BNP-002-USD','USD','L1 Treasury'),
        ('ACC012','Goldman Sachs','GS-001-USD','USD','L1 Treasury'),
        ('ACC013','Citibank','CITI-001-USD','USD','L1 Treasury'),
        ('ACC014','Citibank','CITI-002-GBP','GBP','L1 Treasury'),
        ('ACC015','UBS','UBS-001-CHF','CHF','L1 Treasury'),
        ('ACC016','UBS','UBS-002-USD','USD','L1 Treasury'),
        ('ACC017','Credit Suisse (UBS)','CS-001-CHF','CHF','L1 Treasury'),
        ('ACC018','Nomura','NOM-001-JPY','JPY','L1 Treasury'),
        ('ACC019','Standard Chartered','SC-001-USD','USD','L1 Treasury'),
        ('ACC020','Societe Generale','SG-001-EUR','EUR','L1 Treasury'),
        ('ACC021','JPMorgan Chase','JPM-004-USD','USD','L1 Energy'),
        ('ACC022','Barclays','BARC-003-GBP','GBP','L1 Health'),
        ('ACC023','HSBC','HSBC-003-EUR','EUR','L1 Retail'),
        ('ACC024','Deutsche Bank','DB-003-USD','USD','L1 Technology'),
        ('ACC025','BNP Paribas','BNP-003-EUR','EUR','L1 Energy')
    ) AS t(AID,BNAME,ANUM,CCY,ENT)
),
dates AS (
    SELECT DATEADD('day', -seq4(), CURRENT_DATE()) AS SNAP_DATE
    FROM TABLE(GENERATOR(ROWCOUNT => 5))
    WHERE DAYOFWEEK(DATEADD('day', -seq4(), CURRENT_DATE())) NOT IN (0, 6)
)
SELECT
    d.SNAP_DATE,
    b.AID,
    b.BNAME,
    b.ANUM,
    b.CCY,
    ABS(RANDOM() % 50000000) + 1000000,
    CASE b.CCY
        WHEN 'USD' THEN ABS(RANDOM() % 50000000) + 1000000
        WHEN 'GBP' THEN (ABS(RANDOM() % 50000000) + 1000000) * 1.27
        WHEN 'EUR' THEN (ABS(RANDOM() % 50000000) + 1000000) * 1.09
        WHEN 'CHF' THEN (ABS(RANDOM() % 50000000) + 1000000) * 1.13
        WHEN 'JPY' THEN (ABS(RANDOM() % 5000000000) + 100000000) * 0.0067
        ELSE ABS(RANDOM() % 50000000) + 1000000
    END,
    b.ENT
FROM banks b
CROSS JOIN dates d;

-- ============================================================================
-- ENFUSION P&L (4 entities x 30 recent days)
-- ============================================================================
INSERT INTO ENFUSION_PNL
WITH entities AS (
    SELECT * FROM (VALUES
        ('L1 Treasury','Rates','Govt Book'),
        ('L1 Treasury','Credit','Corp Book'),
        ('L1 Treasury','FX Hedging','FX Book'),
        ('L1 Treasury','Cash Mgmt','MM Book'),
        ('L1 Energy','Direct','Energy Book'),
        ('L1 Technology','Direct','Tech Book'),
        ('L1 Health','Direct','Health Book'),
        ('L1 Retail','Direct','Retail Book')
    ) AS t(ENT,STRAT,BK)
),
dates AS (
    SELECT DATEADD('day', -seq4(), CURRENT_DATE()) AS RPT_DATE
    FROM TABLE(GENERATOR(ROWCOUNT => 30))
    WHERE DAYOFWEEK(DATEADD('day', -seq4(), CURRENT_DATE())) NOT IN (0, 6)
)
SELECT
    d.RPT_DATE,
    e.ENT,
    e.STRAT,
    e.BK,
    (RANDOM() % 2000000 - 1000000) / 100.0,
    (RANDOM() % 500000) / 100.0,
    (RANDOM() % 1500000 - 750000) / 100.0,
    (RANDOM() % 300000 - 150000) / 100.0,
    (RANDOM() % 200000) / 100.0
FROM entities e
CROSS JOIN dates d;

-- ============================================================================
-- BANK STATEMENTS (25 accounts x 5 days)
-- ============================================================================
INSERT INTO BANK_STATEMENTS
WITH banks AS (
    SELECT DISTINCT BANK_NAME, ACCOUNT_NUMBER, CURRENCY
    FROM ENFUSION_CASH
    WHERE SNAPSHOT_DATE = (SELECT MAX(SNAPSHOT_DATE) FROM ENFUSION_CASH)
),
dates AS (
    SELECT DATEADD('day', -seq4(), CURRENT_DATE()) AS STMT_DATE
    FROM TABLE(GENERATOR(ROWCOUNT => 5))
    WHERE DAYOFWEEK(DATEADD('day', -seq4(), CURRENT_DATE())) NOT IN (0, 6)
)
SELECT
    d.STMT_DATE,
    b.BANK_NAME,
    b.ACCOUNT_NUMBER,
    b.CURRENCY,
    ABS(RANDOM() % 50000000) + 500000,
    ABS(RANDOM() % 50000000) + 500000,
    ABS(RANDOM() % 5000000),
    ABS(RANDOM() % 5000000)
FROM banks b
CROSS JOIN dates d;

-- ============================================================================
-- RECONCILIATION BREAKS (15 seeded breaks)
-- ============================================================================
INSERT INTO RECONCILIATION_BREAKS VALUES
('BRK001', CURRENT_DATE(), 'Cash Balance', 'ACC001', 'JPMorgan Chase', 25340000.50, 25090000.50, 250000.00, 'Open', 'Timing difference: wire transfer initiated on T-1 but not yet credited. Expected to settle T+1.', 'Steven Gladstone', 3),
('BRK002', CURRENT_DATE(), 'Cash Balance', 'ACC004', 'Barclays', 12500000.00, 12750000.00, -250000.00, 'Open', 'Duplicate credit identified in bank statement. Bank reconciliation team notified.', 'Dmitry Yurin', 2),
('BRK003', DATEADD('day', -1, CURRENT_DATE()), 'Position', 'ACC006', 'HSBC', 10000000.00, 9850000.00, 150000.00, 'Open', 'Coupon accrual timing: Enfusion accrues on trade date, custodian on settlement date. Resolves at next coupon date.', NULL, 5),
('BRK004', DATEADD('day', -2, CURRENT_DATE()), 'Cash Balance', 'ACC008', 'Deutsche Bank', 8200000.00, 8200000.00, 0.00, 'Resolved', 'FX conversion rate difference: Enfusion uses Reuters 4pm fix, bank uses ECB reference rate. Difference within tolerance.', 'Steven Gladstone', 0),
('BRK005', CURRENT_DATE(), 'Cash Balance', 'ACC010', 'BNP Paribas', 15600000.00, 15100000.00, 500000.00, 'Open', 'Pending redemption from money market fund. Settlement expected T+2.', 'Steven Gladstone', 1),
('BRK006', DATEADD('day', -3, CURRENT_DATE()), 'Position', 'ACC012', 'Goldman Sachs', 20000000.00, 19750000.00, 250000.00, 'Under Review', 'Corporate action: stock split not yet reflected in custodian records. Awaiting SWIFT MT564 confirmation.', 'Dmitry Yurin', 7),
('BRK007', CURRENT_DATE(), 'Cash Balance', 'ACC013', 'Citibank', 9800000.00, 10100000.00, -300000.00, 'Open', 'Unexpected credit: appears to be a counterparty margin return. Checking against trade settlements.', NULL, 1),
('BRK008', DATEADD('day', -1, CURRENT_DATE()), 'Cash Balance', 'ACC015', 'UBS', 6500000.00, 6350000.00, 150000.00, 'Open', 'Bank charge not yet booked in Enfusion. Likely quarterly custody fee. Checking invoice.', 'Steven Gladstone', 4),
('BRK009', DATEADD('day', -4, CURRENT_DATE()), 'Position', 'ACC018', 'Nomura', 3000000000.00, 2997000000.00, 20100.00, 'Resolved', 'JPY rounding difference on FX forward MTM. Within $100 tolerance.', 'Dmitry Yurin', 0),
('BRK010', CURRENT_DATE(), 'Cash Balance', 'ACC020', 'Societe Generale', 7200000.00, 6700000.00, 500000.00, 'Open', 'Missing interest payment on EUR deposit. Due date was yesterday. Bank confirmation pending.', NULL, 2),
('BRK011', DATEADD('day', -1, CURRENT_DATE()), 'Cash Balance', 'ACC002', 'JPMorgan Chase', 18900000.00, 18650000.00, 317500.00, 'Open', 'GBP/USD rate variance: Enfusion closing rate vs bank statement rate. Difference is 0.15%.', 'Steven Gladstone', 3),
('BRK012', CURRENT_DATE(), 'Cash Balance', 'ACC021', 'JPMorgan Chase', 45000000.00, 44200000.00, 800000.00, 'Escalated', 'Large unexplained difference on L1 Energy operating account. Priority investigation required.', 'David Talbot', 1),
('BRK013', DATEADD('day', -2, CURRENT_DATE()), 'Position', 'ACC009', 'Deutsche Bank', 5000000.00, 4950000.00, 50000.00, 'Resolved', 'Mark-to-market timing: Enfusion uses 4pm NY close, custodian uses 5pm London close.', 'Dmitry Yurin', 0),
('BRK014', CURRENT_DATE(), 'Cash Balance', 'ACC014', 'Citibank', 22000000.00, 21800000.00, 254000.00, 'Open', 'Pending settlement: bond purchase T+2. Cash debited in Enfusion on trade date, bank on settlement.', NULL, 1),
('BRK015', DATEADD('day', -5, CURRENT_DATE()), 'Cash Balance', 'ACC019', 'Standard Chartered', 11000000.00, 10500000.00, 500000.00, 'Under Review', 'Discrepancy coincides with a failed wire transfer. Resubmission in progress.', 'Steven Gladstone', 8);

-- ============================================================================
-- HEDGE FUND RETURNS (25 funds x 60 months)
-- ============================================================================
INSERT INTO HEDGE_FUND_RETURNS
WITH funds AS (
    SELECT * FROM (VALUES
        ('Citadel Wellington','Multi-Strategy'),
        ('Millennium Partners','Multi-Strategy'),
        ('Bridgewater Pure Alpha','Global Macro'),
        ('Man AHL Alpha','CTA/Managed Futures'),
        ('Two Sigma Compass','Quantitative'),
        ('D.E. Shaw Composite','Multi-Strategy'),
        ('Renaissance Medallion','Quantitative'),
        ('Point72 Asset Mgmt','Multi-Strategy'),
        ('Baupost Group','Value/Event'),
        ('Elliott Associates','Activist/Event'),
        ('Third Point Partners','Event Driven'),
        ('Pershing Square','Activist'),
        ('Viking Global','Long/Short Equity'),
        ('Lone Pine Capital','Long/Short Equity'),
        ('Tiger Global','Long/Short Equity'),
        ('Farallon Capital','Multi-Strategy'),
        ('Anchorage Capital','Credit'),
        ('Oaktree Capital','Credit'),
        ('Ares Management','Credit'),
        ('Canyon Capital','Credit'),
        ('Vanguard EM Bond','EM Fixed Income'),
        ('Ashmore EM Debt','EM Fixed Income'),
        ('GQG Partners EM Eq','EM Equity'),
        ('Lazard EM Equity','EM Equity'),
        ('BlueBay EM Select','EM Multi-Asset')
    ) AS t(FNAME,FSTRAT)
),
months AS (
    SELECT DATEADD('month', -seq4(), DATE_TRUNC('month', CURRENT_DATE())) AS RPT_MONTH
    FROM TABLE(GENERATOR(ROWCOUNT => 60))
)
SELECT
    f.FNAME,
    f.FSTRAT,
    m.RPT_MONTH,
    (RANDOM() % 800 - 200) / 100.0,
    ABS(RANDOM() % 10000000000) + 500000000,
    100 + (RANDOM() % 5000) / 100.0,
    (RANDOM() % 200) / 100.0 - 0.5,
    (RANDOM() % 200) / 100.0 - 0.5
FROM funds f
CROSS JOIN months m;

-- ============================================================================
-- MARKET BENCHMARKS (8 benchmarks x 250 days)
-- ============================================================================
INSERT INTO MARKET_BENCHMARKS
WITH benchmarks AS (
    SELECT * FROM (VALUES
        ('MSCI World', 3450.0),
        ('S&P 500', 5800.0),
        ('FTSE 100', 8200.0),
        ('Brent Crude Oil', 78.0),
        ('Gold (USD/oz)', 2650.0),
        ('EUR/USD', 1.09),
        ('GBP/USD', 1.27),
        ('US 10Y Yield', 4.25)
    ) AS t(BNAME, BASE_VAL)
),
dates AS (
    SELECT DATEADD('day', -seq4(), CURRENT_DATE()) AS BMK_DATE
    FROM TABLE(GENERATOR(ROWCOUNT => 250))
    WHERE DAYOFWEEK(DATEADD('day', -seq4(), CURRENT_DATE())) NOT IN (0, 6)
)
SELECT
    d.BMK_DATE,
    b.BNAME,
    b.BASE_VAL * (1 + (RANDOM() % 1000 - 500) / 100000.0),
    (RANDOM() % 400 - 200) / 10000.0
FROM benchmarks b
CROSS JOIN dates d;

-- ============================================================================
-- CLO PORTFOLIO (~145 tranches)
-- ============================================================================
INSERT INTO CLO_PORTFOLIO
WITH managers AS (
    SELECT * FROM (VALUES
        ('BlueMountain Capital'),('Carlyle Group'),('Blackstone Credit'),
        ('PGIM'),('Ares Management'),('Apollo Global'),('KKR Credit'),
        ('Bain Capital Credit'),('Owl Rock Capital'),('Golub Capital'),
        ('Benefit Street Partners'),('Sound Point Capital'),('Octagon Credit'),
        ('Barings'),('Intermediate Capital')
    ) AS t(MGR)
),
vintages AS (SELECT 2018 + seq4() AS VY FROM TABLE(GENERATOR(ROWCOUNT => 7))),
ratings AS (
    SELECT * FROM (VALUES ('AAA'),('AA'),('A'),('BBB'),('BB'),('B')) AS t(RT)
)
SELECT
    'CLO-' || LPAD(ROW_NUMBER() OVER (ORDER BY m.MGR, v.VY, r.RT), 4, '0'),
    m.MGR || ' CLO ' || v.VY || '-' || (ABS(RANDOM()) % 3 + 1),
    m.MGR,
    v.VY,
    r.RT,
    r.RT,
    CASE r.RT WHEN 'AAA' THEN 120 + ABS(RANDOM() % 30)
              WHEN 'AA' THEN 170 + ABS(RANDOM() % 40)
              WHEN 'A' THEN 230 + ABS(RANDOM() % 50)
              WHEN 'BBB' THEN 320 + ABS(RANDOM() % 60)
              WHEN 'BB' THEN 550 + ABS(RANDOM() % 100)
              WHEN 'B' THEN 800 + ABS(RANDOM() % 150)
    END,
    CASE r.RT WHEN 'AAA' THEN 5.5 + (ABS(RANDOM() % 20)) / 10.0
              WHEN 'AA' THEN 5.0 + (ABS(RANDOM() % 20)) / 10.0
              WHEN 'A' THEN 4.5 + (ABS(RANDOM() % 20)) / 10.0
              WHEN 'BBB' THEN 4.0 + (ABS(RANDOM() % 20)) / 10.0
              WHEN 'BB' THEN 3.5 + (ABS(RANDOM() % 20)) / 10.0
              WHEN 'B' THEN 3.0 + (ABS(RANDOM() % 20)) / 10.0
    END,
    DATEADD('year', CASE WHEN v.VY <= 2021 THEN 0 ELSE 5 - (2024 - v.VY) END, TO_DATE(v.VY || '-06-15', 'YYYY-MM-DD')),
    DATEADD('year', 12, TO_DATE(v.VY || '-06-15', 'YYYY-MM-DD')),
    (ABS(RANDOM() % 20000000) + 1000000),
    (ABS(RANDOM() % 20000000) + 900000),
    CASE WHEN ABS(RANDOM() % 10) < 8 THEN 'CLO' ELSE 'ABS' END
FROM managers m
CROSS JOIN vintages v
CROSS JOIN ratings r
LIMIT 145;

-- ============================================================================
-- TRUSTEE METRICS (5 deals x 6 months)
-- ============================================================================
INSERT INTO TRUSTEE_METRICS VALUES
('BlueMountain CLO 2022-1', '2026-09-15', '2026-09', 4.85, 8.21, 2845, 5.12, 0.35, 78),
('BlueMountain CLO 2022-1', '2026-08-15', '2026-08', 5.10, 8.45, 2810, 4.85, 0.30, 79),
('BlueMountain CLO 2022-1', '2026-07-15', '2026-07', 5.25, 8.60, 2790, 4.60, 0.25, 80),
('BlueMountain CLO 2022-1', '2026-06-15', '2026-06', 5.40, 8.80, 2775, 4.40, 0.20, 81),
('BlueMountain CLO 2022-1', '2026-05-15', '2026-05', 5.50, 8.95, 2760, 4.25, 0.15, 82),
('BlueMountain CLO 2022-1', '2026-04-15', '2026-04', 5.65, 9.10, 2740, 4.10, 0.10, 83),
('Carlyle Global CLO 2023-2', '2026-09-15', '2026-09', 3.20, 6.50, 2920, 6.80, 0.85, 72),
('Carlyle Global CLO 2023-2', '2026-08-15', '2026-08', 3.50, 6.80, 2890, 6.50, 0.75, 73),
('Carlyle Global CLO 2023-2', '2026-07-15', '2026-07', 3.80, 7.10, 2860, 6.20, 0.65, 74),
('Carlyle Global CLO 2023-2', '2026-06-15', '2026-06', 4.10, 7.40, 2830, 5.90, 0.55, 75),
('Carlyle Global CLO 2023-2', '2026-05-15', '2026-05', 4.30, 7.60, 2810, 5.70, 0.50, 76),
('Carlyle Global CLO 2023-2', '2026-04-15', '2026-04', 4.50, 7.80, 2790, 5.50, 0.45, 77),
('Blackstone Credit CLO 2024-1', '2026-09-15', '2026-09', 6.20, 10.50, 2650, 3.80, 0.10, 85),
('Blackstone Credit CLO 2024-1', '2026-08-15', '2026-08', 6.30, 10.60, 2640, 3.70, 0.08, 86),
('Blackstone Credit CLO 2024-1', '2026-07-15', '2026-07', 6.35, 10.70, 2635, 3.65, 0.05, 86),
('Blackstone Credit CLO 2024-1', '2026-06-15', '2026-06', 6.40, 10.80, 2630, 3.60, 0.05, 87),
('Blackstone Credit CLO 2024-1', '2026-05-15', '2026-05', 6.45, 10.85, 2625, 3.55, 0.04, 87),
('Blackstone Credit CLO 2024-1', '2026-04-15', '2026-04', 6.50, 10.90, 2620, 3.50, 0.03, 88),
('PGIM CLO 2021-3', '2026-09-15', '2026-09', 2.10, 4.80, 3050, 8.50, 1.80, 65),
('PGIM CLO 2021-3', '2026-08-15', '2026-08', 2.40, 5.10, 3020, 8.20, 1.60, 66),
('PGIM CLO 2021-3', '2026-07-15', '2026-07', 2.70, 5.40, 2990, 7.90, 1.40, 67),
('PGIM CLO 2021-3', '2026-06-15', '2026-06', 3.00, 5.70, 2960, 7.60, 1.20, 68),
('PGIM CLO 2021-3', '2026-05-15', '2026-05', 3.20, 5.90, 2940, 7.40, 1.10, 69),
('PGIM CLO 2021-3', '2026-04-15', '2026-04', 3.40, 6.10, 2920, 7.20, 1.00, 70),
('Ares CLO 2020-1', '2026-09-15', '2026-09', 1.80, 3.90, 3150, 9.20, 2.50, 60),
('Ares CLO 2020-1', '2026-08-15', '2026-08', 2.00, 4.10, 3130, 9.00, 2.30, 61),
('Ares CLO 2020-1', '2026-07-15', '2026-07', 2.20, 4.30, 3100, 8.80, 2.10, 62),
('Ares CLO 2020-1', '2026-06-15', '2026-06', 2.40, 4.50, 3080, 8.60, 1.90, 63),
('Ares CLO 2020-1', '2026-05-15', '2026-05', 2.60, 4.70, 3060, 8.40, 1.70, 64),
('Ares CLO 2020-1', '2026-04-15', '2026-04', 2.80, 4.90, 3040, 8.20, 1.50, 65);

-- ============================================================================
-- DEAL LIBRARY (20 deals: live, dead, closed)
-- ============================================================================
INSERT INTO DEAL_LIBRARY VALUES
('DL001','Madrid Student Housing Fund','Student Housing','Southern Europe','Spain','Live','Real Estate','Senior Secured',45000000,3150000,12.50,65.00,5.25,3.50,850,3200000,NULL,NULL,NULL,NULL,'2026-09-10'),
('DL002','Berlin Micro-Living Portfolio','Residential','Western Europe','Germany','Live','Real Estate','Mezzanine',30000000,1800000,14.00,72.00,4.80,2.80,650,1900000,NULL,NULL,NULL,NULL,'2026-09-15'),
('DL003','UK Logistics Warehouse III','Industrial','Northern Europe','United Kingdom','Closed','Real Estate','Senior Secured',80000000,5600000,10.50,58.00,5.50,2.00,NULL,5800000,5400000,12.50,'2026-06-30',NULL,'2025-03-01'),
('DL004','Nordic Pharma Royalties','Pharma Royalties','Northern Europe','Sweden','Closed','Asset-Backed','Whole Loan',25000000,2500000,15.00,NULL,NULL,NULL,NULL,2600000,2750000,25.00,'2026-06-30',NULL,'2024-12-01'),
('DL005','Italian Solar Portfolio','Renewable Energy','Southern Europe','Italy','Dead','Infrastructure','Senior Secured',60000000,4200000,11.00,70.00,6.00,1.50,NULL,NULL,NULL,NULL,NULL,'Counterparty unable to provide audited financials for 2024','2026-07-20'),
('DL006','Amsterdam Office Conversion','Commercial','Western Europe','Netherlands','Live','Real Estate','Bridge Loan',35000000,2100000,13.00,68.00,5.00,3.00,750,2200000,NULL,NULL,NULL,NULL,'2026-08-28'),
('DL007','UK Music Royalties Fund','Music Royalties','Northern Europe','United Kingdom','Closed','Asset-Backed','Whole Loan',15000000,1800000,16.00,NULL,NULL,NULL,NULL,1900000,2050000,30.00,'2026-06-30',NULL,'2024-06-01'),
('DL008','Singapore Aviation Leasing','Aviation','Asia Pacific','Singapore','Dead','Asset-Backed','Senior Secured',50000000,4000000,12.00,75.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Lease rates below underwriting assumptions due to market softness','2026-05-15'),
('DL009','Portuguese Hotel Portfolio','Hospitality','Southern Europe','Portugal','Live','Real Estate','Mezzanine',28000000,1680000,14.50,70.00,5.50,4.00,600,1750000,NULL,NULL,NULL,NULL,'2026-09-01'),
('DL010','German Auto Inventory Finance','Inventory Finance','Western Europe','Germany','Closed','Asset-Backed','Revolving Facility',40000000,3200000,9.50,NULL,NULL,NULL,NULL,3300000,3150000,15.00,'2026-06-30',NULL,'2025-01-15'),
('DL011','Irish Data Centre Debt','Technology','Northern Europe','Ireland','Dead','Infrastructure','Senior Secured',70000000,5250000,10.00,60.00,5.75,NULL,NULL,NULL,NULL,NULL,NULL,'Sponsor pulled deal to pursue equity funding','2026-08-10'),
('DL012','Swiss Pharma Tax Credits','Tax Credit','Western Europe','Switzerland','Live','Asset-Backed','Structured Note',20000000,2000000,18.00,NULL,NULL,NULL,NULL,2100000,NULL,NULL,NULL,NULL,'2026-09-20'),
('DL013','UK Student Housing Manchester','Student Housing','Northern Europe','United Kingdom','Closed','Real Estate','Senior Secured',55000000,3850000,11.50,62.00,5.25,3.00,NULL,4000000,3500000,8.50,'2026-06-30',NULL,'2024-09-01'),
('DL014','French Logistics Park','Industrial','Western Europe','France','Dead','Real Estate','Senior Secured',65000000,4550000,10.00,55.00,5.50,2.50,NULL,NULL,NULL,NULL,NULL,'LTV exceeded 75% on updated valuation','2026-04-20'),
('DL015','Dubai Hospitality Fund','Hospitality','Middle East','UAE','Live','Real Estate','Mezzanine',42000000,3360000,15.00,73.00,6.00,5.00,900,3500000,NULL,NULL,NULL,NULL,'2026-09-25'),
('DL016','UK EV Charging Network','Infrastructure','Northern Europe','United Kingdom','Live','Infrastructure','Senior Secured',38000000,2660000,11.00,65.00,5.00,NULL,NULL,2800000,NULL,NULL,NULL,NULL,'2026-08-15'),
('DL017','Greek Residential Mortgages','Mortgage Pool','Southern Europe','Greece','Dead','Asset-Backed','Whole Loan',30000000,2400000,13.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Regulatory uncertainty around mortgage servicing','2026-06-01'),
('DL018','Scandinavian Wind Farm Debt','Renewable Energy','Northern Europe','Norway','Closed','Infrastructure','Senior Secured',75000000,5625000,9.00,55.00,5.00,NULL,NULL,5800000,5900000,20.00,'2026-06-30',NULL,'2024-03-01'),
('DL019','Polish Warehouse Portfolio','Industrial','Eastern Europe','Poland','Live','Real Estate','Senior Secured',48000000,3360000,12.00,60.00,5.75,3.50,700,3500000,NULL,NULL,NULL,NULL,'2026-09-18'),
('DL020','Thai Hospitality Recovery','Hospitality','Asia Pacific','Thailand','Dead','Real Estate','Mezzanine',22000000,1540000,16.00,75.00,6.50,5.00,NULL,NULL,NULL,NULL,NULL,'Post-COVID recovery slower than projected in counterparty model','2026-03-10');

-- ============================================================================
-- DEAL DOCUMENTS (~3 per deal, synthetic parsed text)
-- ============================================================================
INSERT INTO DEAL_DOCUMENTS
SELECT
    'DOC-' || LPAD(ROW_NUMBER() OVER (ORDER BY d.DEAL_ID, dt.FTYPE), 4, '0'),
    d.DEAL_ID,
    d.DEAL_NAME,
    dt.FTYPE,
    d.DEAL_NAME || ' - ' || dt.FTYPE || '.pdf',
    '@L1_DOCUMENT_STAGE/deals/' || d.DEAL_ID || '/' || REPLACE(dt.FTYPE, ' ', '_') || '.pdf',
    'This is a synthetic ' || dt.FTYPE || ' document for ' || d.DEAL_NAME || '. ' ||
    'The deal is a ' || d.ASSET_TYPE || ' transaction in ' || d.COUNTRY || ' (' || d.SECTOR || ' sector). ' ||
    CASE dt.FTYPE
        WHEN 'Information Memorandum' THEN 'Key terms: Purchase price ' || COALESCE(TO_VARCHAR(d.PURCHASE_PRICE_USD), 'N/A') || ' USD, Target IRR ' || COALESCE(TO_VARCHAR(d.TARGET_IRR_PCT), 'N/A') || '%, LTV ' || COALESCE(TO_VARCHAR(d.LTV_PCT), 'N/A') || '%. The counterparty projects rental growth of ' || COALESCE(TO_VARCHAR(d.RENTAL_GROWTH_PCT), 'N/A') || '% per annum.'
        WHEN 'Operating Model' THEN 'Financial projections show NOI of ' || COALESCE(TO_VARCHAR(d.NOI_USD), 'N/A') || ' USD with exit yield assumption of ' || COALESCE(TO_VARCHAR(d.EXIT_YIELD_PCT), 'N/A') || '%. The model assumes a 5-year hold period with annual rent increases.'
        WHEN 'Valuation Report' THEN 'Independent valuation by CBRE dated ' || COALESCE(TO_VARCHAR(d.REVIEW_DATE), '2026-01-01') || '. Market value assessed based on comparable transactions in the ' || d.REGION || ' region.'
    END,
    dt.FTYPE
FROM DEAL_LIBRARY d
CROSS JOIN (SELECT * FROM (VALUES ('Information Memorandum'), ('Operating Model'), ('Valuation Report')) AS t(FTYPE)) dt
WHERE d.DEAL_STATUS IN ('Live', 'Closed');

-- ============================================================================
-- INVESTORS (15 LPs)
-- ============================================================================
INSERT INTO INVESTORS VALUES
('INV001','Sovereign Wealth Fund of Abu Dhabi','Sovereign Wealth Fund','UAE','L1 Treasury Fund','500000000','2020-01-15','Active'),
('INV002','Norwegian Government Pension Fund','Sovereign Wealth Fund','Norway','L1 Treasury Fund','350000000','2020-03-01','Active'),
('INV003','Ontario Teachers Pension Plan','Pension Fund','Canada','L1 Treasury Fund','250000000','2020-06-15','Active'),
('INV004','CalPERS','Pension Fund','United States','L1 Treasury Fund','200000000','2021-01-10','Active'),
('INV005','Swiss Re Insurance','Insurance Company','Switzerland','L1 Treasury Fund','150000000','2021-04-01','Active'),
('INV006','Temasek Holdings','Sovereign Wealth Fund','Singapore','L1 Direct Lending Fund','300000000','2021-07-15','Active'),
('INV007','APG Asset Management','Pension Fund','Netherlands','L1 Direct Lending Fund','200000000','2021-09-01','Active'),
('INV008','GIC Private Limited','Sovereign Wealth Fund','Singapore','L1 Direct Lending Fund','400000000','2020-03-15','Active'),
('INV009','Future Fund Australia','Sovereign Wealth Fund','Australia','L1 Treasury Fund','175000000','2022-01-01','Active'),
('INV010','CDPQ','Pension Fund','Canada','L1 Direct Lending Fund','225000000','2022-04-15','Active'),
('INV011','Allianz Global Investors','Insurance Company','Germany','L1 Treasury Fund','100000000','2022-07-01','Active'),
('INV012','Korea Investment Corporation','Sovereign Wealth Fund','South Korea','L1 Treasury Fund','125000000','2023-01-15','Active'),
('INV013','Mubadala Investment Company','Sovereign Wealth Fund','UAE','L1 Direct Lending Fund','350000000','2020-06-01','Active'),
('INV014','British Columbia Investment','Pension Fund','Canada','L1 Treasury Fund','150000000','2023-06-01','Active'),
('INV015','AXA Investment Managers','Insurance Company','France','L1 Direct Lending Fund','175000000','2023-09-15','Active');

-- ============================================================================
-- CAPITAL ACCOUNTS (15 investors x 8 quarters)
-- ============================================================================
INSERT INTO CAPITAL_ACCOUNTS
WITH investors AS (SELECT INVESTOR_ID, COMMITTED_CAPITAL_USD, FUND_VEHICLE FROM INVESTORS),
quarters AS (
    SELECT DATEADD('quarter', -seq4(), DATE_TRUNC('quarter', CURRENT_DATE())) AS PERIOD_END
    FROM TABLE(GENERATOR(ROWCOUNT => 8))
)
SELECT
    i.INVESTOR_ID,
    LAST_DAY(q.PERIOD_END) AS PERIOD_END_DATE,
    i.FUND_VEHICLE,
    i.COMMITTED_CAPITAL_USD * 0.6 * (1 + (RANDOM() % 100) / 2000.0) AS OPENING_NAV,
    i.COMMITTED_CAPITAL_USD * 0.02 * (ABS(RANDOM() % 100) / 100.0) AS CONTRIBUTIONS,
    i.COMMITTED_CAPITAL_USD * 0.015 * (ABS(RANDOM() % 100) / 100.0) AS DISTRIBUTIONS,
    i.COMMITTED_CAPITAL_USD * 0.005 AS MANAGEMENT_FEE,
    i.COMMITTED_CAPITAL_USD * 0.003 * (ABS(RANDOM() % 100) / 100.0) AS PERFORMANCE_FEE,
    i.COMMITTED_CAPITAL_USD * 0.01 * ((RANDOM() % 200 - 100) / 100.0) AS MV_CHANGE,
    i.COMMITTED_CAPITAL_USD * 0.005 * (ABS(RANDOM() % 100) / 100.0) AS REALISED,
    i.COMMITTED_CAPITAL_USD * 0.002 * (ABS(RANDOM() % 100) / 100.0) AS INCOME,
    i.COMMITTED_CAPITAL_USD * 0.001 * ((RANDOM() % 200 - 100) / 100.0) AS FX,
    i.COMMITTED_CAPITAL_USD * 0.62 * (1 + (RANDOM() % 100) / 2000.0) AS CLOSING_NAV,
    i.COMMITTED_CAPITAL_USD * 0.65 AS CALLED,
    i.COMMITTED_CAPITAL_USD * 0.15 AS TOTAL_DIST,
    1.18 + (RANDOM() % 30) / 100.0 AS TVPI,
    0.22 + (RANDOM() % 15) / 100.0 AS DPI,
    8.5 + (RANDOM() % 500) / 100.0 AS NET_IRR
FROM investors i
CROSS JOIN quarters q;

-- ============================================================================
-- CAPITAL ACTIVITY (~100 rows)
-- ============================================================================
INSERT INTO CAPITAL_ACTIVITY
WITH investors AS (SELECT INVESTOR_ID, FUND_VEHICLE, COMMITTED_CAPITAL_USD FROM INVESTORS),
acts AS (
    SELECT
        i.INVESTOR_ID,
        i.FUND_VEHICLE,
        i.COMMITTED_CAPITAL_USD,
        seq4() AS SEQ
    FROM investors i,
    TABLE(GENERATOR(ROWCOUNT => 7)) g
)
SELECT
    'ACT-' || LPAD(ROW_NUMBER() OVER (ORDER BY a.INVESTOR_ID, a.SEQ), 4, '0'),
    a.INVESTOR_ID,
    a.FUND_VEHICLE,
    CASE WHEN a.SEQ % 3 = 0 THEN 'Distribution' ELSE 'Capital Call' END,
    DATEADD('day', -(a.SEQ * 45 + ABS(RANDOM() % 30)), CURRENT_DATE()),
    a.COMMITTED_CAPITAL_USD * (CASE WHEN a.SEQ % 3 = 0 THEN 0.02 ELSE 0.05 END) * (ABS(RANDOM() % 100) / 100.0 + 0.5),
    CASE WHEN a.SEQ <= 2 THEN 'Pending' ELSE 'Completed' END,
    DATEADD('day', -(a.SEQ * 45 + ABS(RANDOM() % 30) + 15), CURRENT_DATE()),
    DATEADD('day', -(a.SEQ * 45 + ABS(RANDOM() % 30) - 5), CURRENT_DATE()),
    'L1-' || a.FUND_VEHICLE || '-' || LPAD(a.SEQ::VARCHAR, 3, '0')
FROM acts a;

-- ============================================================================
-- BUSINESS RULES
-- ============================================================================
INSERT INTO BUSINESS_RULES VALUES
('RULE001','Cash Balance Tolerance','Reconciliation','ABS(enfusion_amount - statement_amount) > 10000',1,'David Talbot','2026-01-15'),
('RULE002','Position MTM Tolerance','Reconciliation','ABS(enfusion_mtm - custodian_mtm) / NULLIF(enfusion_mtm, 0) > 0.001',1,'David Talbot','2026-01-15'),
('RULE003','FX Rate Variance','Reconciliation','ABS(enfusion_fx - bank_fx) / NULLIF(enfusion_fx, 0) > 0.005',1,'Dmitry Yurin','2026-02-01'),
('RULE004','Settlement T+2 Auto-Match','Reconciliation','settlement_date > trade_date + 2 AND status = ''pending''',1,'Steven Gladstone','2026-03-10'),
('RULE005','Concentration Limit 20%','Risk','bank_cash_pct > 0.20',1,'Jason Lai','2026-04-01'),
('RULE006','OC Test Cushion Alert','Trading','oc_test_cushion_pct < 3.0',1,'Amy Abob','2026-05-15'),
('RULE007','CCC Bucket Threshold','Trading','ccc_bucket_pct > 7.5',1,'Amy Abob','2026-05-15'),
('RULE008','Covenant Headroom Alert','Direct Lending','covenant_headroom_pct < 10.0',1,'Daniele Gualdani','2026-06-01'),
('RULE009','NOI Underperformance','Direct Lending','current_noi / NULLIF(underwriting_noi, 0) < 0.95',1,'Daniele Gualdani','2026-06-01'),
('RULE010','Investor NAV Reconciliation','Investor Reporting','ABS(computed_nav - reported_nav) > 1000',1,'David Talbot','2026-07-01');

-- ============================================================================
-- ENFUSION TRADES (sample of 50 trades)
-- ============================================================================
INSERT INTO ENFUSION_TRADES
WITH instruments AS (
    SELECT * FROM (VALUES
        ('US Treasury 10Y 2.5% 2035','Government Bond','US912810SL35','Goldman Sachs','L1 Treasury','Rates'),
        ('UK Gilt 4.25% 2034','Government Bond','GB00BMBL1G81','Barclays','L1 Treasury','Rates'),
        ('EUR/USD FX Forward','FX Forward',NULL,'JPMorgan Chase','L1 Treasury','FX Hedging'),
        ('GBP/USD FX Forward','FX Forward',NULL,'HSBC','L1 Treasury','FX Hedging'),
        ('Apple 3.0% 2027','Corporate Bond','US037833DX89','Morgan Stanley','L1 Treasury','Credit'),
        ('iShares MSCI World ETF','ETF','IE00B4L5Y983','Deutsche Bank','L1 Treasury','Macro'),
        ('Gold ETF (GLD)','Commodity ETF','US46428Q1094','Citibank','L1 Treasury','Macro'),
        ('Barclays 5.5% 2028 Corp','Corporate Bond','XS2581390800','Barclays','L1 Treasury','Credit')
    ) AS t(INAME,ITYPE,ISIN_VAL,CPTY,ENT,STRAT)
),
dates AS (
    SELECT DATEADD('day', -seq4() * 3, CURRENT_DATE()) AS TDATE
    FROM TABLE(GENERATOR(ROWCOUNT => 7))
)
SELECT
    d.TDATE,
    DATEADD('day', 2, d.TDATE),
    'TRD-' || LPAD(ROW_NUMBER() OVER (ORDER BY d.TDATE, i.INAME), 5, '0'),
    i.INAME,
    CASE WHEN ABS(RANDOM() % 2) = 0 THEN 'BUY' ELSE 'SELL' END,
    ABS(RANDOM() % 10000000) + 100000,
    99.5 + (RANDOM() % 200) / 100.0,
    (ABS(RANDOM() % 10000000) + 100000) * (99.5 + (RANDOM() % 200) / 100.0) / 100.0,
    i.CPTY,
    i.ENT,
    i.STRAT,
    CASE WHEN d.TDATE < DATEADD('day', -5, CURRENT_DATE()) THEN 'Settled' ELSE 'Pending' END
FROM instruments i
CROSS JOIN dates d;

-- Verify row counts
SELECT 'ENFUSION_POSITIONS' AS TBL, COUNT(*) AS ROWS FROM ENFUSION_POSITIONS
UNION ALL SELECT 'ENFUSION_CASH', COUNT(*) FROM ENFUSION_CASH
UNION ALL SELECT 'ENFUSION_PNL', COUNT(*) FROM ENFUSION_PNL
UNION ALL SELECT 'ENFUSION_TRADES', COUNT(*) FROM ENFUSION_TRADES
UNION ALL SELECT 'BANK_STATEMENTS', COUNT(*) FROM BANK_STATEMENTS
UNION ALL SELECT 'RECONCILIATION_BREAKS', COUNT(*) FROM RECONCILIATION_BREAKS
UNION ALL SELECT 'HEDGE_FUND_RETURNS', COUNT(*) FROM HEDGE_FUND_RETURNS
UNION ALL SELECT 'MARKET_BENCHMARKS', COUNT(*) FROM MARKET_BENCHMARKS
UNION ALL SELECT 'CLO_PORTFOLIO', COUNT(*) FROM CLO_PORTFOLIO
UNION ALL SELECT 'TRUSTEE_METRICS', COUNT(*) FROM TRUSTEE_METRICS
UNION ALL SELECT 'DEAL_LIBRARY', COUNT(*) FROM DEAL_LIBRARY
UNION ALL SELECT 'DEAL_DOCUMENTS', COUNT(*) FROM DEAL_DOCUMENTS
UNION ALL SELECT 'INVESTORS', COUNT(*) FROM INVESTORS
UNION ALL SELECT 'CAPITAL_ACCOUNTS', COUNT(*) FROM CAPITAL_ACCOUNTS
UNION ALL SELECT 'CAPITAL_ACTIVITY', COUNT(*) FROM CAPITAL_ACTIVITY
UNION ALL SELECT 'FX_RATES', COUNT(*) FROM FX_RATES
UNION ALL SELECT 'BUSINESS_RULES', COUNT(*) FROM BUSINESS_RULES
ORDER BY 1;
