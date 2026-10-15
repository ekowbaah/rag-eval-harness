export interface RetrievedDocument {
  id: string;
  score?: number;
  content?: string;
}

export interface EvalCase {
  id: string;
  query?: string;
  relevantDocumentIds: string[];
  retrievedDocuments: RetrievedDocument[];
  answer: string;
  requiredFacts: string[];
  expectedAnswer?: string;
  citedDocumentIds?: string[];
  latencyMs?: number;
  costUsd?: number;
  tags?: string[];
}

export interface CaseMetrics {
  id: string;
  precisionAtK: number;
  recallAtK: number;
  reciprocalRank: number;
  ndcgAtK: number;
  groundedness: number;
  citationPrecision: number;
  exactMatch: number;
  latencyMs: number;
  costUsd: number;
}

export type MetricName = Exclude<keyof CaseMetrics, "id">;

export interface Thresholds {
  minimum?: Partial<Record<MetricName, number>>;
  maximum?: Partial<Record<MetricName, number>>;
}

export interface SuiteResult {
  datasetVersion: string;
  cases: CaseMetrics[];
  averages: Omit<CaseMetrics, "id">;
  totals: {costUsd: number; latencyMs: number};
  passed: boolean;
  violations: string[];
}

export interface RegressionResult {
  passed: boolean;
  deltas: Partial<Record<MetricName, number>>;
  violations: string[];
}
