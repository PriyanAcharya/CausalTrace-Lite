---
doc: spec
status: approved
---

# CausalTrace Lite — Technical Spec

## How This Works, In Plain Language

The browser shows a single dashboard. `scenarios.js` holds three example traces. `evaluator.js` compares their structured values and explains how errors travel between stages. `app.js` keeps track of what the user selected and updates the screen. The same evaluator and scenarios run in Node tests, without a browser.

Each stage has expected behavior, behavior expected for the input it actually received, and its actual behavior. The first stage that fails its own expected behavior is the root cause. A later stage can follow its received input correctly but still pass along an end-to-end result that violates the user's request; an explicit causal link lets the dashboard label that stage `AFFECTED`. A separate last-error calculation finds the final erroneous event. Neither diagnosis is read from a preassigned scenario label.

The app uses browser features and built-in Python and Node tools, so there is no package installation, app backend, API key, or deployment. A minimal `package.json` only marks the JavaScript files as ES modules for Node tests; it adds no dependencies or build step.

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`.

1. `index.html` loads `app.js`, which selects Scenario A and Understand by default.
2. `app.js` passes the selected scenario to the evaluator and separate naive-debugger function. The evaluator returns local status, end-to-end mismatches, the derived root cause, and supported downstream effects.
3. The dashboard shows the scenario summary, timeline, both scenario-level diagnoses, and Understand details without requiring a click.
4. Clicking a stage changes only the inspected-stage selection and details. Both diagnosis panels continue to describe the complete scenario.
5. Switching scenarios recomputes results, selects the earliest incorrect stage, and updates all scenario-dependent content without a page reload.

```text
scenarios.js ──> evaluator.js ──┐
       └───────> last-error ───┼──> app.js state/rendering ──> dashboard
                               └──> tests/evaluator.test.js
```

## Stack

- **HTML, CSS, JavaScript ES modules:** learner-selected; native browser modules provide the requested three-file separation without a frontend framework or bundler. [MDN JavaScript modules guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- **Python 3.12 `http.server`:** serves the static files locally; it is not an app backend. [Python 3.12 `http.server` documentation](https://docs.python.org/3.12/library/http.server.html)
- **Node.js 25 built-in test runner:** tests the evaluator with no test package. `package.json` sets `"type": "module"` so Node treats `.js` files consistently as ES modules. [Node.js test runner](https://nodejs.org/api/test.html), [Node.js package/module configuration](https://nodejs.org/api/packages.html)
- **No third-party packages, external services, APIs, live LLM calls, or remote assets.** Use system fonts and inline/text icons so the dashboard remains self-contained and works offline.

## Where It Runs and How Someone Tries It

- Requires a modern browser and Python with `http.server`. Node.js is required only for evaluator tests.
- From the project root, run:

  ```powershell
  python -m http.server 8000
  ```

- Open `http://localhost:8000`.
- From the project root, run the tests with:

  ```powershell
  node --test
  ```

- To record the short demo: show Scenario A on load with Understand as root cause and Choose/Execute as affected; switch to Scenarios B and C; inspect a stage; then show the tests passing. Deployment is not planned. Submission still requires a short demo video and a public GitHub repository.

## Look and Feel

Implement the early-2000s personal-website direction in `styles.css`: pale blush canvas, bubblegum/raspberry accents, lavender and icy-blue surfaces, readable dark text, retro window title bars, beveled borders, scrapbook scenario cards, dotted separators, and restrained CSS pixel motifs. Keep the horizontal timeline as the visual anchor. Preserve semantic statuses with mint `CORRECT`, raspberry-red `ROOT CAUSE`, and warm-amber `AFFECTED`, always using text labels/icons as well as color. Use system fonts, no remote assets, responsive layout, visible keyboard focus, and small transitions; respect `prefers-reduced-motion`. Keep decoration subordinate to reading the trace. Implements `prd.md > Screens and Layout`, `Look and Feel`, `Features and Behavior > Stage Evaluation and Timeline`.

## Components

### Scenario Data — `js/scenarios.js`

Export exactly three deterministic scenarios with IDs `misunderstood-request`, `wrong-restaurant`, and `booking-failed`. Each includes title, original request, short description, outcome, ordered stage records, and presentation explanations separate from evaluated values. Keep the same booking requirements across all scenarios: Italian cuisine, tonight at 7 PM, party of two.

Each stage record includes:

- `input`: the structured input received by the stage, including values passed from earlier stages.
- `expectedOutput`: the correct trace output required to fulfill the original user request.
- `expectedForInput`: the output a correct stage should produce from the input it actually received.
- `actualOutput`: the deterministic simulated output.
- Explicit field-level causal links where a later input/output carries an earlier value.

Use these fields: Understand (`cuisine`, `date`, `time`, `partySize`); Choose (`restaurantId`, `cuisine`, plus carried booking criteria where needed); Execute (`restaurantId`, `date`, `time`, `partySize`). For example, Scenario A's Choose stage receives tomorrow from Understand, is expected locally to preserve tomorrow, and actually does so; its end-to-end booking date still conflicts with the original request. This makes the upstream effect visible without falsely calling Choose's local behavior a new root error.

Implements `prd.md > Features and Behavior > Deterministic Scenarios`.

### Evaluator and Naive Debugger — `js/evaluator.js`

Keep these pure functions independent of the DOM and explanatory text.

**Earliest-error evaluator:**

1. Compare each stage's `actualOutput` with `expectedForInput` field by field to determine whether that stage behaved correctly given what it received.
2. Visit stages in Understand → Choose → Execute order. The first local mismatch is the computed `ROOT CAUSE`; do not read it from scenario ID or a stored root-cause label.
3. Compare actual values with `expectedOutput` to detect end-to-end mismatches against the original request. A locally correct later stage can still be end-to-end affected.
4. Mark a later stage `AFFECTED` only when a mismatching field is connected to the earlier fault by explicit causal links and its actual value carries the linked upstream value. Later mismatches without a supporting causal path remain unlinked mismatches, never `AFFECTED` by position alone. Mark stages with neither a local nor a linked end-to-end mismatch `CORRECT`.
5. Return per-stage local status, field-level mismatches, end-to-end mismatches, computed root-cause stage (or none), downstream status, and references to explanation copy for the UI.

**Naive debugger:** a separate `findLastError(scenario)` scans the trace from Execute back to Understand and returns the final erroneous event/action based on end-to-end mismatches. It must not call or reuse the earliest-error result. This intentionally blames the final booking attempt in Scenarios A and B; in Scenario C Execute is both the earliest incorrect and final erroneous stage.

Implements `prd.md > Features and Behavior > Stage Evaluation and Timeline`, `Diagnosis Comparison`.

### App State, Interaction, and Rendering — `js/app.js`

Keep a small in-memory state with `selectedScenarioId` and `selectedStageId`. On startup, choose Scenario A and select Understand. On scenario selection, evaluate that scenario, derive both diagnoses independently, select its computed earliest incorrect stage, then update the summary, timeline, details, panels, and event log. On stage selection, update only `selectedStageId` and its detail view; keep both full-scenario diagnosis panels unchanged. Show expected trace values, actual values, and field discrepancies; for an `AFFECTED` stage, explain its locally expected behavior for the input it received and how that result still violates the original request. Do not reload the page or persist state; refresh returns to Scenario A.

Render the header and simulated badge, three scenario cards (or an equally clear selector), summary/outcome, connected timeline, side-by-side diagnoses, selected-stage expected/actual values and field discrepancies, and compact event log only when it fits the core layout. Use semantic buttons, keyboard-accessible selection, visible focus, text labels/icons alongside colors, and a polite live region for scenario/diagnosis updates. Use safe text insertion for scenario copy. Export small pure helpers from `app.js` for changing the selected stage and deriving a dashboard view model; run DOM setup only in the browser. This lets Node verify that stage inspection changes details without changing scenario-level diagnoses.

Implements `prd.md > Screens and Layout`, `Features and Behavior > Scenario Selection and Default View`, `Stage Evaluation and Timeline`, `Diagnosis Comparison`, `States and Boundaries`.

## Data Flow and State

The three local scenario objects are imported once. On initial load or scenario change, `app.js` passes the selected scenario to the evaluator and naive debugger, stores their returned results in memory, and renders them. Stage selection changes only the selected-stage ID; it does not recalculate or replace scenario-level diagnoses. No data is fetched or written to disk. Reopening starts with Scenario A.

## File Structure

```text
causaltrace-lite/
├── index.html                    # Accessible single-page dashboard structure
├── styles.css                    # Responsive dark layout and visual statuses
├── js/
│   ├── scenarios.js               # Three deterministic structured traces
│   ├── evaluator.js               # Field comparison, causal evaluator, naive diagnosis
│   └── app.js                     # State, interactions, view-model and DOM rendering
├── tests/
│   └── evaluator.test.js          # Node built-in tests; no browser required
├── package.json                   # Only { "type": "module" }; no dependencies/scripts
├── README.md                      # Local start, test, and demo instructions
└── devpost/
    ├── learner-profile.md
    ├── scope.md                   # Existing approved scope; preserve
    ├── prd.md                     # Existing approved PRD; preserve
    └── spec.md                    # This technical plan
```

## Testing Strategy

Use `node:test` and `node:assert/strict` in `tests/evaluator.test.js`, importing the same scenarios and evaluator functions as the browser app. `node --test` must verify:

1. Scenario A derives Understand as root cause and Choose/Execute as affected.
2. Scenario B derives Choose as root cause and Execute as affected.
3. Scenario C derives Execute as root cause, with no affected stages.
4. Correct stages and field-level mismatches for each scenario.
5. The naive debugger independently returns the final erroneous event/action.
6. A stage-selection state change leaves the complete-scenario diagnoses unchanged.
7. Changing explanation/label text does not change evaluator results.
8. A fully correct trace returns no root cause, no affected stages, and no invented last error.

Manually check in the browser that default selection, stage inspection, scenario switching, keyboard focus, responsive layout, diagnosis synchronization, and optional event log match the PRD. Tests do not require a browser; the dashboard itself uses only Python's server and a browser.

## Mapping to Approved PRD

| PRD requirement | Spec location and verification |
| --- | --- |
| Initial Scenario A view with Understand selected | `App State, Interaction, and Rendering`; default-load test and browser check |
| Three deterministic scenarios and expected/actual behavior | `Scenario Data`; scenario tests |
| Earliest stage derived from behavior comparison | `Evaluator and Naive Debugger`; root-cause tests for A, B, and C |
| Downstream effects shown only with causal support | `Evaluator and Naive Debugger`; A/B affected and C none tests |
| Stage inspection and diagnosis synchronization | `App State, Interaction, and Rendering`; pure state test and browser check |
| Scenario switching updates the whole dashboard without reload | `App State, Interaction, and Rendering`; browser check |
| Accessible dark dashboard and under-one-minute demo | `Look and Feel`, `App State, Interaction, and Rendering`; browser/manual demo check |
| Core insight visible within ten seconds | Default state shows root cause, affected stages, and both diagnoses immediately; browser/manual demo check |
| Local operation without API/network dependencies | `Where It Runs`, `External Services and Dependencies`; run from root with Python |
| Optional event log | `App State, Interaction, and Rendering`; omit if it crowds core layout |

## External Services and Dependencies

None. There are no external APIs, model calls, data services, remote fonts, or hosted components. Python and Node.js are local runtimes only; Node is not required to run the app.

## Important Failure Modes

- **Scenario has a missing/mismatched field or causal link** → a named Node test fails with the scenario/stage/field; fix the local data before trusting its diagnosis.
- **Local server is not running or port 8000 is unavailable** → the page cannot load; show the browser's connection message and restart `python -m http.server 8000` from the project root (or use an available port and matching URL).
- **Unexpected scenario/stage ID** → fall back to Scenario A and its computed root-cause stage, with a concise status message instead of a blank dashboard.

## What Was Simplified and Why

- Three deterministic traces rather than live agent runs: preserves the debugging insight while avoiding API cost, setup, and nondeterministic behavior.
- One dashboard and in-memory state rather than routes, accounts, or persistence: enough to demonstrate one interaction loop.
- Three JavaScript modules and browser-native styling rather than a component framework or design package: fewer setup and dependency risks in the two-hour target.
- The compact event log remains optional and is omitted if it compromises the timeline, stage details, or diagnosis panels.

## Decisions and Open Issues

- **Learner choices:** plain HTML/CSS/JavaScript modules; Python built-in server; Node built-in tests; no backend, third-party dependencies, APIs, LLM calls, or deployment.
- **Learner choices:** structured stage fields; separate evaluation from presentation; explicit causal dependencies; independent naive last-error diagnosis; shared UI state; local app with Node used only for tests.
- **Evaluator clarification:** local correctness is checked against expected behavior for the input a stage received; end-to-end correctness is checked against the original request. This explains how a locally consistent downstream stage can still be `AFFECTED` by an earlier mistake.
- **Module compatibility detail:** a dependency-free `package.json` declares ES module mode so browser and Node use the same `.js` modules with the requested `node --test` command.
- No open product or architecture decisions block review. The approved `scope.md` and `prd.md` are unchanged.
