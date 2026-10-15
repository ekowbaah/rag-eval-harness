export interface EvalCase { id: string; relevantDocumentIds: string[]; retrievedDocumentIds: string[]; answer: string; requiredFacts: string[]; costUsd?: number; }
export interface CaseResult { id: string; precisionAtK: number; recallAtK: number; groundedness: number; costUsd: number; }
export interface SuiteResult { cases: CaseResult[]; averages: Omit<CaseResult,"id">; passed: boolean; }
export function evaluateCase(test: EvalCase): CaseResult {
  const relevant = new Set(test.relevantDocumentIds); const retrieved = test.retrievedDocumentIds;
  const hits = retrieved.filter(id => relevant.has(id)).length;
  const facts = test.requiredFacts.filter(f => test.answer.toLowerCase().includes(f.toLowerCase())).length;
  return { id:test.id, precisionAtK: retrieved.length ? hits/retrieved.length : 0, recallAtK: relevant.size ? hits/relevant.size : 1, groundedness: test.requiredFacts.length ? facts/test.requiredFacts.length : 1, costUsd:test.costUsd ?? 0 };
}
export function evaluateSuite(cases: EvalCase[], threshold = 0.8): SuiteResult {
  const results = cases.map(evaluateCase); const divisor = results.length || 1;
  const averages = { precisionAtK:results.reduce((s,x)=>s+x.precisionAtK,0)/divisor, recallAtK:results.reduce((s,x)=>s+x.recallAtK,0)/divisor, groundedness:results.reduce((s,x)=>s+x.groundedness,0)/divisor, costUsd:results.reduce((s,x)=>s+x.costUsd,0)/divisor };
  return { cases:results, averages, passed: averages.recallAtK >= threshold && averages.groundedness >= threshold };
}
