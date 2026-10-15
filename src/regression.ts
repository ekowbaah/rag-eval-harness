import type {MetricName, RegressionResult, SuiteResult} from "./types.js";

export function compareSuites(baseline: SuiteResult, candidate: SuiteResult, tolerances: Partial<Record<MetricName, number>> = {}): RegressionResult {
  const deltas: Partial<Record<MetricName, number>> = {};
  const violations: string[] = [];
  const higherIsBetter = ["precisionAtK", "recallAtK", "reciprocalRank", "ndcgAtK", "groundedness", "citationPrecision", "exactMatch"] as const;
  const lowerIsBetter = ["latencyMs", "costUsd"] as const;
  for (const metric of higherIsBetter) {
    const delta = candidate.averages[metric] - baseline.averages[metric];
    deltas[metric] = delta;
    const tolerance = tolerances[metric] ?? 0;
    if (delta < -tolerance) violations.push(`${metric} regressed by ${Math.abs(delta).toFixed(4)}`);
  }
  for (const metric of lowerIsBetter) {
    const delta = candidate.averages[metric] - baseline.averages[metric];
    deltas[metric] = delta;
    const tolerance = tolerances[metric] ?? 0;
    if (delta > tolerance) violations.push(`${metric} regressed by ${delta.toFixed(4)}`);
  }
  return {passed: violations.length === 0, deltas, violations};
}
