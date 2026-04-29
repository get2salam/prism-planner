/*
 * A 30-line test harness. We deliberately avoid Jest / Vitest so the project
 * stays zero-install — `node tests/run.js` is the entire test command.
 *
 * Each suite exports an array of { name, fn } via the test() collector. The
 * runner imports every *.test.js file, executes registered cases, and prints
 * a tally. A failing case throws (assert) and the runner records the error.
 */

export const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function assert(condition, message = "Assertion failed") {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(message ?? `Expected ${e}, got ${a}`);
  }
}

export function assertThrows(fn, pattern) {
  try {
    fn();
  } catch (err) {
    if (pattern && !pattern.test(err.message)) {
      throw new Error(`Threw "${err.message}", expected match for ${pattern}`);
    }
    return;
  }
  throw new Error("Expected function to throw, but it did not");
}
