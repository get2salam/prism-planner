import { test, assert, assertEqual, assertThrows } from "./harness.js";
import {
  createTask,
  toggleDone,
  removeTask,
  clearCompleted,
  activeCount,
  completedCount,
  MAX_TITLE_LENGTH,
} from "../src/tasks.js";

test("createTask builds a task with defaults when no facets given", () => {
  const t = createTask("Write notes");
  assertEqual(t.title, "Write notes");
  assertEqual(t.done, false);
  assertEqual(t.completedAt, null);
  assertEqual(t.facets, { focus: "steady", energy: "medium", mood: "neutral" });
  assert(typeof t.id === "string" && t.id.startsWith("t_"));
});

test("createTask trims whitespace and rejects empty titles", () => {
  assertEqual(createTask("   tidy desk  ").title, "tidy desk");
  assertThrows(() => createTask("   "), /empty/i);
  assertThrows(() => createTask(""), /empty/i);
});

test("createTask rejects unknown facet levels", () => {
  assertThrows(
    () => createTask("walk", { focus: "ultradeep" }),
    /Invalid level/i,
  );
});

test("createTask rejects unknown facet ids with a clear error", () => {
  assertThrows(
    () => createTask("walk", { banana: "ripe" }),
    /unknown facet "banana"/i,
  );
});

test("createTask accepts null facets as a request for defaults", () => {
  const t = createTask("walk", null);
  assertEqual(t.facets, { focus: "steady", energy: "medium", mood: "neutral" });
});

test("createTask rejects array facets instead of producing a cryptic error", () => {
  assertThrows(() => createTask("walk", ["focus"]), /plain object/i);
});

test("createTask rejects object titles instead of storing '[object Object]'", () => {
  assertThrows(() => createTask({ title: "walk" }), /title must be a string/i);
});

test("createTask rejects array titles instead of comma-joining them", () => {
  assertThrows(() => createTask(["walk"]), /title must be a string/i);
});

test("createTask rejects number titles so the title type stays predictable", () => {
  assertThrows(() => createTask(42), /title must be a string/i);
});

test("createTask still treats null and undefined titles as empty", () => {
  assertThrows(() => createTask(null), /empty/i);
  assertThrows(() => createTask(undefined), /empty/i);
});

test("createTask rejects non-object facets instead of silently using defaults", () => {
  assertThrows(() => createTask("walk", "deep"), /plain object/i);
  assertThrows(() => createTask("walk", 42), /plain object/i);
});

test("createTask reports the unknown facet, not a misleading level error", () => {
  try {
    createTask("walk", { banana: "ripe" });
  } catch (err) {
    assert(
      !/invalid level/i.test(err.message),
      `Expected facet-level error, got: ${err.message}`,
    );
    return;
  }
  throw new Error("Expected createTask to throw for unknown facet id");
});

test("createTask accepts a title at the max length", () => {
  const atLimit = "x".repeat(MAX_TITLE_LENGTH);
  assertEqual(createTask(atLimit).title, atLimit);
});

test("createTask rejects a title longer than the max length", () => {
  const tooLong = "x".repeat(MAX_TITLE_LENGTH + 1);
  assertThrows(() => createTask(tooLong), /max is 140/i);
});

test("createTask counts length after trimming whitespace", () => {
  const padded = `   ${"x".repeat(MAX_TITLE_LENGTH)}   `;
  assertEqual(createTask(padded).title.length, MAX_TITLE_LENGTH);
});

test("createTask uses injected now so id and createdAt agree", () => {
  const fixed = 1700000000000;
  const t = createTask("read", {}, fixed);
  assertEqual(t.createdAt, fixed);
  assert(
    t.id.includes(fixed.toString(36)),
    `id "${t.id}" should embed timestamp ${fixed.toString(36)}`,
  );
});

test("toggleDone flips done and stamps completedAt", () => {
  const t = createTask("read");
  const t2 = toggleDone(t, 1700000000000);
  assertEqual(t2.done, true);
  assertEqual(t2.completedAt, 1700000000000);
  const t3 = toggleDone(t2, 1700000099999);
  assertEqual(t3.done, false);
  assertEqual(t3.completedAt, null);
});

test("toggleDone preserves id, title, createdAt, and facets", () => {
  const t = createTask(
    "deep read",
    { focus: "deep", energy: "high", mood: "spark" },
    1700000000000,
  );
  const t2 = toggleDone(t, 1700000099999);
  assertEqual(t2.id, t.id);
  assertEqual(t2.title, t.title);
  assertEqual(t2.createdAt, t.createdAt);
  assertEqual(t2.facets, t.facets);
});

test("removeTask drops only the matching id", () => {
  const a = createTask("a");
  const b = createTask("b");
  const c = createTask("c");
  const list = [a, b, c];
  const next = removeTask(list, b.id);
  assertEqual(next.length, 2);
  assertEqual(
    next.map((t) => t.title),
    ["a", "c"],
  );
});

test("removeTask returns an equivalent list when the id is not found", () => {
  const list = [createTask("a"), createTask("b")];
  const next = removeTask(list, "t_does_not_exist");
  assertEqual(
    next.map((t) => t.title),
    ["a", "b"],
  );
});

test("toggleDone does not mutate the input task", () => {
  const t = createTask("read");
  const snapshot = JSON.stringify(t);
  toggleDone(t, 1700000000000);
  assertEqual(JSON.stringify(t), snapshot);
});

test("removeTask does not mutate the input list", () => {
  const list = [createTask("a"), createTask("b"), createTask("c")];
  const snapshot = JSON.stringify(list);
  removeTask(list, list[1].id);
  assertEqual(JSON.stringify(list), snapshot);
});

test("clearCompleted does not mutate the input list and handles an empty list", () => {
  const list = [createTask("a"), toggleDone(createTask("b"))];
  const snapshot = JSON.stringify(list);
  clearCompleted(list);
  assertEqual(JSON.stringify(list), snapshot);
  assertEqual(clearCompleted([]), []);
});

test("activeCount counts tasks that aren't done", () => {
  const a = createTask("a");
  const b = toggleDone(createTask("b"));
  const c = createTask("c");
  assertEqual(activeCount([a, b, c]), 2);
  assertEqual(activeCount([]), 0);
});

test("completedCount mirrors activeCount", () => {
  const a = createTask("a");
  const b = toggleDone(createTask("b"));
  const c = toggleDone(createTask("c"));
  assertEqual(completedCount([a, b, c]), 2);
  assertEqual(completedCount([]), 0);
});

test("clearCompleted drops done tasks and preserves order of the rest", () => {
  const a = createTask("a");
  const b = toggleDone(createTask("b"));
  const c = createTask("c");
  const next = clearCompleted([a, b, c]);
  assertEqual(
    next.map((t) => t.title),
    ["a", "c"],
  );
});

test("clearCompleted returns an equivalent list when nothing is done", () => {
  const list = [createTask("a"), createTask("b"), createTask("c")];
  const next = clearCompleted(list);
  assertEqual(
    next.map((t) => t.title),
    ["a", "b", "c"],
  );
});
