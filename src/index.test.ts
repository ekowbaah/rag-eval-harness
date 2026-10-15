import assert from "node:assert/strict";
import test from "node:test";
import {compareSuites, evaluateCase, evaluateSuite, redactTraceAttributes, type EvalCase} from "./index.js";

const caseA = (overrides: Partial<EvalCase> = {}): EvalCase => ({
  id: "stockholm",
  query: "Where is Stockholm?",
  relevantDocumentIds: ["geo-se-1", "geo-se-2"],
  retrievedDocuments: [{id: "geo-se-2"}, {id: "noise"}],
  answer: "Stockholm is the capital of Sweden.",
  requiredFacts: ["capital", "Sweden"],
  expectedAnswer: "Stockholm is the capital of Sweden",
  citedDocumentIds: ["geo-se-2"],
  latencyMs: 120,
  costUsd: 0.01,
  ...overrides,
});

test("computes deterministic retrieval, ranking, answer, and cost metrics", () => {
  const result = evaluateCase(caseA());
  assert.equal(result.precisionAtK, 0.5);
  assert.equal(result.recallAtK, 0.5);
  assert.equal(result.reciprocalRank, 1);
  assert.ok(Math.abs(result.ndcgAtK - 0.6131471927654584) < Number.EPSILON);
  assert.equal(result.groundedness, 1);
  assert.equal(result.citationPrecision, 1);
  assert.equal(result.exactMatch, 1);
});

test("applies minimum quality and maximum operational thresholds", () => {
  const result = evaluateSuite([caseA()], {minimum: {recallAtK: 0.8, groundedness: 0.9}, maximum: {latencyMs: 100, costUsd: 0.02}}, "2026-10-15");
  assert.equal(result.passed, false);
  assert.equal(result.datasetVersion, "2026-10-15");
  assert.deepEqual(result.violations, ["recallAtK 0.5000 is below minimum 0.8000", "latencyMs 120.0000 exceeds maximum 100.0000"]);
  assert.deepEqual(result.totals, {costUsd: 0.01, latencyMs: 120});
});

test("detects quality, latency, and cost regressions with tolerances", () => {
  const baseline = evaluateSuite([caseA({latencyMs: 100, costUsd: 0.01})]);
  const candidate = evaluateSuite([caseA({retrievedDocuments: [{id: "noise"}, {id: "geo-se-2"}], latencyMs: 130, costUsd: 0.015})]);
  const comparison = compareSuites(baseline, candidate, {reciprocalRank: 0.4, costUsd: 0.01});
  assert.equal(comparison.passed, false);
  assert.ok(comparison.violations.some((violation) => violation.startsWith("ndcgAtK regressed")));
  assert.ok(comparison.violations.some((violation) => violation.startsWith("latencyMs regressed")));
  assert.ok(!comparison.violations.some((violation) => violation.startsWith("costUsd")));
});

test("rejects ambiguous datasets and malformed cases", () => {
  assert.throws(() => evaluateSuite([], {}), /at least one case/);
  assert.throws(() => evaluateSuite([caseA(), caseA()]), /ids must be unique/);
  assert.throws(() => evaluateCase(caseA({retrievedDocuments: [{id: "dup"}, {id: "dup"}]})), /duplicate retrieved/);
});

test("redacts sensitive trace fields but keeps aggregate telemetry", () => {
  assert.deepEqual(redactTraceAttributes({prompt: "secret", tenantId: "tenant-a", costUsd: 0.01, authorization: "bearer x"}), {prompt: "[REDACTED]", tenantId: "tenant-a", costUsd: 0.01, authorization: "[REDACTED]"});
});
