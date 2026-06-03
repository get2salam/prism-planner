import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { test, assertEqual } from "./harness.js";
import { MAX_TITLE_LENGTH } from "../src/tasks.js";

// Lock in the invariant declared in src/tasks.js: the form's max title length
// must match MAX_TITLE_LENGTH. Drift in either direction is a silent UX bug —
// the browser would either truncate a title createTask still accepts, or
// accept a title createTask then rejects with no in-form feedback.
const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, "..", "index.html"), "utf8");

function taskTitleInput() {
  const match = html.match(/<input\b[^>]*\bid="task-title"[^>]*>/);
  if (!match) {
    throw new Error("Could not find <input id=\"task-title\"> in index.html");
  }
  return match[0];
}

test("index.html #task-title maxlength matches MAX_TITLE_LENGTH", () => {
  const lenMatch = taskTitleInput().match(/\bmaxlength="(\d+)"/);
  if (!lenMatch) {
    throw new Error("#task-title is missing a maxlength attribute");
  }
  assertEqual(Number(lenMatch[1]), MAX_TITLE_LENGTH);
});
