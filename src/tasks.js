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

import { defaultLevels, isValidLevel } from "./facets.js";

export function createTask(title, facets = {}, now = Date.now()) {
  const trimmed = String(title ?? "").trim();
  if (!trimmed) {
    throw new Error("Task title cannot be empty.");
  }
  const merged = { ...defaultLevels(), ...facets };
  for (const [facetId, level] of Object.entries(merged)) {
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
