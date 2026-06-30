import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { test, assert, assertEqual } from "./harness.js";
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

test("index.html has a role=status live region for polite task announcements", () => {
  const match = html.match(/<p\b[^>]*\bid="a11y-status"[^>]*>/);
  if (!match) throw new Error('No <p id="a11y-status"> found in index.html');
  const tag = match[0];
  assert(/role="status"/.test(tag), '#a11y-status is missing role="status"');
  assert(/aria-atomic="true"/.test(tag), '#a11y-status is missing aria-atomic="true"');
  assert(/class="visually-hidden"/.test(tag), '#a11y-status is missing class="visually-hidden"');
});

test("index.html #task-list declares aria-relevant so only additions/removals are announced", () => {
  const match = html.match(/<ul\b[^>]*\bid="task-list"[^>]*>/);
  if (!match) throw new Error('No <ul id="task-list"> found in index.html');
  const tag = match[0];
  assert(/aria-live="polite"/.test(tag), '#task-list is missing aria-live="polite"');
  assert(/aria-relevant="additions removals"/.test(tag), '#task-list is missing aria-relevant="additions removals"');
});
