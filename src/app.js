/*
 * Front-end entry point. Keeps the DOM glue thin: dispatch user actions to
 * pure helpers in tasks.js / facets.js / storage.js, then re-render.
 *
 * Note: we deliberately avoid innerHTML — every node is built with
 * createElement + textContent so no user-supplied string can ever be parsed
 * as markup.
 */

import { FACETS, defaultLevels } from "./facets.js";
import { createStorage } from "./storage.js";
import { createTask } from "./tasks.js";

const storage = createStorage(window.localStorage);

const state = {
  tasks: storage.get("tasks", []),
};

const els = {
  form: document.getElementById("task-form"),
  title: document.getElementById("task-title"),
  facetRow: document.getElementById("facet-row"),
  list: document.getElementById("task-list"),
};

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "dataset") {
      Object.assign(node.dataset, v);
    } else if (k in node) {
      node[k] = v;
    } else {
      node.setAttribute(k, v);
    }
  }
  for (const child of children) {
    if (child == null) continue;
    node.append(child);
  }
  return node;
}

function renderFacetSelectors() {
  const defaults = defaultLevels();
  els.facetRow.replaceChildren(
    ...FACETS.map((facet) => {
      const select = el("select", { name: facet.id });
      for (const lvl of facet.levels) {
        const opt = el("option", { value: lvl, textContent: lvl });
        if (lvl === defaults[facet.id]) opt.selected = true;
        select.append(opt);
      }
      return el(
        "label",
        { className: "facet", dataset: { facet: facet.id } },
        [el("span", { textContent: facet.label }), select],
      );
    }),
  );
}

function renderList() {
  if (!state.tasks.length) {
    els.list.replaceChildren(
      el("li", { className: "empty", textContent: "No tasks yet — add one above." }),
    );
    return;
  }
  els.list.replaceChildren(
    ...state.tasks.map((t) =>
      el("li", { className: "task", dataset: { id: t.id } }, [
        el("span", { className: "task-title", textContent: t.title }),
      ]),
    ),
  );
}

function persist() {
  storage.set("tasks", state.tasks);
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(els.form);
  const facets = Object.fromEntries(FACETS.map((f) => [f.id, data.get(f.id)]));
  try {
    const task = createTask(data.get("title"), facets);
    state.tasks = [task, ...state.tasks];
    persist();
    els.form.reset();
    renderFacetSelectors();
    renderList();
    els.title.focus();
  } catch (err) {
    els.title.setCustomValidity(err.message);
    els.title.reportValidity();
    setTimeout(() => els.title.setCustomValidity(""), 0);
  }
});

renderFacetSelectors();
renderList();
