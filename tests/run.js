/*
 * Tiny test runner. Discovers tests/*.test.js, imports each, and executes
 * every case registered in harness.tests. Exits with code 1 on any failure
 * so CI / pre-push hooks can rely on it.
 *
 * Optional CLI args filter which suites run by substring match against the
 * file name, e.g. `node tests/run.js facets storage` only loads
 * facets.test.js and storage.test.js. This keeps the inner dev loop fast
 * without needing a separate watch tool. No args runs the full suite.
 */

import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

import { tests } from "./harness.js";

const here = dirname(fileURLToPath(import.meta.url));
const filters = process.argv.slice(2);
const testFiles = readdirSync(here)
  .filter((f) => f.endsWith(".test.js"))
  .filter((f) => filters.length === 0 || filters.some((pat) => f.includes(pat)))
  .sort();

if (filters.length > 0 && testFiles.length === 0) {
  process.stderr.write(
    `No test files match filter(s): ${filters.join(", ")}\n`,
  );
  process.exit(1);
}

if (filters.length > 0) {
  process.stdout.write(`Running suites matching: ${filters.join(", ")}\n`);
  process.stdout.write(`  ${testFiles.join("\n  ")}\n\n`);
}

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
