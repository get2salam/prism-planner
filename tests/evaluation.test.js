import { test, assert, assertEqual } from "./harness.js";
import { createTask, toggleDone } from "../src/tasks.js";
import { evaluateTaskLoad } from "../src/evaluation.js";

test("evaluateTaskLoad returns a clear-day score when nothing is active", () => {
  const done = toggleDone(createTask("archive notes", {}, 1700000000000), 1700000001000);
  assertEqual(evaluateTaskLoad([done]), {
    score: 100,
    label: "clear",
    risks: ["No active tasks queued."],
  });
});

test("evaluateTaskLoad scores a small balanced day as recruiter-readable guidance", () => {
  const result = evaluateTaskLoad([
    createTask("write brief", { focus: "steady", energy: "medium", mood: "neutral" }),
    createTask("reply to client", { focus: "light", energy: "low", mood: "spark" }),
  ]);
  assertEqual(result.score, 100);
  assertEqual(result.label, "balanced");
  assert(result.risks.includes("Active tasks are within the balanced range."));
});

test("evaluateTaskLoad penalizes overloaded high-demand plans deterministically", () => {
  const tasks = Array.from({ length: 7 }, (_, i) =>
    createTask(`hard task ${i}`, { focus: "deep", energy: "high", mood: "dull" }, 1700000000000 + i),
  );
  const result = evaluateTaskLoad(tasks);
  assertEqual(result.score, 27);
  assertEqual(result.label, "overloaded");
  assert(result.risks.includes("Many active tasks may fragment attention."));
  assert(result.risks.includes("Several deep-focus or high-energy tasks compete."));
  assert(result.risks.includes("Average facet load is above the steady baseline."));
});

test("evaluateTaskLoad ignores completed tasks when judging today's remaining load", () => {
  const active = createTask("easy active", { focus: "light", energy: "low", mood: "spark" });
  const completed = toggleDone(
    createTask("finished hard task", { focus: "deep", energy: "high", mood: "dull" }),
  );
  assertEqual(evaluateTaskLoad([active, completed]).score, 100);
});
