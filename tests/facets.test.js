import { test, assert, assertEqual } from "./harness.js";
import {
  FACETS,
  getFacet,
  isValidLevel,
  defaultLevels,
} from "../src/facets.js";

test("FACETS exposes the three planner dimensions", () => {
  const ids = FACETS.map((f) => f.id);
  assertEqual(ids, ["focus", "energy", "mood"]);
});

test("getFacet returns the registered facet", () => {
  const focus = getFacet("focus");
  assert(focus !== null, "focus facet should exist");
  assertEqual(focus.levels, ["light", "steady", "deep"]);
});

test("getFacet returns null for unknown facet", () => {
  assertEqual(getFacet("doesnotexist"), null);
});

test("isValidLevel accepts known levels and rejects strangers", () => {
  assert(isValidLevel("focus", "deep"));
  assert(!isValidLevel("focus", "ultradeep"));
  assert(!isValidLevel("notafacet", "anything"));
});

test("defaultLevels picks the middle level for each facet", () => {
  const defaults = defaultLevels();
  assertEqual(defaults, { focus: "steady", energy: "medium", mood: "neutral" });
});

test("FACETS is frozen so it can't be mutated at runtime", () => {
  assert(Object.isFrozen(FACETS));
});

test("each facet entry and its levels array are also frozen", () => {
  for (const facet of FACETS) {
    assert(Object.isFrozen(facet), `facet "${facet.id}" should be frozen`);
    assert(
      Object.isFrozen(facet.levels),
      `levels for "${facet.id}" should be frozen`,
    );
  }
});

test("mutating a facet's levels at runtime is a no-op in strict module code", () => {
  const focus = getFacet("focus");
  const before = [...focus.levels];
  // In strict mode (ES modules) this throws; in sloppy contexts it would
  // silently fail. Either way, the registry's view must not change.
  try {
    focus.levels.push("ultradeep");
  } catch {
    // expected in strict mode
  }
  assertEqual([...getFacet("focus").levels], before);
  assert(!isValidLevel("focus", "ultradeep"));
});
