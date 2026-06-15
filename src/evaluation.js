/*
 * Deterministic planner evaluation. This gives the UI (and future agent runs)
 * a small, auditable score for whether today's active tasks look sustainable.
 */

const LEVEL_LOAD = Object.freeze({
  focus: Object.freeze({ light: 1, steady: 2, deep: 3 }),
  energy: Object.freeze({ low: 1, medium: 2, high: 3 }),
  mood: Object.freeze({ spark: 1, neutral: 2, dull: 3 }),
});

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function loadFor(task, facetId) {
  return LEVEL_LOAD[facetId]?.[task.facets?.[facetId]] ?? 2;
}

function scoreLabel(score) {
  if (score >= 85) return "balanced";
  if (score >= 65) return "watchful";
  return "overloaded";
}

export function evaluateTaskLoad(tasks) {
  const active = tasks.filter((task) => !task.done);
  if (active.length === 0) {
    return { score: 100, label: "clear", risks: ["No active tasks queued."] };
  }

  const avgLoad =
    active.reduce(
      (sum, task) =>
        sum + loadFor(task, "focus") + loadFor(task, "energy") + loadFor(task, "mood"),
      0,
    ) /
    (active.length * 3);
  const highDemand = active.filter(
    (task) => loadFor(task, "focus") === 3 || loadFor(task, "energy") === 3,
  ).length;

  const penalties = [
    Math.max(0, active.length - 6) * 5,
    Math.max(0, highDemand - 2) * 8,
    Math.max(0, avgLoad - 2) * 28,
  ];
  const score = clampScore(100 - penalties.reduce((sum, n) => sum + n, 0));
  const risks = [];
  if (active.length > 6) risks.push("Many active tasks may fragment attention.");
  if (highDemand > 2) risks.push("Several deep-focus or high-energy tasks compete.");
  if (avgLoad > 2) risks.push("Average facet load is above the steady baseline.");
  if (risks.length === 0) risks.push("Active tasks are within the balanced range.");

  return { score, label: scoreLabel(score), risks };
}
