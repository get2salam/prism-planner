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

export function createTask(title, facets = {}, now = Date.now()) {
  const trimmed = String(title ?? "").trim();
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
  const next = !task.done;
  return {
    ...task,
    done: next,
    completedAt: next ? now : null,
  };
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
