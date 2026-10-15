import {readFile} from "node:fs/promises";
import type {EvalCase} from "./types.js";

export interface Dataset { version: string; cases: EvalCase[] }

export async function loadDataset(path: string): Promise<Dataset> {
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as Partial<Dataset>;
  if (typeof parsed.version !== "string" || !parsed.version.trim() || !Array.isArray(parsed.cases)) throw new Error("dataset requires a version and cases array");
  return {version: parsed.version, cases: parsed.cases};
}

export function redactTraceAttributes(attributes: Record<string, unknown>): Record<string, unknown> {
  const blocked = /prompt|answer|content|email|token|authorization|secret/i;
  return Object.fromEntries(Object.entries(attributes).map(([key, value]) => [key, blocked.test(key) ? "[REDACTED]" : value]));
}
