import { test, assert, assertEqual, assertThrows } from "./harness.js";
import {
  createTask,
  toggleDone,
  removeTask,
  clearCompleted,
  activeCount,
  completedCount,
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
