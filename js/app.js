import { DEFAULT_SCENARIO_ID, getScenario, scenarios } from "./scenarios.js";
import { evaluateScenario, findLastError } from "./evaluator.js";

const stageNames = { understand: "Understand", choose: "Choose", execute: "Execute" };
const fieldNames = { cuisine: "Cuisine", date: "Date", time: "Time", partySize: "Party size", restaurantId: "Restaurant" };
const scenarioLetters = new Map(scenarios.map((scenario, index) => [scenario.id, String.fromCharCode(65 + index)]));

export function createInitialState() {
  return { selectedScenarioId: DEFAULT_SCENARIO_ID, selectedStageId: "understand" };
}

export function selectStage(state, stageId) {
  return { ...state, selectedStageId: stageId };
}

export function selectScenario(state, scenario) {
  const evaluation = evaluateScenario(scenario);
  return {
    ...state,
    selectedScenarioId: scenario.id,
    selectedStageId: evaluation.rootCauseStageId ?? "understand",
  };
}

export function deriveDashboardModel(scenario, selectedStageId = "understand") {
  const evaluation = evaluateScenario(scenario);
  const naiveDiagnosis = findLastError(scenario);
  const stageResult = evaluation.stages.find((stage) => stage.stageId === selectedStageId)
    ?? evaluation.stages.find((stage) => stage.status === "ROOT CAUSE")
    ?? evaluation.stages[0];
  const selectedStage = scenario.stages.find((stage) => stage.id === stageResult.stageId);
  return { scenario, evaluation, naiveDiagnosis, stageResult, selectedStage };
}

function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function renderFieldComparison(container, expectedValues, actualValues, mismatches = []) {
  const mismatchFields = new Set(mismatches.map((mismatch) => mismatch.field));
  const table = make("div", "diagnosis-fields");
  const header = make("div", "field-row comparison-row comparison-heading");
  header.append(make("span", "field-name", "Field"));
  header.append(make("span", "field-name", "Expected"));
  header.append(make("span", "field-name", "Actual"));
  table.append(header);

  for (const [field, expectedValue] of Object.entries(expectedValues)) {
    const row = make("div", `field-row comparison-row${mismatchFields.has(field) ? " has-mismatch" : ""}`);
    row.append(make("span", "field-name", fieldNames[field] ?? field));
    row.append(make("span", "field-value expected", String(expectedValue)));
    row.append(make("span", `field-value${mismatchFields.has(field) ? " actual" : ""}`, String(actualValues[field])));
    table.append(row);
  }
  container.append(table);
}

function renderScenarioPicker(model) {
  const container = document.querySelector("#scenario-options");
  const restoreFocus = container.contains(document.activeElement);
  container.replaceChildren();
  for (const scenario of scenarios) {
    const selected = scenario.id === model.scenario.id;
    const card = make("button", `scenario-option${selected ? " is-selected" : ""}`);
    card.type = "button";
    card.setAttribute("aria-pressed", String(selected));
    card.setAttribute("aria-label", `Scenario ${scenarioLetters.get(scenario.id)}: ${scenario.title}${selected ? ", selected" : ""}`);
    card.dataset.scenarioId = scenario.id;
    card.append(make("span", "scenario-index", `0${scenarioLetters.get(scenario.id).charCodeAt(0) - 64}`));
    const copy = make("span", "scenario-option-copy");
    copy.append(make("span", "scenario-option-title", scenario.title));
    copy.append(make("span", "scenario-option-description", scenario.description));
    card.append(copy);
    if (selected) card.append(make("span", "selected-check", "✓"));
    container.append(card);
  }
  if (restoreFocus) container.querySelector(`[data-scenario-id="${model.scenario.id}"]`)?.focus();
}

function renderTimeline(model, selectedStageId) {
  const container = document.querySelector("#stage-track");
  const restoreFocus = container.contains(document.activeElement);
  container.replaceChildren();
  const results = model.evaluation.stages;

  for (const [index, result] of results.entries()) {
    const stage = model.scenario.stages.find((candidate) => candidate.id === result.stageId);
    const selected = result.stageId === selectedStageId;
    const card = make("button", `stage-card status-${statusClass(result.status)}${selected ? " is-inspected" : ""}`);
    card.type = "button";
    card.dataset.stageId = result.stageId;
    card.setAttribute("aria-pressed", String(selected));
    card.setAttribute("aria-label", `Inspect ${stageNames[stage.id]} stage, status ${result.status}${selected ? ", currently selected" : ""}`);

    const top = make("span", "stage-top");
    const icon = result.status === "CORRECT" ? "✓" : result.status === "ROOT CAUSE" ? "!" : "↳";
    top.append(make("span", "stage-marker", icon));
    top.append(make("span", "stage-name", stage.name));
    top.append(make("span", "stage-status", result.status));
    card.append(top);
    card.append(make("span", "stage-summary", stage.summary));
    if (index < results.length - 1) {
      const nextStatus = results[index + 1].status;
      const isCausal = result.status === "ROOT CAUSE" && nextStatus === "AFFECTED"
        || result.status === "AFFECTED" && nextStatus === "AFFECTED";
      card.append(make("span", `stage-connector${isCausal ? " is-causal" : ""}`, "→"));
    }
    container.append(card);
  }
  if (restoreFocus) container.querySelector(`[data-stage-id="${selectedStageId}"]`)?.focus();
}

function renderDiagnosis(model) {
  const { scenario, evaluation, naiveDiagnosis } = model;
  const causalRoot = document.querySelector("#causal-diagnosis");
  const naiveRoot = document.querySelector("#naive-diagnosis");
  causalRoot.replaceChildren();
  naiveRoot.replaceChildren();

  const rootStage = scenario.stages.find((stage) => stage.id === evaluation.rootCauseStageId);
  if (rootStage) {
    causalRoot.append(make("p", "diagnosis-title", stageNames[rootStage.id]));
    causalRoot.append(make("p", "diagnosis-copy", scenario.rootExplanation));
    const result = evaluation.stages.find((stage) => stage.stageId === rootStage.id);
    renderFieldComparison(causalRoot, rootStage.expectedForInput, rootStage.actualOutput, result.localMismatches);
  } else {
    causalRoot.append(make("p", "empty-note", "No incorrect stage found in this trace."));
  }

  if (naiveDiagnosis) {
    const stage = scenario.stages.find((candidate) => candidate.id === naiveDiagnosis.stageId);
    naiveRoot.append(make("p", "diagnosis-title", `${stageNames[stage.id]} · final erroneous event`));
    naiveRoot.append(make("p", "diagnosis-copy", naiveDiagnosis.event));
    naiveRoot.append(make("p", "diagnosis-copy", naiveDiagnosis.explanation));
  } else {
    naiveRoot.append(make("p", "empty-note", "No erroneous event found."));
  }
}

function renderObject(container, values, mismatches = []) {
  const mismatchFields = new Set(mismatches.map((mismatch) => mismatch.field));
  const list = make("dl", "structured-values");
  for (const [field, value] of Object.entries(values)) {
    list.append(make("dt", "field-name", fieldNames[field] ?? field));
    list.append(make("dd", `field-value${mismatchFields.has(field) ? " actual" : ""}`, String(value)));
  }
  container.append(list);
}

function renderSelectedStage(model) {
  const heading = document.querySelector("#details-heading");
  const badge = document.querySelector("#selected-status");
  const details = document.querySelector("#stage-details");
  heading.textContent = stageNames[model.selectedStage.id];
  badge.textContent = model.stageResult.status;
  badge.className = `status-pill status-${statusClass(model.stageResult.status)}`;
  details.replaceChildren();

  const grid = make("div", "detail-grid");
  const input = make("div", "detail-block");
  input.append(make("span", "detail-label", "Input received"));
  renderObject(input, model.selectedStage.input);
  const expected = make("div", "detail-block");
  expected.append(make("span", "detail-label", "Expected for the original request"));
  renderObject(expected, model.selectedStage.expectedOutput, model.stageResult.endToEndMismatches);
  const localExpected = make("div", "detail-block");
  localExpected.append(make("span", "detail-label", "Expected behavior for this input"));
  renderObject(localExpected, model.selectedStage.expectedForInput, model.stageResult.localMismatches);
  const actual = make("div", "detail-block");
  actual.append(make("span", "detail-label", "Actual simulated behavior"));
  renderObject(actual, model.selectedStage.actualOutput, [
    ...model.stageResult.localMismatches,
    ...model.stageResult.endToEndMismatches,
  ]);
  grid.append(input, expected, localExpected, actual);

  const explanation = model.stageResult.status === "AFFECTED"
    ? model.selectedStage.causalExplanation
    : model.selectedStage.summary;
  grid.append(make("p", "detail-explanation", explanation ?? model.selectedStage.summary));
  if (model.stageResult.localMismatches.length > 0) {
    const localFields = model.stageResult.localMismatches.map((mismatch) => fieldNames[mismatch.field] ?? mismatch.field);
    grid.append(make("p", "detail-mismatch", `Local field mismatch: ${localFields.join(", ")}.`));
  }
  if (model.stageResult.endToEndMismatches.length > 0 && model.stageResult.status === "AFFECTED") {
    const endToEndFields = model.stageResult.endToEndMismatches.map((mismatch) => fieldNames[mismatch.field] ?? mismatch.field);
    grid.append(make("p", "detail-mismatch", `Still differs from the user's request: ${endToEndFields.join(", ")}.`));
  }
  details.append(grid);
}

function renderDashboard(model, selectedStageId) {
  document.querySelector("#scenario-label").textContent = `RESTAURANT BOOKING · SCENARIO ${scenarioLetters.get(model.scenario.id)}`;
  document.querySelector("#scenario-title").textContent = model.scenario.title;
  document.querySelector("#scenario-description").textContent = model.scenario.description;
  document.querySelector("#scenario-outcome").textContent = model.scenario.outcome;
  document.querySelector("#user-request").textContent = `USER REQUEST  “${model.scenario.request}”`;
  renderScenarioPicker(model);
  renderTimeline(model, selectedStageId);
  renderDiagnosis(model);
  renderSelectedStage(model);
}

function start() {
  let state = createInitialState();
  let scenario = getScenario(state.selectedScenarioId);

  const updateScenario = (scenarioId) => {
    scenario = getScenario(scenarioId) ?? getScenario(DEFAULT_SCENARIO_ID);
    state = selectScenario(state, scenario);
    renderDashboard(deriveDashboardModel(scenario, state.selectedStageId), state.selectedStageId);
    document.querySelector("#announcement").textContent = `${scenario.title} selected. Root cause: ${stageNames[evaluateScenario(scenario).rootCauseStageId] ?? "none"}.`;
    const diagnosisGrid = document.querySelector(".diagnosis-grid");
    diagnosisGrid.classList.remove("scenario-updated");
    requestAnimationFrame(() => diagnosisGrid.classList.add("scenario-updated"));
    window.setTimeout(() => diagnosisGrid.classList.remove("scenario-updated"), 520);
  };

  const updateStage = (stageId) => {
    state = selectStage(state, stageId);
    const model = deriveDashboardModel(scenario, state.selectedStageId);
    renderTimeline(model, state.selectedStageId);
    renderSelectedStage(model);
    document.querySelector("#announcement").textContent = `${stageNames[stageId]} selected. Scenario diagnosis unchanged.`;
  };

  document.querySelector("#scenario-options").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-scenario-id]");
    if (button && button.dataset.scenarioId !== state.selectedScenarioId) updateScenario(button.dataset.scenarioId);
  });
  document.querySelector("#stage-track").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-stage-id]");
    if (button && button.dataset.stageId !== state.selectedStageId) updateStage(button.dataset.stageId);
  });

  renderDashboard(deriveDashboardModel(scenario, state.selectedStageId), state.selectedStageId);
}

if (typeof document !== "undefined") start();
