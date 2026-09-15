-- Sprint 6 task 6.9 — verify all Phase 3 v3 performance indexes.
-- Run against the production/test database:
--   psql "<DATABASE_URL>" -f scripts/verify-indexes.sql
--
-- The sprint spec calls the status index "idx_budgets_status"; Prisma
-- auto-generated it as "Budget_status_idx". It IS present — the name differs.

\echo '=================================================================='
\echo '1. Index inventory (expected names shown)'
\echo '=================================================================='
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

\echo ''
\echo '=================================================================='
\echo '2. Transaction list screen:  WHERE userId ORDER BY date DESC LIMIT 20'
\echo '   Expect: Index Scan Backward using Transaction_userId_idx/date_idx'
\echo '=================================================================='
EXPLAIN ANALYZE
SELECT * FROM "Transaction"
WHERE "userId" = '__nonexistent__'
ORDER BY "date" DESC
LIMIT 20;

\echo ''
\echo '=================================================================='
\echo '3. recalculateSpent aggregate:  EXPENSE per category in a month'
\echo '   Expect: Index Scan using Transaction_userId_idx'
\echo '=================================================================='
EXPLAIN ANALYZE
SELECT "categoryId", SUM("amount")
FROM "Transaction"
WHERE "userId" = '__nonexistent__'
  AND "type" = 'EXPENSE'
  AND "categoryId" = '__nonexistent__'
  AND "date" >= '2026-01-01'
  AND "date" <= '2026-01-31'
GROUP BY "categoryId";

\echo ''
\echo '=================================================================='
\echo '4. Budgets for a period:  WHERE userId + periodMonth'
\echo '   Expect: Index Scan using Budget_userId_periodMonth_idx'
\echo '=================================================================='
EXPLAIN ANALYZE
SELECT * FROM "Budget"
WHERE "userId" = '__nonexistent__'
  AND "periodMonth" = '2026-01';

\echo ''
\echo '=================================================================='
\echo '5. Budget status filter:  WHERE status'
\echo '   Expect: Index Scan using Budget_status_idx'
\echo '   (the sprint spec refers to this as idx_budgets_status)'
\echo '=================================================================='
EXPLAIN ANALYZE
SELECT * FROM "Budget"
WHERE "status" = 'ACTIVE';

\echo ''
\echo '=================================================================='
\echo '6. Dashboard period aggregates (income/expense by month)'
\echo '   Expect: Index Scan using Transaction_userId_idx / Transaction_date_idx'
\echo '=================================================================='
EXPLAIN ANALYZE
SELECT SUM("amount") FROM "Transaction"
WHERE "userId" = '__nonexistent__'
  AND "type" = 'INCOME'
  AND "date" >= '2026-01-01'
  AND "date" <= '2026-01-31';

\echo 'Done.'