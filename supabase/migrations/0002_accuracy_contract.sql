-- ============================================================================
--  0002 — ACCURACY REPRESENTATION CONTRACT
-- ============================================================================
--
--  TypeSense stores every accuracy value as a RATIO BETWEEN 0 AND 1:
--
--      100.00% = 1.0
--       96.7%  = 0.967
--       71.43% = 0.7142857...
--        0%    = 0.0
--
--  Affected columns / payloads:
--    • public.sessions.metrics      jsonb  — accuracy, finalAccuracy,
--                                            correctionRate  → ratio 0..1
--    • public.sessions.timeline     jsonb  — sample.accuracy  → ratio 0..1
--    • public.lesson_progress.best_accuracy  real             → ratio 0..1
--
--  The single ×100 conversion for display happens in the app
--  (src/lib/accuracy.ts: accuracyToPercent / formatAccuracy). Never store
--  0..100 percentages here — the UI multiplies exactly once.
--
--  History: before this migration the app wrote 0..100 percentages into
--  best_accuracy. Any such row is converted below. Sessions metrics jsonb
--  written by old builds are normalised on read by the client
--  (src/stores/sessionsStore.ts migrate + src/services/sync.ts).
-- ============================================================================

-- 1. legacy 0..100 percentages → ratio 0..1 (guarded so it is safe to re-run)
update public.lesson_progress
   set best_accuracy = best_accuracy / 100.0
 where best_accuracy > 1;

-- 2. enforce the contract going forward
alter table public.lesson_progress
  drop constraint if exists lesson_progress_best_accuracy_check;
alter table public.lesson_progress
  add constraint lesson_progress_best_accuracy_check
  check (best_accuracy between 0 and 1);
