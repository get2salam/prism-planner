/*
 * Facets are the three dimensions every task gets refracted across.
 * They're modeled as a small registry so adding a fourth facet later means
 * touching one file, not chasing magic strings through the codebase.
 */

export const FACETS = Object.freeze([
  {
    id: "focus",
    label: "Focus",
    cssVar: "--facet-focus",
    levels: ["light", "steady", "deep"],
    description: "How much undivided attention this task needs.",
  },
  {
    id: "energy",
    label: "Energy",
    cssVar: "--facet-energy",
    levels: ["low", "medium", "high"],
    description: "How much physical or mental fuel it will burn.",
  },
  {
    id: "mood",
    label: "Mood",
    cssVar: "--facet-mood",
    levels: ["dull", "neutral", "spark"],
    description: "How the task is likely to leave you feeling.",
  },
]);

export function getFacet(id) {
  return FACETS.find((f) => f.id === id) ?? null;
}

export function isValidLevel(facetId, level) {
  const facet = getFacet(facetId);
  return facet ? facet.levels.includes(level) : false;
}

export function defaultLevels() {
  return FACETS.reduce((acc, f) => {
    acc[f.id] = f.levels[Math.floor(f.levels.length / 2)];
    return acc;
  }, {});
}
