# Prism Planner

A small, local-first day planner that refracts each task into three facets:
**Focus**, **Energy**, and **Mood**. Plan a day that feels like the day you
actually have, not the day you wish you had.

- Pure HTML / CSS / vanilla JavaScript — no build step, no bundler.
- Stores everything in your browser (`localStorage`). No server, no account.
- Keyboard friendly, light + dark themes, gentle animations, respects
  `prefers-reduced-motion`.
- Zero runtime dependencies. Tests run on plain Node.

## Run it

Open `index.html` in any modern browser. That's it.

If you want a local web server (handy for testing module imports on some
browsers):

```
python -m http.server 8000
# then visit http://localhost:8000
```

## Run the tests

```
npm test
```

The runner is hand-rolled (`tests/run.js`) so the project has no `node_modules`
and no `package-lock.json`. Tests cover the facets registry, task model, and
storage helper.

## How it works

| Module           | Responsibility                                              |
| ---------------- | ----------------------------------------------------------- |
| `src/facets.js`  | Registry of facets (focus / energy / mood) and their levels |
| `src/tasks.js`   | Pure task lifecycle: create / toggle / remove / count       |
| `src/storage.js` | `localStorage` wrapper with namespacing + injectable backend|
| `src/app.js`     | DOM glue. Builds nodes safely (no `innerHTML`)              |

The split lets `tasks` and `storage` stay framework-free, so they're testable
under Node without any DOM shim.

## Keyboard shortcuts

| Key              | Action               |
| ---------------- | -------------------- |
| <kbd>/</kbd>     | Focus the task input |
| <kbd>Esc</kbd>   | Blur the task input  |
| <kbd>g</kbd> <kbd>d</kbd> | Toggle theme |

## License

MIT — see `LICENSE`.
