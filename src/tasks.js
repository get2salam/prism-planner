/*
 * Pure task operations. No DOM, no storage, no time-of-day clocks beyond
 * Date.now() for ids — keeps the module trivially testable.
 *
 * A task is:
 *   {
 *     id: string,
 *     title: string,
 *     done: boolean,
 *     createdAt: number,    // ms epoch
 *     completedAt: number | null,
 *     facets: { focus, energy, mood }   // each is one of facet.levels
 *   }
 */

import { defaultLevels, getFacet, isValidLevel } from "./facets.js";

// Mirrors the `maxlength` on #task-title in index.html so titles entered
// through the form and titles created programmatically share one invariant.
export const MAX_TITLE_LENGTH = 140;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validTimestamp(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function createTask(title, facets = {}, now = Date.now()) {
  // A non-finite `now` would produce an id like "t_NaN_..." and a createdAt
  // that JSON.stringify silently rewrites to null on persist, breaking any
  // later sort or comparison by createdAt. Fail loudly at the call site.
  if (typeof now !== "number" || !Number.isFinite(now)) {
    throw new Error("Task `now` must be a finite number.");
  }
  // A non-string title would otherwise be coerced via String(), turning {} into
  // "[object Object]" and arrays into comma-joined nonsense — surface this as
  // a clear error instead of silently storing garbage.
  if (title != null && typeof title !== "string") {
    throw new Error("Task title must be a string.");
  }
  const trimmed = (title ?? "").trim();
  if (!trimmed) {
    throw new Error("Task title cannot be empty.");
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new Error(
      `Task title is ${trimmed.length} characters; max is ${MAX_TITLE_LENGTH}.`,
    );
  }
  // Nullish is treated as "use defaults" — but arrays, strings, and numbers
  // would otherwise either silently no-op or produce a misleading
  // `Unknown facet "0"` error after spreading.
  const overrides = facets ?? {};
  if (typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new Error("Task facets must be a plain object.");
  }
  const merged = { ...defaultLevels(), ...overrides };
  for (const [facetId, level] of Object.entries(merged)) {
    if (!getFacet(facetId)) {
      throw new Error(`Unknown facet "${facetId}".`);
    }
    if (!isValidLevel(facetId, level)) {
      throw new Error(`Invalid level "${level}" for facet "${facetId}".`);
    }
  }
  return {
    id: `t_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    title: trimmed,
    done: false,
    createdAt: now,
    completedAt: null,
    facets: merged,
  };
}

export function toggleDone(task, now = Date.now()) {
  // Same hazard as createTask: a non-finite completedAt round-trips through
  // JSON as null, masking the bug until a stats or sort calculation later.
  if (typeof now !== "number" || !Number.isFinite(now)) {
    throw new Error("toggleDone `now` must be a finite number.");
  }
  // A null/undefined or primitive `task` would otherwise throw a cryptic
  // "Cannot read properties of X (reading 'done')" TypeError. Corrupted
  // storage or a stale reference is easier to diagnose with context.
  if (task === null || typeof task !== "object" || Array.isArray(task)) {
    throw new Error("toggleDone `task` must be a task object.");
  }
  const next = !task.done;
  return {
    ...task,
    done: next,
    completedAt: next ? now : null,
  };
}

export function normalizeStoredTasks(value) {
  if (!Array.isArray(value)) return [];

  const normalized = [];
  for (const task of value) {
    if (
      !isPlainObject(task) ||
      typeof task.id !== "string" ||
      !task.id ||
      typeof task.title !== "string" ||
      !task.title.trim() ||
      typeof task.done !== "boolean" ||
      !validTimestamp(task.createdAt) ||
      !(task.completedAt === null || validTimestamp(task.completedAt))
    ) {
      continue;
    }

    const rawFacets = isPlainObject(task.facets) ? task.facets : {};
    const facets = { ...defaultLevels(), ...rawFacets };
    const hasOnlyKnownFacets = Object.keys(rawFacets).every((facetId) =>
      Boolean(getFacet(facetId)),
    );
    const hasValidLevels = Object.entries(facets).every(([facetId, level]) =>
      isValidLevel(facetId, level),
    );
    if (!hasOnlyKnownFacets || !hasValidLevels) continue;

    normalized.push({
      ...task,
      title: task.title.trim(),
      completedAt: task.done ? task.completedAt : null,
      facets,
    });
  }
  return normalized;
}

export function removeTask(tasks, id) {
  return tasks.filter((t) => t.id !== id);
}

export function clearCompleted(tasks) {
  return tasks.filter((t) => !t.done);
}

export function activeCount(tasks) {
  return tasks.reduce((n, t) => (t.done ? n : n + 1), 0);
}

export function completedCount(tasks) {
  return tasks.length - activeCount(tasks);
}

// The action a screen reader user will trigger by toggling the checkbox is
// the opposite of the task's current state — labelling it "Mark X as done"
// while it is already done announces the wrong action.
export function taskCheckboxLabel(task) {
  return task.done
    ? `Mark "${task.title}" as not done`
    : `Mark "${task.title}" as done`;
}
