#!/usr/bin/env node
import {writeFile} from "node:fs/promises";
import {loadDataset} from "./dataset.js";
import {evaluateSuite} from "./suite.js";
import type {MetricName, Thresholds} from "./types.js";

const [datasetPath, ...flags] = process.argv.slice(2);
if (!datasetPath) {
  process.stderr.write("usage: rag-eval <dataset.json> [--min metric=value] [--max metric=value] [--out result.json]\n");
  process.exitCode = 1;
} else {
  try {
    const thresholds: Thresholds = {minimum: {}, maximum: {}};
    let outputPath: string | undefined;
    for (let index = 0; index < flags.length; index += 2) {
      const flag = flags[index];
      const value = flags[index + 1];
      if (!value) throw new Error(`${flag} requires a value`);
      if (flag === "--out") outputPath = value;
      else if (flag === "--min" || flag === "--max") {
        const [metric, raw] = value.split("=");
        const number = Number(raw);
        if (!metric || !Number.isFinite(number)) throw new Error(`${flag} expects metric=number`);
        (flag === "--min" ? thresholds.minimum! : thresholds.maximum!)[metric as MetricName] = number;
      } else throw new Error(`unknown flag ${flag}`);
    }
    const dataset = await loadDataset(datasetPath);
    const result = evaluateSuite(dataset.cases, thresholds, dataset.version);
    const serialized = JSON.stringify(result, null, 2) + "\n";
    if (outputPath) await writeFile(outputPath, serialized, {encoding: "utf8", mode: 0o600});
    else process.stdout.write(serialized);
    if (!result.passed) process.exitCode = 2;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
