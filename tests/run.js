/*
 * Tiny test runner. Discovers tests/*.test.js, imports each, and executes
 * every case registered in harness.tests. Exits with code 1 on any failure
 * so CI / pre-push hooks can rely on it.
 */

import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

import { tests } from "./harness.js";

const here = dirname(fileURLToPath(import.meta.url));
const testFiles = readdirSync(here)
  .filter((f) => f.endsWith(".test.js"))
  .sort();

for (const f of testFiles) {
  await import(pathToFileURL(resolve(here, f)).href);
}

let passed = 0;
let failed = 0;
const failures = [];

for (const { name, fn } of tests) {
  try {
    await fn();
    passed += 1;
    process.stdout.write(`  ok  ${name}\n`);
  } catch (err) {
    failed += 1;
    failures.push({ name, err });
    process.stdout.write(`  FAIL ${name}\n        ${err.message}\n`);
  }
}

const total = passed + failed;
process.stdout.write(`\n${passed}/${total} tests passed`);
if (failed) {
  process.stdout.write(` (${failed} failed)\n`);
  process.exit(1);
} else {
  process.stdout.write("\n");
}
