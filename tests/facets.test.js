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
