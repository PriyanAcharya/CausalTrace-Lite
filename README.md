# CausalTrace Lite

CausalTrace Lite is a small, deterministic visual debugger for a restaurant-booking agent. It compares Understand → Choose → Execute against the requested behavior, highlights the earliest incorrect stage, and compares that diagnosis with a naive last-error-only view.

The app uses plain HTML, CSS, and JavaScript modules. It makes no network requests, uses no API keys, and does not make real bookings.

## Requirements

- A modern web browser.
- Python with its built-in HTTP server, for serving the page locally.
- Node.js only if you want to run the evaluator tests.

## Run locally

From the project root, start the static file server:

```powershell
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Stop the server with `Ctrl+C`.

## Run the tests

From the project root:

```powershell
node --test
```

The tests use Node's built-in test runner and assert library; no packages need to be installed.

## Try the demo

1. Start on **The Misunderstood Request**. Understand should be labeled `ROOT CAUSE`, with Choose and Execute marked `AFFECTED` because they preserve the wrong date.
2. Compare the CausalTrace diagnosis with the naive debugger's blame on the final booking attempt.
3. Select **The Wrong Restaurant**. Choose should be the root cause and Execute the downstream effect.
4. Select **The Booking That Failed**. Execute should be the root cause, with the earlier stages correct.
5. Click timeline stages to inspect inputs, expected values, actual values, field mismatches, and causal explanations. Stage inspection should not change either scenario-level diagnosis.

## Project files

- `index.html`, `styles.css` — accessible dashboard structure and responsive dark styling.
- `js/scenarios.js` — the three deterministic traces and explicit causal field links.
- `js/evaluator.js` — structured field comparisons, earliest-error evaluation, and independent naive last-error diagnosis.
- `js/app.js` — shared selection state, interactions, and DOM rendering.
- `tests/evaluator.test.js` — evaluator, diagnosis, and view-state tests.
- `devpost/` — the approved scope, PRD, technical spec, and build checklist.

## Demo recording

Record the default view first so the root-cause contrast is immediately visible. Switch through all three scenarios, inspect a stage, and show the passing test command. The hackathon submission requires a short demo video and a public GitHub repository; deployment is optional and is not part of this MVP.
