import {evaluateCase} from "./metrics.js";
import type {CaseMetrics, EvalCase, MetricName, SuiteResult, Thresholds} from "./types.js";

const metricNames: MetricName[] = ["precisionAtK", "recallAtK", "reciprocalRank", "ndcgAtK", "groundedness", "citationPrecision", "exactMatch", "latencyMs", "costUsd"];

export function evaluateSuite(cases: EvalCase[], thresholds: Thresholds = {}, datasetVersion = "unversioned"): SuiteResult {
  if (cases.length === 0) throw new Error("an evaluation suite requires at least one case");
  if (new Set(cases.map((test) => test.id)).size !== cases.length) throw new Error("evaluation case ids must be unique");
  const results = cases.map(evaluateCase);
  const averages = Object.fromEntries(metricNames.map((metric) => [metric, mean(results.map((result) => result[metric]))])) as Omit<CaseMetrics, "id">;
  const violations = checkThresholds(averages, thresholds);
  return {
    datasetVersion,
    cases: results,
    averages,
    totals: {costUsd: sum(results.map((result) => result.costUsd)), latencyMs: sum(results.map((result) => result.latencyMs))},
    passed: violations.length === 0,
    violations,
  };
}

function checkThresholds(metrics: Omit<CaseMetrics, "id">, thresholds: Thresholds): string[] {
  const violations: string[] = [];
  for (const [name, threshold] of Object.entries(thresholds.minimum ?? {}) as [MetricName, number][]) {
    if (metrics[name] < threshold) violations.push(`${name} ${metrics[name].toFixed(4)} is below minimum ${threshold.toFixed(4)}`);
  }
  for (const [name, threshold] of Object.entries(thresholds.maximum ?? {}) as [MetricName, number][]) {
    if (metrics[name] > threshold) violations.push(`${name} ${metrics[name].toFixed(4)} exceeds maximum ${threshold.toFixed(4)}`);
  }
  return violations;
}

function sum(values: number[]): number { return values.reduce((total, value) => total + value, 0); }
function mean(values: number[]): number { return sum(values) / values.length; }
