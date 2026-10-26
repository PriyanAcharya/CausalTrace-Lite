---
doc: prd
status: approved
---

# CausalTrace Lite — Product Requirements

A local, interactive debugging dashboard for AI developers, especially beginners, that shows where a simulated restaurant-booking agent first went wrong. It compares a trace with expected behavior at each stage and contrasts the root cause with a naive last-error diagnosis. Source: `scope.md > The Unique Kernel`, `Who It's For`.

## The Core Journey

1. The user opens the dashboard. “The Misunderstood Request” is already selected, with the Understand stage selected and its root-cause details visible. The initial view communicates the root cause and downstream effects without a click.
2. The user reads the request, scenario summary, three-stage timeline, and two diagnosis panels.
3. The user selects any timeline stage to inspect its expected behavior, actual behavior, status, and causal relationship to other stages.
4. The user switches to either of the other two scenarios. The dashboard updates in place, selects the earliest incorrect stage, and synchronizes the timeline, details, comparison, and event log.

Success is seeing, within a minute, why the first incorrect stage differs from the final error blamed by a naive debugger. Source: `scope.md > The Core Loop`, `What "Working" Looks Like`.

## Screens and Layout

One dashboard surface with this visual hierarchy:

- **Header:** CausalTrace Lite name/logo, tagline “Find the first failure, not just the last error,” and a simulated-trace status badge.
- **Scenario selector and summary:** Three easy-to-switch scenario choices, with the selected title, concise description, and booking outcome.
- **Main timeline:** A large horizontal, connected UNDERSTAND → CHOOSE → EXECUTE sequence.
- **Diagnosis comparison:** Two directly comparable panels below the timeline: CausalTrace’s root-cause diagnosis and the naive debugger’s last-error diagnosis.
- **Stage details:** A synchronized detail view for the selected stage. A compact event log may appear below the main content when it fits without crowding the timeline or diagnosis panels.

Source: `scope.md > The Core Loop`, `Inspiration & Identity`.

## Look and Feel

Use a handmade early-2000s personal-website aesthetic: nostalgic, feminine, and visually distinctive rather than a generic dashboard recolored pink. Use pale blush, bubblegum and raspberry pink, soft lavender, icy blue, and white surfaces with readable dark text. Keep correctness meaning accessible: mint for `CORRECT`, raspberry red for `ROOT CAUSE`, and warm amber for `AFFECTED`, paired with labels and icons. Frame panels as small retro desktop windows with pink title bars, beveled borders, dotted dividers, scrapbook-like scenario cards, and restrained CSS-only pixel hearts and stars. Use system fonts, no external assets, and small transitions only where they clarify scenario changes. Avoid illegible pixel fonts, oversized emoji, clutter, and distracting motion. Source: `scope.md > Inspiration & Identity` and the learner's visual direction.

## Features and Behavior

### Scenario Selection and Default View

- Provide exactly three deterministic restaurant-booking scenarios with concise titles and descriptions.
- Default to **The Misunderstood Request**. On initial load, select Understand and show its `ROOT CAUSE` status, expected and actual behavior, and explanation that Choose and Execute inherit the incorrect date.
- Switching scenarios updates the title, description, outcome, trace, timeline statuses, both diagnoses, stage details, and event log in place, without a page reload.
- On each scenario switch, select that scenario’s earliest incorrect stage. Keep the selected stage, timeline, details, and diagnoses synchronized.
- Briefly highlight the updated scenario and diagnosis to signal the change.

Source: `scope.md > The Core Loop`, `What "Working" Looks Like`, `The POC Boundary`.

### Deterministic Scenarios

All scenarios use the request: “Book a table for two at an Italian restaurant tonight at 7 PM.” Each stage has an expected behavior and an actual simulated output.

| Scenario | Expected trace | Actual trace and outcome | Earliest incorrect stage and effects |
| --- | --- | --- | --- |
| **The Misunderstood Request** | Understand extracts tonight, 7 PM, Italian, party of two; Choose selects a suitable Italian restaurant while preserving those requirements; Execute books it for tonight at 7 PM. | Understand interprets tonight as tomorrow evening; Choose selects a suitable Italian restaurant using the wrong date; Execute attempts to book tomorrow at 7 PM. | Understand is `ROOT CAUSE`; Choose and Execute are `AFFECTED` because they carry forward the wrong date. |
| **The Wrong Restaurant** | Understand extracts all four requirements; Choose selects a suitable Italian restaurant; Execute books that restaurant for two tonight at 7 PM. | Understand is correct; Choose selects a Chinese restaurant; Execute successfully submits that booking. | Choose is `ROOT CAUSE`; Execute is `AFFECTED` because it carries out the incorrect restaurant choice. |
| **The Booking That Failed** | Understand extracts all four requirements; Choose selects a suitable Italian restaurant; Execute books it for two tonight at 7 PM. | Understand and Choose are correct; Execute submits a party size of four. | Execute is `ROOT CAUSE`; there are no downstream stage effects. |

Source: `scope.md > The POC Boundary`, `The Unique Kernel`.

### Stage Evaluation and Timeline

- Compare each stage’s actual simulated output with its expected behavior for the selected scenario.
- Determine the earliest incorrect stage from that comparison, not from a preassigned visual root-cause label.
- Define causal relationships between stages in each scenario’s expected trace and designed dependencies. Use those relationships to explain downstream effects; derive the earliest incorrect stage by comparing actual stage behavior with expected behavior. Do not hardcode which stage receives the `ROOT CAUSE` label.
- Mark matching stages **CORRECT** with green styling and a checkmark.
- Mark the earliest mismatch **ROOT CAUSE** with prominent red styling, a strong border or restrained glow, and a label/icon.
- Mark later incorrect stages caused by that mismatch **AFFECTED**, using softer amber or muted-red styling and a causal connector such as an arrow or dotted line. Give each affected stage a concise explanation of how the earlier mistake influenced it.
- Do not show downstream effects when none exist.
- Clicking a stage selects it and displays its expected behavior, actual behavior, correctness status, and causal relationship where relevant. The selected stage is visibly distinguished and its details stay synchronized.
- The timeline remains connected and understandable without relying on color alone.

Source: `scope.md > The Unique Kernel`, `The Core Loop`, `The POC Boundary`.

### Diagnosis Comparison

- **CausalTrace diagnosis:** Show the earliest incorrect stage, expected behavior, actual behavior, and a concise explanation of why the discrepancy matters.
- **Naive debugger diagnosis:** Show the final failed action or last erroneous event and why blaming it can miss an upstream root cause. For the Execute scenario, Execute itself is the root cause and there are no upstream symptoms to trace back from.
- Recompute and update both panels for the selected scenario. They always describe the complete scenario and remain unchanged when the user clicks a different stage to inspect it. Keep them synchronized with the selected scenario’s timeline and details.

Source: `scope.md > The Unique Kernel`, `The Core Loop`, `What "Working" Looks Like`.

## Acceptance Criteria

- [ ] On opening the local app, the default scenario is “The Misunderstood Request”; Understand is selected and its root-cause details are visible without interaction.
- [ ] Each of the three scenario choices loads its specified deterministic request, expected trace, actual trace, outcome, and diagnosis.
- [ ] The evaluation identifies Understand, Choose, and Execute respectively as the earliest incorrect stage in the three scenarios by comparing stage behavior with expected behavior.
- [ ] In “The Misunderstood Request,” the timeline shows Understand as `ROOT CAUSE` and Choose and Execute as `AFFECTED`, with explanations connecting the wrong date to later actions.
- [ ] In “The Wrong Restaurant,” the timeline shows Understand as correct, Choose as `ROOT CAUSE`, and Execute as `AFFECTED` because it submits the wrong restaurant booking.
- [ ] In “The Booking That Failed,” Understand and Choose are correct, Execute is `ROOT CAUSE`, and no downstream effect is shown.
- [ ] Selecting each stage updates the selected-stage details with its expected and actual behavior, status, and applicable causal explanation.
- [ ] Switching scenarios updates all dashboard content without reloading the page and selects the newly selected scenario’s earliest incorrect stage.
- [ ] The comparison clearly distinguishes the earliest-error diagnosis from the naive final-error diagnosis for every scenario.
- [ ] Status meaning is conveyed by labels/icons as well as color; the root cause is more visually prominent than affected stages.
- [ ] A judge can understand and interact with the core debugging story in under one minute; no API key or network service is needed.

Source: `scope.md > What "Working" Looks Like`, `The POC Boundary`.

## States and Boundaries

- **Initial:** Load the default scenario with Understand selected and the root-cause explanation visible.
- **Scenario selected:** Keep the entire dashboard synchronized to the selected deterministic trace; no loading state is needed.
- **Stage selected:** Emphasize the chosen stage and show its details; selecting a later stage does not change which stage is the root cause.
- **No scenarios or missing data:** Not part of the intended product flow; the three built-in scenarios are always present and self-contained.
- **Persistence:** No state needs to persist between visits; reopening starts at the default scenario.

## Product Decisions

- Use deterministic, self-contained simulations and no live model or external service so the demo is simple, predictable, and free to run.
- Keep the experience on one dashboard, with the root cause visible on first load, to make the insight understandable within ten seconds.
- Compare stage outputs with expected behavior to derive the earliest mismatch; display downstream errors as affected symptoms.
- Use a dark, restrained developer-tool visual style and status labels/icons alongside color.
- Keep the initial MVP to exactly three restaurant-booking scenarios, one primary failure per stage.

## What We're Building

One locally runnable dashboard with a default Understand-rooted scenario, three switchable deterministic traces, an interactive three-stage timeline, stage inspection, causal downstream status, and a synchronized comparison between earliest-error and naive last-error diagnoses. Include a compact event log only if it fits without crowding the core view.

## Deferred From the POC

- Additional scenarios or agent domains, to keep the implementation and demo small.
- The event log if it would crowd the timeline, stage details, or diagnosis comparison; those elements prove the core idea.

## Possible Later Enhancements

Add more agent workflows and scenario types, then refine tracing and visualization based on feedback.

## Non-Goals

- No live LLM calls, API keys, or external APIs; deterministic simulation is sufficient to demonstrate diagnosis.
- No actual restaurant search, booking, or external tool execution; outcomes are simulated.
- No accounts, persistence, production tracing, or deployment; none is needed for this locally runnable proof of concept.

## Open Questions

None blocking product definition or transition to the technical specification.
