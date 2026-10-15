import type {CaseMetrics, EvalCase} from "./types.js";

export function evaluateCase(test: EvalCase): CaseMetrics {
  validateCase(test);
  const relevant = new Set(test.relevantDocumentIds);
  const retrievedIds = test.retrievedDocuments.map((document) => document.id);
  const hits = retrievedIds.filter((id) => relevant.has(id)).length;
  const firstRelevant = retrievedIds.findIndex((id) => relevant.has(id));
  const facts = test.requiredFacts.filter((fact) => includesNormalized(test.answer, fact)).length;
  const citations = test.citedDocumentIds ?? [];
  const validCitations = citations.filter((id) => relevant.has(id)).length;
  return {
    id: test.id,
    precisionAtK: retrievedIds.length ? hits / retrievedIds.length : 0,
    recallAtK: relevant.size ? hits / relevant.size : 1,
    reciprocalRank: firstRelevant >= 0 ? 1 / (firstRelevant + 1) : 0,
    ndcgAtK: ndcg(retrievedIds, relevant),
    groundedness: test.requiredFacts.length ? facts / test.requiredFacts.length : 1,
    citationPrecision: citations.length ? validCitations / citations.length : test.requiredFacts.length ? 0 : 1,
    exactMatch: test.expectedAnswer === undefined ? 1 : Number(normalize(test.answer) === normalize(test.expectedAnswer)),
    latencyMs: test.latencyMs ?? 0,
    costUsd: test.costUsd ?? 0,
  };
}

function validateCase(test: EvalCase): void {
  if (!test.id.trim()) throw new Error("case id is required");
  if (new Set(test.relevantDocumentIds).size !== test.relevantDocumentIds.length) throw new Error(`case ${test.id} contains duplicate relevant document ids`);
  const retrieved = test.retrievedDocuments.map((document) => document.id);
  if (new Set(retrieved).size !== retrieved.length) throw new Error(`case ${test.id} contains duplicate retrieved document ids`);
  if ((test.costUsd ?? 0) < 0 || (test.latencyMs ?? 0) < 0) throw new Error(`case ${test.id} contains a negative cost or latency`);
}

function ndcg(retrieved: string[], relevant: Set<string>): number {
  const dcg = retrieved.reduce((sum, id, index) => sum + (relevant.has(id) ? 1 / Math.log2(index + 2) : 0), 0);
  const idealHits = Math.min(retrieved.length, relevant.size);
  const ideal = Array.from({length: idealHits}, (_, index) => 1 / Math.log2(index + 2)).reduce((sum, gain) => sum + gain, 0);
  return ideal === 0 ? (relevant.size === 0 ? 1 : 0) : dcg / ideal;
}

function includesNormalized(answer: string, fact: string): boolean { return normalize(answer).includes(normalize(fact)); }
function normalize(value: string): string { return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }
