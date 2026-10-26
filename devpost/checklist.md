---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. You can see the earliest failure and the naive last-error diagnosis**
  Becomes usable: A locally served dashboard opens on Scenario A and shows a three-stage trace, the derived Understand root cause, its affected downstream stages, and the separate naive final-error diagnosis. The scenario data and evaluator are independently testable across all three scenarios.
  Why now: This proves the unique kernel early and puts bootstrapping, deterministic data, evaluator logic, naive diagnosis, and its tests on a runnable path before visual polish.
  PRD ref: `prd.md > The Core Journey`, `Features and Behavior > Deterministic Scenarios`, `Features and Behavior > Stage Evaluation and Timeline`, `Features and Behavior > Diagnosis Comparison`, `Acceptance Criteria`
  Spec ref: `spec.md > Components > Scenario Data`, `Components > Evaluator and Naive Debugger`, `Where It Runs and How Someone Tries It`, `Testing Strategy`, `File Structure`
  Build: Create the root HTML/CSS/JS-module scaffold and dependency-free module declaration; add all three structured scenario traces and explicit causal links; implement field-by-field local and end-to-end evaluation plus the separate reverse-order naive diagnosis; add Node tests; render a functional default Scenario A timeline and both diagnosis panels.
  Verify (mechanical): Run `node --test`; start `python -m http.server 8000` from the project root; request `http://localhost:8000` and confirm the dashboard HTML loads.
  Learner check: Open `http://localhost:8000` and describe which stage is the root cause, which later stages are affected, and which final action the naive diagnosis blames.
  Commit: `Build deterministic root-cause diagnosis slice`

- [ ] **2. You can inspect stages and switch between all three scenarios**
  Becomes usable: The responsive dark dashboard supports scenario selection, stage inspection, synchronized details and diagnosis panels, accessible status labels, and clear causal explanations. README instructions cover running, testing, and recording the demo.
  Why now: With the diagnosis kernel verified, this completes the judge-facing interaction and visual hierarchy without risking the core evaluator.
  PRD ref: `prd.md > Screens and Layout`, `Look and Feel`, `Features and Behavior > Scenario Selection and Default View`, `Features and Behavior > Stage Evaluation and Timeline`, `Features and Behavior > Diagnosis Comparison`, `States and Boundaries`, `Acceptance Criteria`
  Spec ref: `spec.md > Components > App State, Interaction, and Rendering`, `Look and Feel`, `Data Flow and State`, `Testing Strategy`, `Important Failure Modes`
  Build: Add scenario cards and in-place switching; stage selection and expected/actual details; scenario-level diagnosis panels that do not change on stage clicks; responsive styling, keyboard focus and reduced-motion support; scenario transition feedback; optional compact event log if it fits; and README setup, run, test, and demo steps. Extend state/UI tests as specified.
  Verify (mechanical): Run `node --test`; start the app with `python -m http.server 8000`; verify the server returns the app and local assets successfully. Inspect the browser console and manually exercise all scenarios, stage selection, scenario switching, and a narrow viewport when browser tools are available.
  Learner check: Switch through Scenarios A, B, and C; inspect multiple stages; confirm each scenario selects its computed root cause and that both diagnosis panels stay fixed while only stage details change.
  Commit: `Complete interactive CausalTrace dashboard`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after Slice 1; learner tries the default root-cause versus last-error view and can influence clarity before dashboard polish.
- [ ] Final kick-the-tires exploration and feedback completed — after Slice 2; learner tries all three scenarios and stage inspection.

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [what actually happened; real document/test/code references; unfinished work if interrupted]
Route and stops: [actual paths and symbols; guided stops completed, or reference-only route]
Edit outcome: [tried/kept/reverted/declined/not applicable; verification if changed]
Reflection: [offered/answered/declined/already covered — personal answer belongs only in the ignored profile]
Activity mode: [live app and editor, explicit static fallback, focused alternative, prior practice, or recap]

## Revisions
