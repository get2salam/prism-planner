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
import { createTask, toggleDone, removeTask, activeCount } from "./tasks.js";

const storage = createStorage(window.localStorage);

const state = {
  tasks: storage.get("tasks", []),
  theme: storage.get("theme", prefersDark() ? "dark" : "light"),
};

function prefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  if (els.themeToggle) {
    els.themeToggle.textContent = state.theme === "dark" ? "☀" : "☾";
    els.themeToggle.setAttribute(
      "aria-label",
      state.theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
    );
  }
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  storage.set("theme", state.theme);
  applyTheme();
}

const els = {
  form: document.getElementById("task-form"),
  title: document.getElementById("task-title"),
  facetRow: document.getElementById("facet-row"),
  list: document.getElementById("task-list"),
  stats: document.getElementById("stats"),
  themeToggle: document.getElementById("theme-toggle"),
};

els.themeToggle?.addEventListener("click", toggleTheme);

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
    ...state.tasks.map((t) => {
      const checkbox = el("input", {
        type: "checkbox",
        className: "task-check",
        checked: t.done,
      });
      checkbox.setAttribute("aria-label", `Mark "${t.title}" as done`);
      checkbox.addEventListener("change", () => onToggle(t.id));
      const del = el("button", {
        type: "button",
        className: "task-delete",
        textContent: "×",
        title: "Delete task",
      });
      del.setAttribute("aria-label", `Delete "${t.title}"`);
      del.addEventListener("click", () => onDelete(t.id));
      const badges = el(
        "div",
        { className: "facet-badges" },
        FACETS.map((f) => {
          const badge = el("span", {
            className: "facet-badge",
            textContent: t.facets[f.id],
            title: `${f.label}: ${t.facets[f.id]}`,
          });
          badge.style.setProperty("--badge-color", `var(${f.cssVar})`);
          return badge;
        }),
      );
      return el(
        "li",
        {
          className: t.done ? "task task--done" : "task",
          dataset: { id: t.id },
        },
        [
          checkbox,
          el("span", { className: "task-title", textContent: t.title }),
          badges,
          del,
        ],
      );
    }),
  );
}

function onToggle(id) {
  state.tasks = state.tasks.map((t) => (t.id === id ? toggleDone(t) : t));
  persist();
  renderList();
  renderStats();
}

function onDelete(id) {
  state.tasks = removeTask(state.tasks, id);
  persist();
  renderList();
  renderStats();
}

function persist() {
  storage.set("tasks", state.tasks);
}

function renderStats() {
  const total = state.tasks.length;
  if (!total) {
    els.stats.replaceChildren();
    return;
  }
  const remaining = activeCount(state.tasks);
  const done = total - remaining;
  els.stats.replaceChildren(
    el("span", {
      textContent: `${remaining} to go · ${done} done · ${total} total`,
    }),
  );
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
    renderStats();
    els.title.focus();
  } catch (err) {
    els.title.setCustomValidity(err.message);
    els.title.reportValidity();
    setTimeout(() => els.title.setCustomValidity(""), 0);
  }
});

applyTheme();
renderFacetSelectors();
renderList();
renderStats();
