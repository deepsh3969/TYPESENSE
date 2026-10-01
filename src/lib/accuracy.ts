/**
 * ============================================================================
 *  TYPESENSE — CANONICAL ACCURACY CONTRACT (single source of truth)
 * ============================================================================
 *
 *  Internally every accuracy / error-rate / correction-rate value is a
 *  RATIO BETWEEN 0 AND 1:
 *
 *      100.00%  = 1
 *      96.7%    = 0.967
 *      88.5%    = 0.885
 *      71.43%   = 0.7142857...
 *      0%       = 0
 *
 *  The multiplication by 100 happens EXACTLY ONCE, at the presentation
 *  layer, inside this file (`accuracyToPercent` / `formatAccuracy`).
 *  Never write `accuracy * 100` (or `${accuracy}%`) in a component —
 *  call `formatAccuracy(accuracy)` instead. That is how bugs like
 *  "7140%" / "10000%" become impossible.
 *
 *  Storage precision: persisted ratios are rounded with `roundAccuracy`
 *  (4 decimals = 0.01% resolution — plenty for 2-decimal display).
 *
 *  Legacy data: values > 1 are old 0–100 percentages (or corrupted
 *  double-converted numbers such as 7140). `toAccuracyRatio` normalises
 *  them on read; it is idempotent for already-canonical ratios.
 * ============================================================================
 */

/**
 * THE accuracy formula. Returns a ratio in [0, 1].
 *
 *   correct   = attempts − errors
 *   accuracy  = correct / attempts        (0 when there are no attempts)
 *
 * calculateAccuracy(7, 2)  → 0.7142857142857143   (displays as 71.43%)
 * calculateAccuracy(5, 0)  → 1                    (displays as 100.00%)
 * calculateAccuracy(0, 0)  → 0                    (never NaN/Infinity/100%)
 */
export function calculateAccuracy(attempts: number, errors: number): number {
  if (!Number.isFinite(attempts) || attempts <= 0) return 0
  const err = Number.isFinite(errors) ? Math.max(0, errors) : 0
  const correct = Math.max(0, attempts - err)
  return correct / attempts
}

/**
 * Complement of accuracy: `errors / attempts`, ratio in [0, 1].
 * When both values are computed from the same attempts:
 * accuracy + errorRate === 1.
 */
export function calculateErrorRate(attempts: number, errors: number): number {
  if (!Number.isFinite(attempts) || attempts <= 0) return 0
  const err = Number.isFinite(errors) ? Math.max(0, errors) : 0
  return Math.min(1, err / attempts)
}

/**
 * Correction rate = share of mistakes that were fixed with backspace:
 *
 *   corrections / (corrections + uncorrectedErrors)   → ratio in [0, 1]
 *
 * 0 when there were no mistakes at all (no corrections to credit).
 * This is a SEPARATE metric from accuracy — never label it "accuracy".
 */
export function calculateCorrectionRate(corrections: number, uncorrectedErrors: number): number {
  const fixed = Number.isFinite(corrections) ? Math.max(0, corrections) : 0
  const left = Number.isFinite(uncorrectedErrors) ? Math.max(0, uncorrectedErrors) : 0
  const total = fixed + left
  if (total <= 0) return 0
  return fixed / total
}

/**
 * THE one and only ratio → percentage conversion.
 *
 * Works on any ratio-scale number, including deltas (a −2pp change is
 * `accuracyToPercent(-0.02)` → −2), so it deliberately does not clamp.
 * Accuracy values themselves are already clamped to [0, 1] at the source.
 *
 * accuracyToPercent(0.7142857) → 71.43   (default 2 decimals)
 */
export function accuracyToPercent(ratio: number, decimals = 2): number {
  if (!Number.isFinite(ratio)) return 0
  const factor = 10 ** Math.max(0, Math.min(10, decimals))
  return Math.round(ratio * 100 * factor) / factor
}

/**
 * Canonical storage rounding: clamp to [0, 1] and keep 4 decimals
 * (0.0001 = 0.01% resolution).
 */
export function roundAccuracy(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0
  const clamped = Math.min(1, Math.max(0, ratio))
  return Math.round(clamped * 10000) / 10000
}

/**
 * Normalises a possibly-legacy accuracy number to a ratio in [0, 1].
 *
 *   95      → 0.95     (old 0–100 percentage)
 *   71.4    → 0.714
 *   7140    → 0.714    (old double-converted corruption, divided until ≤ 1)
 *   0.967   → 0.967    (already canonical — idempotent)
 *   0 / −3  → 0
 *
 * Idempotent: applying it twice never changes a canonical ratio.
 * (Known limitation: a legacy value below 1 — i.e. a real accuracy under
 * 1% — is indistinguishable from a ratio. That cannot occur in practice:
 * the old code only ever produced 0 or ≥ realistic percentages.)
 */
export function toAccuracyRatio(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  let v = value
  while (v > 1) v /= 100
  return v
}

/**
 * Presentation formatter — the ONLY way an accuracy reaches the screen.
 *
 *   formatAccuracy(0.7142857)          → "71.43%"
 *   formatAccuracy(0.8)                → "80.00%"
 *   formatAccuracy(1)                  → "100.00%"
 *   formatAccuracy(0.8666667, 1)       → "86.7%"
 *   formatAccuracy(null | undefined)    → "—"      (no meaningful data)
 *
 * Defensive by design: values > 1 (legacy percentages, corrupted
 * 7140-style numbers) are normalised instead of multiplied again, so a
 * double conversion can never surface as "7140%" or "10000%".
 */
export function formatAccuracy(value: number | null | undefined, decimals = 2): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const ratio = value > 1 ? toAccuracyRatio(value) : Math.max(0, value)
  const places = Math.max(0, Math.min(10, decimals))
  return `${accuracyToPercent(ratio, places).toFixed(places)}%`
}
