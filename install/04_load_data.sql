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


-- ============================================================================
-- EXECUTIVE CALLS
-- ============================================================================

INSERT INTO EXECUTIVE_CALLS (CALL_ID, COMPANY, CONTACT_NAME, CONTACT_ROLE, CALL_DATE, DURATION_SECONDS, CALLER, CALL_TYPE, SENTIMENT, TRANSCRIPTION, SUMMARY, RED_FLAGS, RED_FLAG_COUNT, KEYWORDS)
VALUES
('EC-2026-001', 'Dia Group', 'Ricardo Alvarez', 'CEO', '2026-06-04 09:30:00', 2400, 'Daniele Gualdani', 'Quarterly Review', 'Positive',
'Thanks for joining, Ricardo. I wanted to run through the Q2 performance and get your outlook for the back half of the year. How are things tracking against the plan we discussed in March?\n\nRicardo: Thanks Daniele, good to connect. I am pleased to say we are ahead of plan on most KPIs. Revenue for Q2 came in at EUR 1.72 billion, which is about 3.2% above the revised forecast. Like-for-like sales growth was 4.1% in Spain, which is the strongest quarter we have posted since the restructuring completed. We have also seen encouraging momentum in Portugal where we opened 14 new proximity format stores during the quarter.\n\nDaniele: That is encouraging. What is driving the outperformance on the top line? Is it traffic or basket size?\n\nRicardo: It is actually both. Footfall is up 2.8% year on year across the Spanish estate, and average transaction value increased by 1.3%. Our private label penetration reached 52% of total sales which is a record for Dia. The margin benefit from that mix shift is significant. Gross margin expanded 80 basis points to 24.6%.\n\nDaniele: Very good. And on the cost side, how is the supply chain transformation progressing?\n\nRicardo: We completed the consolidation of the Madrid distribution hub on schedule in May. That alone is saving us approximately EUR 8 million annually in logistics costs. We are now rolling out the same playbook to the Barcelona and Seville centres. EBITDA margin for Q2 was 6.8%, up from 5.9% in the same period last year.\n\nDaniele: Ricardo, this is a strong set of results. Let us schedule a deep dive on the Portugal expansion pipeline next month. I want to understand the capex requirements and the return profile on those new stores.\n\nRicardo: Absolutely, I will have the team prepare a detailed deck. We are excited about the trajectory.',
'Dia Group Q2 results exceeded forecast with EUR 1.72B revenue, 4.1% LFL growth in Spain, and EBITDA margin improving to 6.8%. Private label penetration hit a record 52% and the Madrid distribution hub consolidation is delivering EUR 8M in annual logistics savings.',
'[]', 0, 'revenue, LFL growth, private label, EBITDA margin, supply chain, Portugal expansion'),

('EC-2026-002', 'Dia Group', 'Maria Torres', 'CFO', '2026-07-15 14:00:00', 1800, 'Jason Lai', 'Ad-hoc', 'Negative',
'Maria, thanks for making time at short notice. Jason here. I wanted to follow up on the covenant compliance note your team sent through last night. Can you walk me through where we stand?\n\nMaria: Of course, Jason. I want to be transparent about this. Our net debt to EBITDA ratio at the end of June was 3.42x against a covenant ceiling of 3.75x. That gives us headroom of roughly 8.8%, which I acknowledge is tighter than where we want to be. The primary driver was the drawdown on the revolving credit facility to fund the accelerated store refurbishment programme.\n\nJason: 8.8% headroom is below the 15% buffer we agreed as a management target. What is your remediation plan?\n\nMaria: We have three levers. First, we are deferring approximately EUR 25 million of non-essential capex from Q3 into Q1 2027. Second, we expect a working capital inflow of around EUR 40 million in Q3 as seasonal inventory normalises. Third, we are in advanced discussions with two lenders about an accordion feature that would give us an additional EUR 100 million of headroom if needed.\n\nJason: That is helpful. But I need to flag that the board will want a detailed recovery trajectory. What is your forecast for the ratio at year end?\n\nMaria: Based on current projections, we expect to be at 3.15x by December, which would restore headroom to approximately 16%. The Q3 EBITDA seasonality works in our favour, and the capex deferral is already in motion.\n\nJason: Understood. I would like weekly covenant tracking reports from your team starting immediately. Can you commit to that?\n\nMaria: Yes, absolutely. I will have our treasury team set that up by Friday. I also want to note that we are exploring an interest rate hedge on the floating portion of our debt given current rate volatility.\n\nJason: Good. Let us reconvene in two weeks with an updated forecast.',
'Dia Group covenant headroom has narrowed to 8.8% against the 3.75x net debt to EBITDA ceiling, driven by accelerated capex drawdowns. CFO outlined a three-part remediation plan including EUR 25M capex deferral, seasonal working capital inflow, and potential accordion facility. Weekly covenant tracking has been mandated.',
'["Covenant headroom below 10%"]', 1, 'covenant compliance, net debt, EBITDA ratio, capex deferral, revolving credit facility, working capital'),

('EC-2026-003', 'Dia Group', 'Pablo Mendez', 'CIO', '2026-09-10 11:00:00', 1500, 'Sam Drury', 'Strategy Session', 'Neutral',
'Pablo, thanks for joining. Sam here. I wanted to get an update on the digital transformation roadmap we reviewed at the board in May. Specifically, where are we on the unified commerce platform?\n\nPablo: Good morning Sam. We are making steady progress but I want to set expectations appropriately. The unified commerce platform migration is about 60% complete. We have successfully onboarded the Spanish online grocery channel and the click-and-collect service onto the new platform. However, the integration with the Portuguese systems is proving more complex than anticipated.\n\nSam: What is causing the complexity in Portugal?\n\nPablo: The legacy point-of-sale systems in Portugal are running on a different technology stack that predates the Dia restructuring. We need to build a middleware layer to bridge the two systems. Our current estimate is that the Portugal integration will be completed by end of Q1 2027, which is approximately two months behind the original timeline.\n\nSam: What is the cost impact of that delay?\n\nPablo: The additional middleware development will cost approximately EUR 2.3 million, bringing the total programme cost to EUR 18.5 million against an original budget of EUR 16.2 million. I want to stress that this is a one-time integration cost and does not affect the ongoing operating cost savings we projected.\n\nSam: Understood. And the data analytics capability we discussed, the customer segmentation engine?\n\nPablo: That is actually ahead of schedule. We went live with the first phase in August and we are already seeing a 12% improvement in promotional targeting accuracy. The personalisation engine is processing approximately 4 million customer profiles daily across our loyalty programme base.\n\nSam: That is good to hear. Please send me the revised Portugal timeline with milestones so I can brief the investment committee.',
'Dia Group unified commerce platform is 60% complete with the Portuguese integration delayed by two months due to legacy system complexity, adding EUR 2.3M to the programme budget. The customer segmentation engine launched ahead of schedule with a 12% improvement in promotional targeting accuracy.',
'[]', 0, 'digital transformation, unified commerce, Portugal integration, middleware, customer segmentation, loyalty programme'),

('EC-2026-004', 'Wintershall Dea', 'Klaus Richter', 'CFO', '2026-06-18 10:00:00', 2700, 'Amy Abob', 'Quarterly Review', 'Positive',
'Klaus, good morning. Amy here. Let us go through the Q2 financials and production update. How has the portfolio performed against the commodity price environment we have been seeing?\n\nKlaus: Good morning Amy. Q2 was a strong quarter for us. Total production averaged 612,000 barrels of oil equivalent per day, which is 4% above guidance. Revenue came in at EUR 2.84 billion, up 11% year on year, primarily driven by higher realised gas prices in our European portfolio.\n\nAmy: What were your realised prices for the quarter?\n\nKlaus: Realised oil price was $78.40 per barrel, roughly in line with Brent. Realised gas price was EUR 32.50 per megawatt hour in Europe, which benefited from the colder-than-expected spring and continued LNG supply tightness. Our hedging programme also contributed positively. We had approximately 35% of our gas production hedged at EUR 29 per megawatt hour, which was well above spot for the first six weeks of the quarter.\n\nAmy: How is that flowing through to free cash flow?\n\nKlaus: Free cash flow was EUR 680 million for the quarter, which is the highest quarterly figure since the merger. We reduced net debt by EUR 420 million to EUR 3.1 billion. Our leverage ratio is now at 0.9x, which is well within our target range of below 1.5x. We also completed the refinancing of the 2028 bond at very attractive terms, 4.2% coupon versus 5.6% on the maturing facility.\n\nAmy: Excellent. And the Dvalin project in Norway, any update on the timeline?\n\nKlaus: First gas from Dvalin is confirmed for Q4 2026. The subsea installation was completed in May and we are in the commissioning phase. The project is on budget at NOK 12.4 billion.\n\nAmy: Klaus, this is a very clean quarter. Let us discuss the capital allocation framework at the next board meeting. I think there is scope to revisit the shareholder return policy given the deleveraging progress.',
'Wintershall Dea delivered a strong Q2 with production at 612K boepd, revenue of EUR 2.84B, and record free cash flow of EUR 680M. Net debt reduced by EUR 420M with leverage at 0.9x. The Dvalin project in Norway remains on budget with first gas confirmed for Q4 2026.',
'[]', 0, 'production, realised prices, free cash flow, leverage, Dvalin, refinancing, capital allocation'),

('EC-2026-005', 'Wintershall Dea', 'Stefan Braun', 'CEO', '2026-08-05 15:30:00', 3200, 'Daniele Gualdani', 'Board Update', 'Mixed',
'Stefan, thanks for the time. Daniele here. I have been reviewing the latest capital projects update and I want to discuss the North Africa development programme. The numbers look like they have moved.\n\nStefan: Thank you Daniele. You are right to flag this. The Reggane North Phase 2 project in Algeria has experienced cost escalation. The current estimate at completion is $1.42 billion versus the original sanction budget of $1.20 billion. That is an overrun of approximately 18%.\n\nDaniele: That is a material overrun. What is driving it?\n\nStefan: Three factors. First, we encountered unexpected geological complexity in the southern well cluster which required additional drilling. That accounts for roughly $80 million of the overrun. Second, local procurement costs in Algeria have increased significantly due to currency depreciation and supply chain bottlenecks. Third, we had a three-month delay on the pipeline tie-in due to a permitting issue with the Algerian authorities which has now been resolved.\n\nDaniele: One concern I would flag is that this is the second project in two years where we have seen a significant budget overrun. What are you doing to strengthen project governance?\n\nStefan: I hear you. We have already taken several steps. We appointed a new VP of Capital Projects in July who comes from Equinor and has a strong track record in mega-project delivery. We are also implementing a stage-gate review process with independent technical assurance at each phase. The first full review under the new framework will cover the Libya offshore exploration programme.\n\nDaniele: Good. I want quarterly updates on all projects above $500 million with variance analysis. On a more positive note, how is the carbon capture partnership with BASF progressing?\n\nStefan: Very well actually. We signed the final investment decision on the Greensand CCS project last month. The EU Innovation Fund is providing EUR 150 million in co-funding. First injection is targeted for 2028 and the project has a storage capacity of 1.5 million tonnes of CO2 per year.\n\nDaniele: That is a good strategic move. Let us make sure we communicate that effectively to the broader shareholder base.',
'Wintershall Dea Reggane North Phase 2 in Algeria has a capex overrun of 18% ($1.42B vs $1.20B budget) driven by geological complexity, local cost inflation, and permitting delays. New VP of Capital Projects appointed and stage-gate governance being implemented. The Greensand CCS project reached FID with EUR 150M EU co-funding.',
'["Capex overrun of 18% versus budget"]', 1, 'capex overrun, Algeria, Reggane North, project governance, CCS, Greensand, carbon capture'),

('EC-2026-006', 'Wintershall Dea', 'Katrin Hoffman', 'CIO', '2026-10-02 09:00:00', 1800, 'Matei Moprea', 'Ad-hoc', 'Positive',
'Katrin, Matei here. Thanks for connecting. I wanted to check in on the digital oilfield programme and specifically the predictive maintenance rollout we discussed at the technology committee in July.\n\nKatrin: Good morning Matei. I am happy to report that the predictive maintenance platform is delivering results ahead of our expectations. We went live across all North Sea assets in August and we have already seen a 23% reduction in unplanned downtime compared to the same period last year.\n\nMatei: That is impressive. Can you quantify the financial impact?\n\nKatrin: Based on the first two months of data, we estimate the annualised production uptime benefit at approximately 8,500 barrels of oil equivalent per day. At current commodity prices, that translates to roughly $95 million in incremental annual revenue. The total investment in the platform was $14 million, so the payback period is well under three months.\n\nMatei: What is the technology stack? I want to understand the scalability for other assets.\n\nKatrin: We are using a combination of edge computing at the wellhead with real-time sensor data feeding into a cloud-based machine learning model. The model was trained on five years of historical maintenance records and vibration data from approximately 2,400 rotating equipment items. The false positive rate is currently at 3.2%, which is well within acceptable limits for operational decision-making.\n\nMatei: And the cybersecurity posture? Given the OT-IT convergence this creates.\n\nKatrin: We implemented a zero-trust architecture for all edge-to-cloud communications. The system underwent a full penetration test by an independent firm in June with no critical findings. We also have air-gapped backup systems at each offshore installation.\n\nMatei: Very good. I would like to see the business case for rolling this out to the Middle East and North Africa assets by Q1 next year. Can your team prepare that?\n\nKatrin: Yes, we have already started scoping that. I will have a preliminary business case to you within three weeks.',
'Wintershall Dea predictive maintenance platform delivered a 23% reduction in unplanned downtime across North Sea assets with an estimated $95M annualised revenue uplift on a $14M investment. The machine learning model processes real-time data from 2,400 equipment items with a 3.2% false positive rate. Rollout to MENA assets is being scoped.',
'[]', 0, 'predictive maintenance, digital oilfield, machine learning, unplanned downtime, cybersecurity, zero-trust, edge computing'),

('EC-2026-007', 'Holland & Barrett', 'Sarah Mitchell', 'CEO', '2026-07-22 10:30:00', 2100, 'Sam Drury', 'Strategy Session', 'Positive',
'Sarah, thanks for joining. Sam here. I want to discuss the international expansion strategy and the performance of the new product categories we launched in Q1. How is the business tracking?\n\nSarah: Thanks Sam. We are in a really strong position. Total group revenue for the first half was GBP 412 million, up 8.6% year on year. UK like-for-like growth was 5.3% which is particularly encouraging given the tough consumer environment. Our online channel grew 18% and now represents 31% of total sales.\n\nSam: What is driving the UK outperformance?\n\nSarah: The sports nutrition and wellness categories we launched in February are performing exceptionally well. They contributed GBP 24 million in incremental revenue in the first half. The customer demographic for these products skews younger, 25 to 40, which is exactly the audience we have been trying to attract. Average basket value for these customers is GBP 38, about 15% higher than our traditional customer base.\n\nSam: That is a meaningful mix shift. How about the international markets?\n\nSarah: Netherlands is our star performer, with revenue up 22% year on year as the franchise model gains traction. We opened 18 new franchise stores in H1 and the pipeline for H2 includes another 12. Belgium is stable with low single digit growth. The Middle East joint venture launched in Dubai in June and we have three stores open now with plans for eight by year end.\n\nSam: And margins? The last time we spoke there was some pressure from input costs.\n\nSarah: Gross margin improved by 60 basis points to 48.2% as private label penetration increased to 44% of total sales. We managed to offset most of the input cost inflation through supplier renegotiations and reformulation. EBITDA margin was 12.4%, up from 11.1% in the prior year.\n\nSam: Excellent results Sarah. I would like to schedule a deep dive on the Middle East JV performance once we have a full quarter of trading data.',
'Holland & Barrett delivered GBP 412M first-half revenue with 8.6% growth driven by strong sports nutrition launches contributing GBP 24M incremental revenue. EBITDA margin improved to 12.4% with private label at 44% of sales. Netherlands franchise expansion and Dubai JV launch are progressing well.',
'[]', 0, 'revenue growth, sports nutrition, online channel, franchise expansion, Netherlands, Dubai JV, EBITDA margin'),

('EC-2026-008', 'Holland & Barrett', 'James Whitfield', 'CFO', '2026-08-28 16:00:00', 1500, 'Jason Lai', 'Quarterly Review', 'Neutral',
'James, Jason here. Good afternoon. I wanted to go through the balance sheet and cash flow position at the half year. Can you walk me through the key metrics?\n\nJames: Of course, Jason. Net debt at June 30 was GBP 285 million, which is broadly flat versus year end. Free cash flow in the first half was GBP 34 million, which is lower than the GBP 42 million we generated in H1 last year. The primary difference is higher capex related to the store refurbishment programme and the Dubai JV setup costs.\n\nJason: What is the full year capex guidance?\n\nJames: We are forecasting GBP 48 million for the full year, of which GBP 22 million has been spent in H1. The largest items in H2 are the completion of the new Nuneaton distribution centre, approximately GBP 12 million, and the continued store modernisation programme at GBP 8 million. The remaining GBP 6 million is allocated to digital and IT investments.\n\nJason: How is the Nuneaton DC progressing? That was flagged as critical path for the online growth targets.\n\nJames: On track for operational go-live in November. The building is substantially complete and we are in the fit-out phase for the automated picking systems. Once live, it will increase our online fulfilment capacity by approximately 40% and reduce cost per order by an estimated 22%.\n\nJason: Good. And the debt maturity profile, any near-term refinancing needs?\n\nJames: Our term loan B does not mature until March 2029, so we have comfortable runway. The RCF of GBP 75 million is undrawn. We do have a small GBP 15 million bilateral facility maturing in February 2027 which we plan to roll on similar terms. Interest cover is at 4.8x which gives us ample headroom on covenants.\n\nJason: Understood. Clean position overall. Let us check in again after the Nuneaton go-live.',
'Holland & Barrett net debt stable at GBP 285M with GBP 34M H1 free cash flow against GBP 48M full year capex guidance. Nuneaton DC on track for November go-live with 40% online capacity uplift. Debt maturity profile is comfortable with term loan B not due until March 2029.',
'[]', 0, 'net debt, free cash flow, capex, Nuneaton distribution centre, debt maturity, interest cover, online fulfilment'),

('EC-2026-009', 'Holland & Barrett', 'David Chen', 'CIO', '2026-10-08 11:30:00', 2400, 'Amy Abob', 'Due Diligence', 'Positive',
'David, Amy here. Thank you for making time. We are conducting our annual technology due diligence and I want to understand the current state of the technology estate and the roadmap for the next 18 months.\n\nDavid: Thanks Amy. I appreciate the thoroughness. Let me start with the current state. We completed the migration of our core e-commerce platform to a headless commerce architecture in Q2. Page load times have improved by 45% and our conversion rate on mobile has increased from 2.8% to 3.6%. That improvement alone is worth approximately GBP 8 million in annualised incremental revenue.\n\nAmy: That is a significant uplift. What about the ERP landscape?\n\nDavid: We are midway through the SAP S4HANA migration. Phase one covering finance and procurement went live in April with minimal disruption. Phase two, which covers supply chain and warehouse management, is scheduled for Q1 2027. Total programme budget is GBP 22 million and we are currently tracking at GBP 21.3 million, so slightly under budget.\n\nAmy: Good financial discipline. How about data and analytics?\n\nDavid: We launched our customer data platform in March which unifies data from all touchpoints including stores, online, app, and loyalty programme. We now have a single view of approximately 9.2 million active customers. The platform enables real-time personalisation and we are seeing a 28% improvement in email campaign click-through rates since launch.\n\nAmy: And the cybersecurity posture? What does your risk profile look like?\n\nDavid: We achieved ISO 27001 certification in May and our SOC 2 Type II audit is underway with results expected in December. We invested GBP 3.4 million in cybersecurity this year, up from GBP 2.1 million last year. Our mean time to detect has improved from 72 hours to under 8 hours following the deployment of our new SIEM platform. We run quarterly penetration tests and the most recent one in September returned zero critical findings.\n\nAmy: Impressive progress David. This is one of the strongest technology positions across the portfolio.',
'Holland & Barrett technology estate is in strong shape with the headless commerce migration delivering 45% faster page loads and a mobile conversion uplift worth GBP 8M annually. SAP S4HANA migration Phase 1 is live and under budget at GBP 21.3M versus GBP 22M. ISO 27001 achieved and mean time to detect reduced from 72 hours to under 8 hours.',
'[]', 0, 'headless commerce, SAP S4HANA, customer data platform, cybersecurity, ISO 27001, conversion rate, personalisation'),

('EC-2026-010', 'Veon', 'Aleksandr Petrov', 'CEO', '2026-06-25 08:00:00', 3600, 'Matei Moprea', 'Quarterly Review', 'Mixed',
'Aleksandr, good morning. Matei here. Thanks for joining early given the time zones. Let us go through the Q2 performance across the key markets and any regulatory developments.\n\nAleksandr: Good morning Matei. Q2 was a mixed quarter. Group revenue was $1.98 billion, up 6.2% in local currency terms but only 2.1% in reported USD due to currency headwinds, particularly in Pakistan and Bangladesh. Total subscribers reached 178 million, up 5.4% year on year.\n\nMatei: Walk me through the market-by-market picture.\n\nAleksandr: Pakistan remains our growth engine. Jazz delivered 14% local currency revenue growth driven by 4G adoption which has now reached 42% of the subscriber base. However, I do need to flag an important regulatory development. The Pakistan Telecommunication Authority issued a fine of $15 million related to alleged spectrum licence compliance violations in the Punjab region. We are contesting this through the legal process and our external counsel believes we have strong grounds for appeal, but I want you to be aware.\n\nMatei: That is concerning. What is the potential range of outcomes?\n\nAleksandr: Our legal team assesses a 60% probability of the fine being reduced to $5 million or less on appeal. In the worst case scenario, the full $15 million would stand. We have not provisioned for it yet given the strong appeal prospects but we will reassess at Q3 close.\n\nMatei: I want regular updates on that. What about Bangladesh and Ukraine?\n\nAleksandr: Bangladesh grew 9% in local currency with Banglalink gaining 220 basis points of market share. Ukraine continues to be resilient with revenue up 7% and the network reconstruction programme is 68% complete. We invested $45 million in Ukrainian network capex in Q2 alone. Kazakhstan delivered steady 5% growth.\n\nMatei: And ARPU trends across the group?\n\nAleksandr: Blended ARPU was $2.85, up 3.8% year on year. The 4G mix improvement is the primary driver. Our JazzCash mobile financial services platform in Pakistan now has 41 million monthly active users and contributed $38 million in revenue for the quarter.\n\nMatei: Good. Let us schedule a dedicated session on the Pakistan regulatory situation next week.',
'Veon Q2 revenue was $1.98B with 6.2% local currency growth but only 2.1% in USD due to FX headwinds. Pakistan Jazz drove 14% local currency growth but faces a $15M regulatory fine from PTA over spectrum compliance. Bangladesh gained 220bps market share and Ukraine network reconstruction is 68% complete.',
'["Regulatory fine of $15M in Pakistan market"]', 1, 'subscriber growth, Pakistan, regulatory fine, PTA, JazzCash, ARPU, Ukraine reconstruction, Bangladesh'),

('EC-2026-011', 'Veon', 'Nadia Volkov', 'CFO', '2026-08-14 13:00:00', 2100, 'Daniele Gualdani', 'Ad-hoc', 'Negative',
'Nadia, Daniele here. I received your email this morning and wanted to discuss the situation immediately. Can you elaborate on what is happening?\n\nNadia: Daniele, thank you for calling so quickly. I want to inform you that I have tendered my resignation as CFO of Veon, effective October 31. I have accepted the CFO role at a major European telecommunications group. I wanted to ensure LetterOne heard this from me directly before the market announcement tomorrow morning.\n\nDaniele: I appreciate the direct communication, Nadia, but I will be candid that this is a significant concern. You have been instrumental in the debt restructuring and the equity story. What is the succession plan?\n\nNadia: I understand the concern completely. Aleksandr and I have discussed this extensively. Our Deputy CFO, Sergei Karpov, has been with the group for seven years and was the architect of the 2025 bond refinancing. Aleksandr intends to recommend Sergei as interim CFO to the board pending a full search. I have committed to a comprehensive handover period through October.\n\nDaniele: What is the current state of the refinancing workstream? You were personally leading the negotiations with the bank syndicate.\n\nNadia: The $1.2 billion revolving credit facility renewal is approximately 80% negotiated. The key commercial terms have been agreed with all six syndicate banks. Sergei has been in every meeting and has strong relationships with the lenders. I do not anticipate any disruption to the timeline. We expect to sign in September.\n\nDaniele: I need to be frank. Investor perception is a real risk here. Your credibility in the market was a key factor in the last capital raise. How should we manage the communication?\n\nNadia: I agree we need to manage this carefully. The announcement will include Sergei''s appointment as interim CFO, a joint statement from Aleksandr and myself emphasising the stability of the leadership team, and confirmation that all financial guidance for 2026 remains unchanged.\n\nDaniele: We will need an emergency board call to discuss this. I will coordinate with Aleksandr. Nadia, I wish you well but I need to protect our position here.',
'Veon CFO Nadia Volkov has resigned effective October 31, accepting a role at another European telco. Deputy CFO Sergei Karpov recommended as interim successor. The $1.2B RCF renewal is 80% negotiated and expected to close in September despite the transition. Market announcement planned for tomorrow.',
'["CFO departure announced"]', 1, 'CFO resignation, succession planning, revolving credit facility, leadership transition, investor perception, interim CFO'),

('EC-2026-012', 'Veon', 'Dmitri Sokolov', 'CIO', '2026-09-19 09:30:00', 1800, 'Jason Lai', 'Board Update', 'Positive',
'Dmitri, Jason here. Good morning. The board has asked for an update on the network modernisation programme and the AI-driven operations initiative. Can you take us through the highlights?\n\nDmitri: Good morning Jason. I am happy to report strong progress on both fronts. Starting with network modernisation, we have now completed 5G rollout in 14 cities across Pakistan and Kazakhstan, covering approximately 38 million people. Capital efficiency has been excellent. Our cost per 5G site is running at $42,000, which is 15% below the industry benchmark for comparable emerging markets.\n\nJason: What is the subscriber uptake on 5G looking like?\n\nDmitri: We have 4.2 million 5G subscribers across the two markets, which is ahead of our internal target of 3.5 million by this point. ARPU for 5G subscribers is approximately 2.3x the 4G ARPU, so the revenue uplift is significant. Data consumption per 5G user averages 28 gigabytes per month versus 9 gigabytes for 4G users.\n\nJason: Impressive unit economics. Now, the AI operations initiative?\n\nDmitri: We deployed our AI-driven network operations centre in Q2. The system monitors all 86,000 cell sites across our markets in real time. It has reduced mean time to repair by 34% and decreased the volume of customer-facing outage minutes by 41%. The financial impact is a reduction of approximately $18 million annually in operating expenses related to field engineering and network operations.\n\nJason: That is exactly the kind of operational leverage the board wants to see. Any challenges?\n\nDmitri: The main challenge is talent. We are competing for AI and data engineering talent in markets where the supply is limited. We have established a partnership with two universities in Islamabad and one in Almaty to create a talent pipeline. We also launched a reskilling programme for 500 existing network engineers to build data science capabilities.\n\nJason: Good forward thinking. Please prepare a one-page summary for the board pack. I will circulate it ahead of the October meeting.',
'Veon 5G rollout covers 14 cities and 38M people with 4.2M subscribers generating 2.3x 4G ARPU. The AI-driven network operations centre reduced mean time to repair by 34% and customer-facing outages by 41%, saving an estimated $18M annually. University partnerships established to address AI talent pipeline challenges.',
'[]', 0, '5G rollout, subscriber uptake, ARPU, AI operations, network modernisation, talent pipeline, mean time to repair'),

('EC-2026-013', 'Turk Telekom', 'Mehmet Yilmaz', 'CEO', '2026-07-09 08:30:00', 2400, 'Amy Abob', 'Strategy Session', 'Neutral',
'Mehmet, good morning. Amy here. Thank you for your time. I want to discuss the competitive landscape in Turkey and how we are positioning Turk Telekom for the next phase of growth given the macroeconomic stabilisation.\n\nMehmet: Good morning Amy. Thank you. The Turkish macro environment is indeed improving. Inflation has moderated to 28% year on year from a peak of 67% eighteen months ago. The lira has been relatively stable over the past quarter. This creates a more predictable operating environment for us.\n\nAmy: How is that translating into business performance?\n\nMehmet: Revenue for the first half was TRY 48.2 billion, up 41% year on year in nominal terms and approximately 10% in real terms after adjusting for inflation. We added 680,000 net broadband subscribers in H1, bringing the total base to 16.8 million. Our fibre penetration rate increased to 72% of total broadband subscribers.\n\nAmy: Where are you on the fibre rollout versus the five-year plan?\n\nMehmet: We have now passed 22.4 million homes with fibre, which represents 78% of addressable households in Turkey. We are on track to reach 85% by the end of 2027 as planned. The average cost per home passed has come down to approximately TRY 850 from TRY 1,100 two years ago as our deployment teams have gained efficiency.\n\nAmy: Good. And the enterprise segment? I recall there was a significant push into managed services.\n\nMehmet: Enterprise revenue grew 52% year on year, with managed IT services and cloud hosting being the key drivers. We signed 34 new enterprise contracts in Q2 with an average contract value of TRY 12 million. The government cloud mandate has been particularly beneficial for us as a domestic provider.\n\nAmy: What about competitive pressures from Turkcell and Vodafone Turkey?\n\nMehmet: Competition remains rational. Price increases across the industry have broadly kept pace with inflation. Our market share in broadband is stable at 47% and we gained approximately 50 basis points in mobile over the past twelve months. The key differentiator for us continues to be our fixed-mobile convergent offering.\n\nAmy: Thank you Mehmet. Please share the updated five-year strategic plan when it is ready for review.',
'Turk Telekom H1 revenue was TRY 48.2B with 10% real growth as Turkish macro stabilises. Fibre penetration reached 72% of broadband subscribers with 22.4M homes passed. Enterprise revenue grew 52% driven by managed services and government cloud contracts. Market share stable at 47% in broadband.',
'[]', 0, 'Turkish lira, inflation, fibre rollout, broadband subscribers, enterprise, managed services, government cloud, convergent'),

('EC-2026-014', 'Turk Telekom', 'Elif Demir', 'CFO', '2026-09-03 14:30:00', 1950, 'Sam Drury', 'Quarterly Review', 'Positive',
'Elif, Sam here. Good afternoon. I want to review the financial results through August and discuss the full year outlook. How are we tracking against the targets set at the start of the year?\n\nElif: Good afternoon Sam. We are performing well against our targets. Revenue through August was TRY 66.8 billion, which puts us on pace to exceed our full year guidance of TRY 96 billion. EBITDA margin for the eight-month period was 42.3%, which is 110 basis points above the same period last year.\n\nSam: What is driving the margin expansion?\n\nElif: Several factors. The subscriber mix is improving as we add higher-ARPU fibre and 4.5G customers. Our cost optimisation programme delivered TRY 1.8 billion in savings in the first eight months, primarily from network energy efficiency improvements and procurement renegotiations. Energy costs, which are our largest opex line, are down 8% year on year in real terms following our investment in solar power for cell sites.\n\nSam: Tell me more about the solar initiative.\n\nElif: We have deployed solar panels at 4,200 cell sites, which is approximately 12% of our tower portfolio. These sites are generating an average of 35% of their energy requirements from solar, reducing our grid electricity consumption by approximately 180 gigawatt hours per year. The payback period on the investment is 3.2 years at current energy prices.\n\nSam: That is a compelling return. And the balance sheet?\n\nElif: Net debt at end of August was TRY 42.1 billion, with a net debt to EBITDA ratio of 1.05x, well within our comfort zone. We successfully issued a TRY 5 billion domestic bond in July at a coupon of 32%, which was significantly below the central bank policy rate at the time. The order book was 3.4x oversubscribed.\n\nSam: Strong investor demand. What is the capex outlook for the remainder of the year?\n\nElif: Full year capex guidance of TRY 18.5 billion is unchanged. We have spent TRY 11.2 billion through August, so the H2 run rate is manageable. The primary investment areas remain fibre densification and 5G trial infrastructure.\n\nSam: Good. Clean financials Elif. Let us touch base after the Q3 close.',
'Turk Telekom tracking above full year revenue guidance at TRY 66.8B through August with EBITDA margin at 42.3%. Solar deployment at 4,200 cell sites delivering 180 GWh annual energy savings. Net debt to EBITDA at 1.05x following a 3.4x oversubscribed TRY 5B domestic bond.',
'[]', 0, 'EBITDA margin, cost optimisation, solar energy, domestic bond, capex, fibre densification, 5G trials'),

('EC-2026-015', 'Turk Telekom', 'Burak Kaya', 'CIO', '2026-10-14 10:00:00', 2700, 'Matei Moprea', 'Due Diligence', 'Mixed',
'Burak, Matei here. Thank you for joining. As part of our annual technology review, I want to go through the IT landscape and also discuss the situation with the government contract.\n\nBurak: Good morning Matei. I will start with the positive developments and then address the contract situation. On the technology side, we completed the migration of our billing system to a cloud-native microservices architecture in Q3. The new system handles 120 million billing events per day with 99.99% uptime. Processing time for a billing cycle has reduced from 18 hours to 3 hours.\n\nMatei: That is a significant operational improvement. What about the customer-facing systems?\n\nBurak: Our digital channels are performing well. The Turk Telekom super-app has 14.2 million monthly active users, up 38% year on year. Self-service transactions through the app now represent 67% of all customer interactions, reducing our call centre volume by approximately 22%. We estimate the annual cost saving from this digital shift at TRY 680 million.\n\nMatei: Good. Now, let us discuss the contract situation I have been hearing about.\n\nBurak: Yes. As you may be aware, the Ministry of Education contract for school connectivity was due for renewal in September. This is a TRY 2.4 billion multi-year contract that we have held since 2019. I must inform you that the ministry has decided not to renew with us. They are moving to a multi-vendor model and our bid for the largest lot was not selected. We were notified formally last week.\n\nMatei: What is the revenue impact?\n\nBurak: The contract contributed approximately TRY 1.1 billion in annual revenue. We expect the full impact to begin in Q2 2027 when the current contract expires. We have identified approximately TRY 600 million in alternative enterprise pipeline opportunities that could partially offset the loss, but there will be a net negative impact.\n\nMatei: That is a material contract loss. I want a detailed impact assessment including the margin profile of this contract versus the replacement pipeline. One concern I would flag is whether this signals a broader shift in government procurement policy away from single-vendor awards.\n\nBurak: That is a valid concern. We are engaging with the government affairs team to understand the policy direction. I will have a comprehensive briefing document prepared by end of month.',
'Turk Telekom completed billing system cloud migration processing 120M events daily with 99.99% uptime. The super-app reached 14.2M MAUs with 67% self-service adoption saving TRY 680M annually. However, the TRY 2.4B Ministry of Education contract was not renewed, with an estimated TRY 1.1B annual revenue impact beginning Q2 2027.',
'["Key customer contract not renewed"]', 1, 'billing migration, super-app, digital self-service, government contract, Ministry of Education, revenue impact, multi-vendor'),

('EC-2026-016', 'LetterOne Technology', 'Michael Zhang', 'CEO', '2026-06-11 16:00:00', 2100, 'Jason Lai', 'Board Update', 'Positive',
'Michael, Jason here. Good afternoon. The board is looking for an update on the portfolio and any new investment opportunities in the pipeline. Can you walk me through the highlights?\n\nMichael: Thanks Jason. The portfolio is performing well. Our total technology portfolio is now valued at $2.8 billion across 14 active investments. The combined portfolio revenue grew 32% year on year in Q2, and three of our companies are now EBITDA positive for the first time.\n\nJason: Which three crossed into profitability?\n\nMichael: DataBridge, our enterprise data integration platform, hit EBITDA breakeven in May and is now generating approximately $1.2 million per month in positive EBITDA. CloudSecure, the cybersecurity company, turned profitable in April with a 6% EBITDA margin. And NovaPay, our fintech investment, reached profitability in June driven by the partnership with three major European banks.\n\nJason: Good momentum. What is the pipeline looking like?\n\nMichael: We are evaluating two new opportunities. The first is a Series C investment of $45 million in a quantum computing software company based in Munich. They have developed a middleware layer that allows enterprises to run algorithms on existing quantum hardware from multiple vendors. Revenue is growing at 180% year on year from a base of $12 million. The second opportunity is a growth equity deal in an Indian AI services company. They have built an automated testing platform using large language models that reduces software QA cycle times by 70%. Revenue run rate is $85 million.\n\nJason: Interesting opportunities. What are the key risks on each?\n\nMichael: For the quantum company, the primary risk is market timing. Enterprise quantum adoption is still nascent but the middleware approach reduces the barrier to experimentation. For the Indian AI company, the risk is competitive. There are several well-funded players in the AI testing space. However, their customer retention rate of 96% and net revenue retention of 142% suggest strong product-market fit.\n\nJason: I would like to see full investment memos on both by end of month. Let us schedule an investment committee review for early July.',
'LetterOne Technology portfolio valued at $2.8B across 14 investments with 32% combined revenue growth. Three portfolio companies reached EBITDA profitability including DataBridge, CloudSecure, and NovaPay. Two new deals under evaluation: a $45M quantum computing Series C and an Indian AI services growth equity opportunity.',
'[]', 0, 'portfolio valuation, EBITDA profitability, DataBridge, CloudSecure, NovaPay, quantum computing, AI services, investment pipeline'),

('EC-2026-017', 'LetterOne Technology', 'Anna Kowalski', 'CFO', '2026-08-20 11:00:00', 2400, 'Sam Drury', 'Ad-hoc', 'Negative',
'Anna, Sam here. I received the flash report this morning on the SynapticAI situation. Can you give me the full picture?\n\nAnna: Sam, thanks for calling. This is a situation that requires immediate attention. SynapticAI, which is our largest single technology investment at $320 million of deployed capital, is going through a significant management restructuring. The CEO and the CTO have both been terminated by the SynapticAI board following the discovery of material misrepresentations in the customer pipeline metrics that were presented during the last fundraise.\n\nSam: That is extremely serious. What specifically was misrepresented?\n\nAnna: The pipeline metrics presented to investors included approximately $40 million in customer commitments that were either verbal only with no signed letters of intent, or were conditional on product features that have not yet been built. The actual contracted pipeline is approximately $62 million versus the $102 million that was presented. This does not affect recognised revenue, which is $28 million on a trailing twelve-month basis and has been audited, but it materially changes the growth trajectory assumptions.\n\nSam: What is our exposure and what are the governance remedies?\n\nAnna: Our total exposure including follow-on investments is $320 million. Based on the revised pipeline, our internal valuation model suggests the fair value of our stake is between $180 million and $240 million, implying a potential write-down of $80 million to $140 million. The SynapticAI board has appointed an interim CEO from within the company, the VP of Engineering, who has strong technical credibility. They are also engaging an independent accounting firm to conduct a comprehensive review of all customer and pipeline data.\n\nSam: One concern I would flag is the reputational risk to LetterOne Technology if this becomes public. How are we managing that?\n\nAnna: We have engaged external communications advisers and our legal team is reviewing our position. We were investors relying on representations made by management, so our legal exposure should be limited. However, we are exploring all options including potential claims against the former executives. I recommend we convene an emergency investment committee meeting this week.\n\nSam: Agreed. Set that up for Thursday. I want the legal assessment, the updated valuation range, and the communications plan on the table.',
'SynapticAI management restructuring triggered by discovery of misrepresented customer pipeline metrics ($62M actual vs $102M presented). CEO and CTO terminated. LetterOne Technology exposure is $320M with potential write-down of $80-140M. Independent accounting review and legal assessment underway.',
'["Management team restructuring"]', 1, 'management restructuring, pipeline misrepresentation, write-down, valuation, governance, reputational risk, legal review'),

('EC-2026-018', 'LetterOne Technology', 'Raj Patel', 'CIO', '2026-10-12 15:00:00', 1500, 'Daniele Gualdani', 'Quarterly Review', 'Neutral',
'Raj, Daniele here. Good afternoon. I wanted to review the technology due diligence processes across the portfolio and discuss the cybersecurity audit findings that were circulated last week.\n\nRaj: Good afternoon Daniele. Let me start with the cybersecurity audit. We conducted independent security assessments across all 14 portfolio companies during Q3. The headline finding is that 11 of 14 companies meet our minimum security baseline, which is an improvement from 8 of 14 twelve months ago.\n\nDaniele: What about the three that do not meet the baseline?\n\nRaj: Two of the three are early-stage companies where the security function is still maturing. They have agreed to remediation plans that will bring them into compliance by Q1 2027. The third is SynapticAI, where the security posture assessment has been complicated by the ongoing management transition. We are waiting for the new leadership to stabilise before completing the assessment.\n\nDaniele: Understood. Given the SynapticAI situation, are we satisfied that there are no data integrity concerns beyond what has already been identified?\n\nRaj: We have deployed our own security operations team to assist with the forensic review. So far, we have found no evidence of data breaches or external security compromises. The issues are internal governance and reporting controls, not technical security. We expect the full forensic review to be completed by mid-November.\n\nDaniele: Good. Moving on, how is the portfolio-wide technology benchmarking exercise going?\n\nRaj: We completed the benchmarking of all 14 companies against approximately 50 technology maturity indicators. The portfolio average score is 68 out of 100, which is above the industry median of 61 for comparable venture and growth stage companies. The top performers are DataBridge at 84 and CloudSecure at 82. The areas where the portfolio is weakest overall are automated testing coverage and disaster recovery planning.\n\nDaniele: What are the recommendations?\n\nRaj: We are proposing a shared services model for disaster recovery where portfolio companies can leverage a common cloud infrastructure for backup and failover. The estimated cost is $2.4 million annually versus approximately $8 million if each company builds its own capability. We are also launching a testing automation toolkit that companies can adopt with minimal customisation.\n\nDaniele: Both sensible proposals. Please prepare a board paper with the business cases for the December meeting.',
'LetterOne Technology cybersecurity audit shows 11 of 14 portfolio companies meeting the minimum security baseline, up from 8 of 14 last year. Technology maturity benchmarking scored the portfolio at 68/100 versus industry median of 61. Shared services proposals for disaster recovery and testing automation would save approximately $5.6M annually.',
'[]', 0, 'cybersecurity audit, security baseline, technology benchmarking, SynapticAI forensic review, shared services, disaster recovery, testing automation');


-- ============================================================================
-- COMPANY DOCUMENTS
-- ============================================================================

INSERT INTO COMPANY_DOCUMENTS VALUES
-- Dia Group
('DOC-001', 'Dia Group', 'ESG Report', 'Dia Group Sustainability Report 2025', '2025-06-15', 'Dia Group', '@L1_DOCUMENT_STAGE/company-docs/dia-group/esg-report.pdf',
'Dia Group is pleased to present its 2025 Sustainability Report, outlining our continued commitment to environmental stewardship, social responsibility, and transparent governance across all operating markets. During the reporting period, Dia Group achieved a 22 percent reduction in Scope 1 and Scope 2 greenhouse gas emissions relative to our 2019 baseline, driven by energy efficiency upgrades across 4,200 stores in Spain, Portugal, Brazil, and Argentina. Our refrigeration modernization programme replaced legacy HFC systems with natural refrigerant alternatives in 680 locations, yielding a 31 percent decrease in fugitive emissions. On the social dimension, Dia Group expanded its supplier diversity programme to include over 1,400 small and medium enterprises, with 38 percent of procurement spend directed toward local producers within a 150-kilometre radius of distribution centres. Employee engagement scores rose to 74 percent, supported by enhanced parental leave policies and the rollout of mental health support services to all markets. Gender representation at senior management level reached 41 percent, exceeding our 2025 interim target of 38 percent. In supply chain governance, we completed third-party human rights due diligence assessments covering 92 percent of Tier 1 suppliers, identifying and remediating 14 instances of non-compliance with our Responsible Sourcing Code. Food waste reduction efforts diverted 18,000 tonnes of surplus product to food banks and charitable organisations, a 27 percent increase year-on-year. Looking ahead, Dia Group has committed to achieving net-zero Scope 1 and 2 emissions by 2035 and a 50 percent reduction in Scope 3 emissions by 2040.',
'Dia Group reduced greenhouse gas emissions by 22 percent against its 2019 baseline and expanded supplier diversity to over 1,400 SMEs. The company exceeded its gender representation target at senior management level and committed to net-zero Scope 1 and 2 emissions by 2035.',
'Positive', 'ESG, sustainability, emissions reduction, supply chain, diversity, food waste, net-zero', NULL),

('DOC-002', 'Dia Group', 'Annual Report', 'Dia Group Annual Report and Accounts 2025', '2025-04-28', 'Dia Group', '@L1_DOCUMENT_STAGE/company-docs/dia-group/annual-report.pdf',
'Dia Group delivered a resilient performance in fiscal year 2025, navigating persistent inflationary headwinds across its core markets while advancing its strategic transformation programme. Group net revenue reached EUR 7.2 billion, representing a 3.8 percent increase on a like-for-like basis compared to the prior year. Adjusted EBITDA improved to EUR 412 million, with the EBITDA margin expanding by 40 basis points to 5.7 percent, reflecting the cumulative impact of operational efficiency initiatives and private label penetration gains. In Spain, like-for-like sales growth of 4.6 percent was underpinned by the continued rollout of the proximity store format, with 320 refurbished locations contributing to higher basket sizes and improved footfall. The Brazilian operation posted local currency revenue growth of 8.1 percent, although currency translation effects moderated the contribution at group level. The company''s private label portfolio now accounts for 52 percent of total sales, up from 48 percent in the prior year, strengthening gross margins and reinforcing customer loyalty. Capital expenditure totalled EUR 285 million, directed primarily toward store modernisation, supply chain automation, and digital commerce capabilities. Net debt to EBITDA improved to 2.1 times from 2.4 times, reflecting disciplined cash management and working capital optimisation. The Board has proposed a dividend of EUR 0.08 per share, consistent with the progressive dividend policy. Looking to 2026, management expects low single-digit like-for-like growth, continued margin expansion, and further deleveraging toward the medium-term target of 1.8 times net debt to EBITDA.',
'Dia Group reported EUR 7.2 billion in net revenue for 2025 with adjusted EBITDA of EUR 412 million. Private label sales reached 52 percent of total revenue, and the company reduced its leverage ratio to 2.1 times net debt to EBITDA.',
'Positive', 'revenue, EBITDA, private label, margin expansion, deleveraging, Spain, Brazil, dividend', NULL),

('DOC-003', 'Dia Group', 'News Article', 'Dia Group Accelerates Store Closures in Argentina Amid Currency Turmoil', '2026-02-14', 'Financial Times', NULL,
'Dia Group, the Spanish discount retailer backed by LetterOne, is accelerating the closure of underperforming stores in Argentina as the country''s economic crisis continues to erode consumer purchasing power. The company confirmed on Thursday that it would shutter 85 additional locations in Buenos Aires province and Cordoba by the end of the second quarter, bringing total closures in the market to 210 since the restructuring programme began in late 2024. "The macroeconomic environment in Argentina remains exceptionally challenging," said a Dia Group spokesperson. "We are taking decisive action to protect the viability of our remaining operations while supporting affected employees through transition programmes." The closures will result in approximately 1,200 redundancies, though the company said it would offer redeployment opportunities where possible. Analysts at Santander noted that the Argentine operation had been loss-making for three consecutive quarters, with hyperinflation rendering pricing strategies increasingly difficult to sustain. "This is a necessary step," wrote equity analyst Maria Gonzalez in a client note. "The drag from Argentina has been masking genuine improvement in Dia''s core Spanish and Portuguese markets." LetterOne, the investment vehicle founded by Mikhail Fridman, acquired a controlling stake in Dia Group in 2019 and has since invested over EUR 1 billion in the retailer''s turnaround. Shares in Dia Group fell 3.2 percent on the news to trade at EUR 0.42 in Madrid.',
'Dia Group is closing 85 more stores in Argentina due to the ongoing economic crisis, bringing total closures to 210. The move will affect around 1,200 employees as the company seeks to stem losses in the hyperinflationary market.',
'Negative', 'Argentina, store closures, restructuring, LetterOne, hyperinflation, redundancies', 'https://www.ft.com/content/dia-group-argentina-closures-2026'),

-- Wintershall Dea
('DOC-004', 'Wintershall Dea', 'ESG Report', 'Wintershall Dea ESG and Climate Report 2025', '2025-07-22', 'Wintershall Dea', '@L1_DOCUMENT_STAGE/company-docs/wintershall-dea/esg-report.pdf',
'Wintershall Dea presents its 2025 ESG and Climate Report, detailing the company''s progress toward its ambition of achieving net-zero greenhouse gas emissions from its own operations by 2030. During the reporting period, Wintershall Dea reduced Scope 1 and Scope 2 emissions by 18 percent year-on-year, achieving an absolute reduction of 55 percent against the 2018 baseline. Methane intensity fell to 0.02 percent, well below the Oil and Gas Methane Partnership 2.0 target of 0.2 percent, through systematic leak detection and repair programmes across producing assets in Norway, Germany, and North Africa. The company invested EUR 180 million in carbon capture and storage projects, with the Greensand consortium in the Danish North Sea successfully injecting 120,000 tonnes of CO2 during the pilot phase. Wintershall Dea also advanced its hydrogen strategy, securing a 30 percent stake in BlueHyNow, a blue hydrogen production facility in Wilhelmshaven targeting 200,000 tonnes of annual output by 2028. On social metrics, the total recordable incident rate improved to 0.8 per million hours worked, a 15 percent improvement, and the proportion of women in leadership positions rose to 29 percent. Biodiversity action plans were implemented at all operated onshore production sites, including rewilding initiatives covering 240 hectares in the Weser-Ems region. Governance enhancements included the appointment of an independent sustainability advisory board and the integration of ESG metrics into 25 percent of executive variable compensation. The company remains committed to the Task Force on Climate-related Financial Disclosures framework and published its first TNFD-aligned nature disclosure.',
'Wintershall Dea achieved a 55 percent absolute reduction in Scope 1 and 2 emissions against its 2018 baseline and reduced methane intensity to 0.02 percent. The company invested EUR 180 million in CCS projects and advanced its blue hydrogen strategy through the BlueHyNow facility.',
'Positive', 'net-zero, carbon capture, methane, hydrogen, biodiversity, TCFD, TNFD, Norway', NULL),

('DOC-005', 'Wintershall Dea', 'Annual Report', 'Wintershall Dea Annual Report 2025', '2025-03-18', 'Wintershall Dea', '@L1_DOCUMENT_STAGE/company-docs/wintershall-dea/annual-report.pdf',
'Wintershall Dea delivered a solid financial performance in 2025 despite a volatile commodity price environment, with Brent crude averaging USD 78 per barrel compared to USD 82 in the prior year. Total hydrocarbon production averaged 385 thousand barrels of oil equivalent per day, a decline of 4 percent reflecting planned maintenance shutdowns in Norway and natural field decline in the southern North Sea. Revenue totalled EUR 5.8 billion, down 7 percent year-on-year, primarily reflecting lower realised gas prices in European markets. Adjusted EBITDAX reached EUR 3.1 billion with a margin of 53 percent, demonstrating the resilience of the low-cost production base. Operating cash flow of EUR 2.6 billion comfortably funded the EUR 1.1 billion capital expenditure programme, which was directed toward development drilling in Norway, appraisal activities in Mexico, and the continued buildout of the carbon management and hydrogen portfolio. The company completed the divestiture of its Russian-linked assets, resulting in a non-cash impairment charge of EUR 1.8 billion but removing the remaining geopolitical risk overhang from the balance sheet. Net debt to EBITDAX stood at 0.6 times, providing significant financial headroom. Wintershall Dea declared a total dividend of EUR 1.2 billion to shareholders. The outlook for 2026 anticipates stable production of 380 to 400 thousand barrels of oil equivalent per day, with capital expenditure of EUR 1.0 to 1.2 billion. The company continues to evaluate strategic options including a potential initial public offering, subject to market conditions and shareholder alignment.',
'Wintershall Dea generated EUR 5.8 billion in revenue and EUR 3.1 billion in adjusted EBITDAX in 2025 while completing the exit from Russian-linked assets. The company maintains a strong balance sheet at 0.6 times net debt to EBITDAX and continues to evaluate IPO options.',
'Mixed', 'production, EBITDAX, Norway, Russia divestiture, IPO, dividend, capital expenditure', NULL),

('DOC-006', 'Wintershall Dea', 'News Article', 'Wintershall Dea IPO Plans Revived as Energy Markets Stabilise', '2026-03-08', 'Reuters', NULL,
'Wintershall Dea, the German oil and gas producer jointly owned by BASF and LetterOne, has restarted preparations for an initial public offering on the Frankfurt Stock Exchange, according to three people familiar with the matter. The company has mandated Goldman Sachs, JPMorgan, and BNP Paribas to act as joint global coordinators for the listing, which could value the business at between EUR 14 billion and EUR 18 billion, the sources said. A decision on timing could come as early as September, with the fourth quarter of 2026 seen as the most likely window, one of the people added. The renewed IPO effort comes after previous attempts were shelved in 2022 and 2024 due to market volatility and complications arising from Wintershall Dea''s former Russian joint ventures, which have since been fully divested. "The strategic rationale for the IPO is stronger than ever," said an industry analyst at Bernstein. "They''ve cleaned up the portfolio, the balance sheet is in excellent shape, and European energy security concerns have given upstream producers a renewed social licence." BASF, which holds a 72.7 percent stake, has indicated it intends to reduce its holding to below 50 percent over time, while LetterOne is expected to remain a significant shareholder post-listing. Wintershall Dea reported adjusted EBITDAX of EUR 3.1 billion in 2025 and has production of approximately 385,000 barrels of oil equivalent per day across assets in Norway, Germany, North Africa, and Latin America.',
'Wintershall Dea has restarted IPO preparations with Goldman Sachs, JPMorgan, and BNP Paribas as coordinators, targeting a potential Q4 2026 listing. The company could be valued at EUR 14 to 18 billion following the completion of its Russian asset divestiture.',
'Positive', 'IPO, Frankfurt, BASF, LetterOne, valuation, energy, listing', 'https://www.reuters.com/business/wintershall-dea-ipo-plans-revived-2026-03-08'),

-- Holland & Barrett
('DOC-007', 'Holland & Barrett', 'ESG Report', 'Holland & Barrett Responsible Business Report 2025', '2025-09-10', 'Holland & Barrett', '@L1_DOCUMENT_STAGE/company-docs/holland-barrett/esg-report.pdf',
'Holland & Barrett is proud to publish its 2025 Responsible Business Report, reflecting our deep commitment to health, wellness, and sustainability. As the largest health and wellness retailer in Europe, we recognise our responsibility to minimise environmental impact while promoting accessible nutrition and wellbeing for all customers. During the year, Holland & Barrett achieved a 28 percent reduction in Scope 1 and 2 emissions against a 2020 baseline, driven by the transition to 100 percent renewable electricity across all 1,150 UK and Ireland stores and the electrification of 60 percent of our delivery fleet. Packaging sustainability remained a priority, with 84 percent of own-brand product packaging now recyclable, reusable, or compostable, up from 71 percent in 2024. We eliminated 320 tonnes of single-use plastic through format redesign and refill station expansion, with refill options now available in 180 stores. On social impact, Holland & Barrett launched the Wellness for All Foundation, committing GBP 5 million over three years to address nutritional inequality in underserved communities across the United Kingdom. The programme delivered 42,000 free wellness consultations and distributed 85,000 vitamin supplement packs to families referred through NHS partnerships. Workforce diversity initiatives increased ethnic minority representation at management level to 18 percent, while the gender pay gap narrowed to 4.2 percent. Supply chain transparency was enhanced through the adoption of blockchain-based traceability for key ingredient categories including turmeric, omega-3 fish oils, and whey protein, covering 65 percent of own-brand supplement volume. Third-party audits of manufacturing partners identified two instances requiring corrective action, both of which were resolved within the reporting period.',
'Holland & Barrett reduced emissions by 28 percent against its 2020 baseline and transitioned all UK stores to renewable electricity. The company launched the Wellness for All Foundation with GBP 5 million in funding and expanded packaging recyclability to 84 percent of own-brand products.',
'Positive', 'sustainability, packaging, renewable energy, wellness, diversity, supply chain, blockchain traceability', NULL),

('DOC-008', 'Holland & Barrett', 'Annual Report', 'Holland & Barrett International Annual Report 2025', '2025-05-12', 'Holland & Barrett', '@L1_DOCUMENT_STAGE/company-docs/holland-barrett/annual-report.pdf',
'Holland & Barrett International delivered an encouraging performance in fiscal year 2025, with group revenue increasing 6.2 percent to GBP 1.84 billion on a constant currency basis. The United Kingdom, which represents approximately 72 percent of group revenue, recorded like-for-like growth of 5.4 percent, supported by strong demand for sports nutrition, immunity supplements, and plant-based food products. International markets contributed GBP 515 million in revenue, with the Netherlands and Belgium performing particularly well following the integration of acquired franchise operations. Adjusted EBITDA reached GBP 198 million, representing a margin of 10.8 percent, an improvement of 60 basis points year-on-year driven by supply chain optimisation, improved private label mix, and the scaling of digital commerce operations. Online sales accounted for 31 percent of group revenue, up from 27 percent, with the replatformed e-commerce site and mobile application delivering a 22 percent increase in average order value. The company invested GBP 95 million in capital expenditure, primarily directed toward store refurbishments under the new wellness concept format, fulfilment centre automation, and technology infrastructure. The wellness concept stores, which feature in-store consultation rooms, diagnostic testing services, and expanded food-to-go offerings, now number 240 locations and consistently deliver 15 to 20 percent higher revenue per square foot than the legacy format. Net debt stood at GBP 620 million, equating to 3.1 times adjusted EBITDA, with the company on track to reduce leverage below 2.5 times by end of 2027 through organic cash generation. Holland & Barrett''s owner, LetterOne, has signalled its intention to explore strategic options for the business, including a potential sale or public listing, in the medium term.',
'Holland & Barrett grew group revenue by 6.2 percent to GBP 1.84 billion in 2025, with online sales reaching 31 percent of total revenue. Adjusted EBITDA improved to GBP 198 million and the company is pursuing deleveraging toward 2.5 times net debt to EBITDA by 2027.',
'Positive', 'revenue growth, e-commerce, wellness, EBITDA, UK retail, private label, LetterOne', NULL),

('DOC-009', 'Holland & Barrett', 'News Article', 'Holland & Barrett Recalls Contaminated Supplement Line After Customer Complaints', '2026-01-22', 'The Guardian', NULL,
'Holland & Barrett has recalled a range of own-brand magnesium supplements after laboratory testing confirmed elevated levels of lead contamination in batches manufactured between August and November 2025. The recall affects approximately 145,000 units of Holland & Barrett Magnesium Citrate 200mg tablets sold across the United Kingdom, Ireland, and the Netherlands. The Food Standards Agency issued an alert on Wednesday urging customers who had purchased the affected products to return them to any store for a full refund. "We identified this issue through our routine quality assurance testing and immediately initiated a voluntary recall," said a Holland & Barrett spokesperson. "Customer safety is our absolute priority and we are conducting a thorough investigation with our manufacturing partner." The contamination has been traced to a raw material supplier in India, and Holland & Barrett confirmed it has suspended the supplier pending the outcome of an independent audit. No adverse health effects have been reported, though the FSA advised that prolonged consumption of lead above permitted levels could pose risks to kidney function and neurological health. Consumer rights groups criticised the retailer for what they described as an insufficient response. "Three months elapsed between manufacture and detection, which raises serious questions about the adequacy of Holland & Barrett''s incoming materials testing regime," said Richard Chadwick, director of the Supplement Safety Alliance. Shares in parent company LetterOne Holdings are privately held and not publicly traded. Industry analysts noted the recall was unlikely to have a material financial impact but could damage brand trust in a category where provenance and purity are key purchasing drivers.',
'Holland & Barrett recalled 145,000 units of magnesium supplements after lead contamination was found in batches from an Indian supplier. The Food Standards Agency issued a consumer alert and the retailer suspended the supplier pending an independent audit.',
'Negative', 'recall, contamination, food safety, supplements, FSA, supply chain, brand trust', 'https://www.theguardian.com/business/2026/jan/22/holland-barrett-supplement-recall-lead'),

-- Veon
('DOC-010', 'Veon', 'ESG Report', 'Veon Ltd ESG Impact Report 2025', '2025-08-05', 'Veon', '@L1_DOCUMENT_STAGE/company-docs/veon/esg-report.pdf',
'Veon Ltd publishes its 2025 ESG Impact Report, demonstrating the company''s commitment to connecting emerging markets responsibly and sustainably. As a leading digital operator serving over 160 million customers across six high-growth markets including Pakistan, Bangladesh, Ukraine, and Kazakhstan, Veon occupies a unique position at the intersection of digital inclusion and sustainable development. During the reporting period, Veon expanded 4G population coverage to 78 percent across its footprint, up from 69 percent, enabling access to digital financial services, telemedicine, and e-learning platforms for an estimated 14 million additional users. The company''s JazzCash mobile financial services platform in Pakistan processed over USD 45 billion in transaction volume, providing access to formal financial services for 38 million users, the majority of whom had no prior banking relationship. On environmental stewardship, Veon reduced energy consumption per terabyte of data traffic by 32 percent through network modernisation, the deployment of energy-efficient radio equipment, and the expansion of hybrid solar-diesel power solutions at 4,800 off-grid tower sites. Absolute Scope 1 and 2 emissions declined by 12 percent despite a 41 percent increase in data traffic, reflecting the decoupling of growth from environmental impact. Gender diversity in leadership reached 26 percent, with targeted recruitment and sponsorship programmes in place to achieve the 30 percent target by 2027. Veon invested USD 18 million in digital literacy programmes across its markets, training 1.2 million individuals in basic digital skills, cybersecurity awareness, and online safety. The company published its inaugural SASB-aligned disclosure and received a B rating from CDP for climate change, an improvement from B-minus in the prior year.',
'Veon expanded 4G coverage to 78 percent of its population footprint and enabled digital financial access for 38 million JazzCash users in Pakistan. The company reduced energy consumption per terabyte by 32 percent while investing USD 18 million in digital literacy programmes.',
'Positive', 'digital inclusion, 4G coverage, mobile finance, JazzCash, energy efficiency, CDP, SASB', NULL),

('DOC-011', 'Veon', 'Annual Report', 'Veon Ltd Annual Report 2025', '2025-04-02', 'Veon', '@L1_DOCUMENT_STAGE/company-docs/veon/annual-report.pdf',
'Veon Ltd reported a transformative year in 2025, with strong operational momentum across its portfolio of digital operators in high-growth frontier markets. Group revenue reached USD 4.1 billion, representing organic growth of 18 percent in local currency terms, though reported growth was moderated to 9 percent by currency translation effects, primarily from the Pakistani rupee and Bangladeshi taka. Adjusted EBITDA of USD 1.72 billion reflected a margin of 42 percent, up from 39.8 percent in the prior year, driven by the scaling of digital services, network sharing agreements, and continued cost discipline. The company''s digital operator strategy yielded significant results, with multiplay users comprising customers who use two or more of Veon''s digital services including connectivity, financial services, entertainment, and health platforms now representing 34 percent of the customer base, up from 26 percent. These multiplay users generate average revenue per user approximately 2.3 times higher than single-service subscribers. In Pakistan, Jazz delivered revenue growth of 24 percent in local currency, with JazzCash contributing USD 112 million in revenue. Banglalink in Bangladesh grew revenue by 19 percent, supported by data monetisation and the launch of digital health services. Kyivstar in Ukraine demonstrated remarkable resilience, maintaining 95 percent network uptime despite ongoing conflict conditions and contributing USD 680 million in revenue. Capital expenditure of USD 920 million was directed toward 4G network expansion, 5G trials in Kazakhstan, and technology platform investments. Net debt to EBITDA improved to 2.3 times from 2.7 times. The company repurchased USD 150 million of shares during the year and proposed a dividend of USD 0.40 per share, the first dividend since 2020.',
'Veon achieved USD 4.1 billion in revenue with 18 percent organic local currency growth and expanded its EBITDA margin to 42 percent. The digital operator strategy drove multiplay user penetration to 34 percent and the company reinstated dividends at USD 0.40 per share.',
'Positive', 'revenue growth, EBITDA, digital operator, Pakistan, Ukraine, Bangladesh, dividend, 5G', NULL),

('DOC-012', 'Veon', 'News Article', 'Veon Faces Regulatory Pressure Over Bangladesh Data Practices', '2026-04-18', 'Bloomberg', NULL,
'Veon Ltd is facing mounting regulatory scrutiny in Bangladesh after the country''s telecommunications regulator launched a formal investigation into the data collection and sharing practices of Banglalink, Veon''s local operating subsidiary. The Bangladesh Telecommunication Regulatory Commission said in a statement on Thursday that it had received complaints from consumer advocacy groups alleging that Banglalink had shared user location data and browsing histories with third-party advertising networks without obtaining adequate consent. The investigation could result in fines of up to BDT 500 million, equivalent to approximately USD 4.5 million, and the imposition of enhanced data protection requirements. "We take data privacy extremely seriously and are cooperating fully with the BTRC''s investigation," a Veon spokesperson said. "Banglalink operates in compliance with all applicable local regulations and we are confident that the investigation will confirm this." However, privacy researchers at the Digital Rights Foundation in Islamabad noted that regulatory frameworks in several of Veon''s markets lack the granularity of the European Union''s General Data Protection Regulation, creating ambiguity around consent standards. "The real risk for Veon is reputational rather than financial," said telecoms analyst James Westbrook at New Street Research. "Frontier market regulators are becoming increasingly sophisticated, and operators can no longer assume that lighter-touch regimes will persist indefinitely." Veon shares traded 2.1 percent lower in Amsterdam following the announcement. The company operates in six markets and serves over 160 million customers, with Bangladesh representing its second-largest market by subscriber count after Pakistan.',
'Bangladesh''s telecom regulator has opened a formal investigation into Banglalink''s data sharing practices, alleging user data was shared with advertisers without proper consent. Veon said it is cooperating fully and believes Banglalink operates in compliance with local regulations.',
'Negative', 'data privacy, regulation, Bangladesh, Banglalink, BTRC, compliance, GDPR', 'https://www.bloomberg.com/news/articles/2026-04-18/veon-bangladesh-data-investigation'),

-- Turk Telekom
('DOC-013', 'Turk Telekom', 'ESG Report', 'Turk Telekom Integrated Sustainability Report 2025', '2025-10-01', 'Turk Telekom', '@L1_DOCUMENT_STAGE/company-docs/turk-telekom/esg-report.pdf',
'Turk Telekom presents its 2025 Integrated Sustainability Report, outlining progress against the company''s comprehensive ESG framework aligned with Turkey''s national development priorities and the United Nations Sustainable Development Goals. As the leading integrated telecommunications operator in Turkey with over 52 million subscribers, Turk Telekom has a significant role in advancing digital transformation, economic participation, and environmental sustainability across the country. During the reporting period, Turk Telekom achieved a 19 percent reduction in Scope 1 and 2 emissions intensity per unit of data traffic, supported by the deployment of energy-efficient network equipment and the procurement of 480 GWh of renewable energy certificates. The company installed solar panels at 320 exchange and base station sites, generating 28 GWh of clean energy and avoiding 14,000 tonnes of CO2 emissions. Water consumption across technical facilities was reduced by 11 percent through closed-loop cooling systems and rainwater harvesting at eight major data centres. Turk Telekom''s digital inclusion programmes connected 8,400 schools in rural and underserved provinces with high-speed broadband, benefiting approximately 2.1 million students. The company also expanded its accessible technology portfolio, providing specialised devices and applications for customers with visual, auditory, and motor disabilities, reaching 185,000 users. Workforce safety performance improved with the lost-time injury frequency rate declining to 1.1 per million hours worked. Female representation across the workforce stood at 28 percent, with a dedicated programme targeting 35 percent by 2030. Turk Telekom published a comprehensive climate risk assessment in accordance with TCFD recommendations, identifying physical risks to network infrastructure from extreme weather events as a priority area for adaptation investment.',
'Turk Telekom reduced emissions intensity by 19 percent per unit of data traffic and procured 480 GWh in renewable energy certificates. The company connected 8,400 rural schools with broadband and expanded accessible technology services to 185,000 users with disabilities.',
'Positive', 'digital inclusion, renewable energy, education, accessibility, TCFD, emissions intensity, Turkey', NULL),

('DOC-014', 'Turk Telekom', 'Annual Report', 'Turk Telekom Group Annual Report 2025', '2025-03-28', 'Turk Telekom', '@L1_DOCUMENT_STAGE/company-docs/turk-telekom/annual-report.pdf',
'Turk Telekom Group reported robust financial results for 2025, demonstrating the strength of its integrated fixed-mobile convergence strategy in an inflationary operating environment. Consolidated revenue reached TRY 98.4 billion, an increase of 52 percent year-on-year in nominal terms, significantly outpacing the Turkish consumer price index increase of 38 percent over the same period. In US dollar terms, revenue was approximately USD 3.0 billion at the average exchange rate for the period. Adjusted EBITDA totalled TRY 43.2 billion, implying a margin of 43.9 percent, a 180 basis point improvement reflecting effective cost management and the increasing contribution of higher-margin digital services. The fixed broadband segment delivered revenue growth of 48 percent, driven by fibre-to-the-home migration and ARPU uplift from speed tier upgrades. Fibre subscribers reached 14.8 million, representing 71 percent of the fixed broadband base, with average download speeds increasing to 82 Mbps. The mobile segment grew revenue by 58 percent, supported by 4.5G subscriber growth and the expansion of digital value-added services including TV Plus, Lifebox cloud storage, and BiP messaging. Capital expenditure of TRY 22.1 billion was invested in network expansion, 5G readiness preparations, and data centre capacity, representing a capex-to-revenue ratio of 22.5 percent. Free cash flow generation remained healthy at TRY 12.8 billion, supporting debt servicing and dividend payments. Net debt to EBITDA declined to 1.4 times from 1.6 times. The Turkish government''s anticipated 5G spectrum auction, now expected in the second half of 2026, remains a key strategic priority. Turk Telekom is well positioned to participate and has allocated provisional capital of TRY 15 billion for spectrum acquisition.',
'Turk Telekom achieved TRY 98.4 billion in revenue, a 52 percent nominal increase significantly exceeding inflation. EBITDA margin improved to 43.9 percent with fibre subscribers reaching 14.8 million, and the company is preparing for Turkey''s anticipated 5G spectrum auction.',
'Mixed', 'revenue, EBITDA, fibre broadband, 5G, Turkey, inflation, spectrum auction, convergence', NULL),

('DOC-015', 'Turk Telekom', 'News Article', 'Turkey''s 5G Auction Delay Clouds Turk Telekom''s Growth Outlook', '2026-06-30', 'The Economist', NULL,
'Turkey''s long-awaited 5G spectrum auction, originally planned for the first half of 2026, has been postponed indefinitely amid disagreements between the government and the country''s three mobile operators over pricing, coverage obligations, and technology neutrality conditions. The delay is a particular setback for Turk Telekom, which has invested heavily in 5G readiness and positioned next-generation connectivity as a central pillar of its growth strategy. The Information and Communication Technologies Authority, Turkey''s telecoms regulator, confirmed the postponement in a brief statement, citing "ongoing consultations with stakeholders on auction design parameters." Industry sources say the primary sticking point is the government''s insistence on a minimum reserve price of USD 2.8 billion for a nationwide 3.5 GHz licence, which operators argue is excessive given Turkey''s macroeconomic conditions. "At that price point, the return on investment arithmetic simply does not work for any of the three operators," said Emre Yilmaz, a telecoms analyst at Is Investment in Istanbul. "The government needs to find a balance between maximising auction revenue and ensuring that operators can fund the subsequent network buildout." Turk Telekom, which is 55 percent owned by the Turkish Wealth Fund and counts LetterOne as a significant indirect stakeholder through its partnership structure, had allocated TRY 15 billion for spectrum acquisition. Chief executive Umit Onal told investors at a conference in May that 5G would enable Turk Telekom to capture new enterprise revenue streams in areas including industrial automation, autonomous logistics, and smart city infrastructure. Without a clear timeline, those ambitions remain on hold.',
'Turkey''s 5G spectrum auction has been postponed indefinitely over pricing disagreements between the government and operators. Turk Telekom, which had allocated TRY 15 billion for the auction, faces a setback to its next-generation connectivity growth strategy.',
'Negative', '5G, spectrum auction, Turkey, regulation, Turk Telekom, ICTA, pricing', 'https://www.economist.com/business/2026/06/30/turkeys-5g-auction-delay'),

-- LetterOne Technology
('DOC-016', 'LetterOne Technology', 'ESG Report', 'LetterOne Technology ESG Framework and Progress Report 2025', '2025-11-15', 'LetterOne Technology', '@L1_DOCUMENT_STAGE/company-docs/letterone-technology/esg-report.pdf',
'LetterOne Technology, the technology investment arm of LetterOne Group, is pleased to present its inaugural ESG Framework and Progress Report for 2025. As an investor in high-growth technology companies across enterprise software, cybersecurity, health technology, and artificial intelligence, LetterOne Technology recognises its responsibility to embed environmental, social, and governance considerations into both investment decision-making and portfolio company engagement. During the reporting period, LetterOne Technology formalised its Responsible Investment Policy, integrating ESG due diligence into 100 percent of new investment evaluations. The framework assesses prospective investments against 42 criteria spanning carbon footprint, data privacy practices, workforce diversity, board composition, and ethical AI deployment. Of the seven investment opportunities evaluated in 2025, two were declined on ESG grounds, one due to inadequate data protection governance and another due to workforce practices that did not meet the policy''s minimum standards. Across the existing portfolio of 14 technology companies, LetterOne Technology conducted annual ESG assessments and established improvement roadmaps for each. Aggregated portfolio metrics show that 79 percent of portfolio companies have adopted science-based emissions targets, 86 percent have published diversity and inclusion policies, and 71 percent have implemented responsible AI governance frameworks. Energy consumption across portfolio company data centre operations was reduced by 14 percent per unit of compute through efficiency gains and the transition to renewable-powered hosting facilities. LetterOne Technology also launched the L1 Tech for Good initiative, committing USD 10 million over five years to fund early-stage ventures addressing healthcare access, climate adaptation, and digital literacy in underserved markets. The programme made its first three investments during the year, supporting companies in telemedicine, agricultural AI, and accessible education technology.',
'LetterOne Technology formalised its ESG investment framework in 2025, integrating 42 criteria into all new investment evaluations and declining two opportunities on ESG grounds. Portfolio-wide metrics show 79 percent adoption of science-based targets and the launch of a USD 10 million Tech for Good initiative.',
'Positive', 'responsible investment, ESG framework, portfolio, AI governance, diversity, Tech for Good', NULL),

('DOC-017', 'LetterOne Technology', 'Annual Report', 'LetterOne Technology Annual Review 2025', '2025-06-30', 'LetterOne Technology', '@L1_DOCUMENT_STAGE/company-docs/letterone-technology/annual-report.pdf',
'LetterOne Technology presents its Annual Review for 2025, covering the performance and strategic development of its portfolio of technology investments. The division manages a portfolio valued at approximately USD 4.2 billion across 14 companies spanning enterprise software, cybersecurity, health technology, financial technology, and artificial intelligence infrastructure. During the year, LetterOne Technology deployed USD 680 million in new and follow-on investments, including a USD 220 million lead investment in Nexus AI, a Series C enterprise artificial intelligence platform company, and a USD 160 million growth equity investment in CyberShield Technologies, a zero-trust security architecture provider. Portfolio company aggregate revenue grew 28 percent year-on-year to USD 2.8 billion, with recurring revenue representing 74 percent of the total. The portfolio generated aggregate adjusted EBITDA of USD 340 million, with six of the fourteen companies achieving positive free cash flow for the first time. Two portfolio companies completed successful exits during the year. The sale of DataMesh Analytics to a strategic acquirer generated proceeds of USD 890 million, representing a 4.1 times multiple on invested capital. Additionally, CloudPeak Infrastructure completed an initial public offering on the NASDAQ, with LetterOne Technology retaining a 22 percent stake valued at USD 1.1 billion at the offering price. Net realised and unrealised gains across the portfolio totalled USD 1.4 billion, reflecting a net internal rate of return of 24 percent since inception. Looking ahead, LetterOne Technology sees significant opportunities in the convergence of artificial intelligence and vertical industry applications, particularly in healthcare, financial services, and energy transition. The division expects to deploy between USD 500 million and USD 800 million in 2026, with a focus on Series B to growth-stage companies in North America and Europe.',
'LetterOne Technology manages a USD 4.2 billion portfolio that delivered 28 percent aggregate revenue growth and a 24 percent net IRR since inception. The division completed two exits generating over USD 1.9 billion in combined value and deployed USD 680 million in new investments.',
'Positive', 'technology investment, portfolio, AI, cybersecurity, IPO, exits, IRR, growth equity', NULL),

('DOC-018', 'LetterOne Technology', 'News Article', 'LetterOne Technology Backs AI Healthcare Startup in USD 220m Round', '2026-05-10', 'Wall Street Journal', NULL,
'LetterOne Technology, the technology investment arm of the LetterOne Group conglomerate, led a USD 220 million Series C funding round for Nexus AI, a San Francisco-based startup developing artificial intelligence tools for clinical decision support and drug discovery. The round, which also included participation from existing investors Andreessen Horowitz and GV, values Nexus AI at approximately USD 1.8 billion, according to people familiar with the transaction. The investment represents LetterOne Technology''s largest single deployment in the healthcare AI sector and underscores a broader strategic push into the intersection of artificial intelligence and life sciences. "Nexus AI has built what we believe is the most sophisticated clinical reasoning engine in the market today," said a LetterOne Technology managing director. "Their platform has the potential to meaningfully improve diagnostic accuracy and accelerate the drug discovery timeline, both of which represent enormous value creation opportunities." Nexus AI''s platform uses large language models fine-tuned on proprietary datasets comprising over 200 million anonymised patient records and 40 million published research papers. The company counts 14 of the top 20 US hospital systems as customers and recently signed partnerships with two of the five largest pharmaceutical companies for computational drug target identification. Chief executive Dr. Sarah Chen said the funding would be used to expand into European markets, deepen the drug discovery pipeline, and hire 200 additional machine learning engineers. "This capital positions us to scale our impact from thousands to millions of clinical interactions per day," Dr. Chen said. LetterOne Technology has deployed over USD 680 million in technology investments in the past 12 months, with a focus on enterprise AI, cybersecurity, and health technology.',
'LetterOne Technology led a USD 220 million Series C round for AI healthcare startup Nexus AI, valuing the company at USD 1.8 billion. The investment supports Nexus AI''s expansion into European markets and its clinical decision support and drug discovery platform.',
'Positive', 'AI, healthcare, startup, venture capital, Nexus AI, drug discovery, clinical AI, Series C', 'https://www.wsj.com/articles/letterone-technology-nexus-ai-healthcare-funding-2026');

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
UNION ALL SELECT 'EXECUTIVE_CALLS', COUNT(*) FROM EXECUTIVE_CALLS
UNION ALL SELECT 'COMPANY_DOCUMENTS', COUNT(*) FROM COMPANY_DOCUMENTS
ORDER BY 1;
