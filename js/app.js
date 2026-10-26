import { DEFAULT_SCENARIO_ID, getScenario } from "./scenarios.js";
import { evaluateScenario, findLastError } from "./evaluator.js";

const stageNames = { understand: "Understand", choose: "Choose", execute: "Execute" };
const fieldNames = { cuisine: "Cuisine", date: "Date", time: "Time", partySize: "Party size", restaurantId: "Restaurant" };

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

function renderFieldList(container, values, mismatches = []) {
  const mismatchFields = new Set(mismatches.map((mismatch) => mismatch.field));
  const list = make("div", "diagnosis-fields");
  for (const [field, value] of Object.entries(values)) {
    const row = make("div", "field-row");
    row.append(make("span", "field-name", fieldNames[field] ?? field));
    row.append(make("span", `field-value${mismatchFields.has(field) ? " actual" : ""}`, String(value)));
    list.append(row);
  }
  container.append(list);
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
    naiveRoot.append(make("p", "diagnosis-title", `${stageNames[stage.id]} · final mismatching action`));
    naiveRoot.append(make("p", "diagnosis-copy", naiveDiagnosis.event));
    naiveRoot.append(make("p", "diagnosis-copy", naiveDiagnosis.explanation));
  } else {
    naiveRoot.append(make("p", "empty-note", "No erroneous event found."));
  }
}

function renderTimeline(model) {
  const container = document.querySelector("#stage-track");
  container.replaceChildren();
  for (const [index, result] of model.evaluation.stages.entries()) {
    const stage = model.scenario.stages.find((candidate) => candidate.id === result.stageId);
    const card = make("article", `stage-card status-${result.status.toLowerCase().replaceAll(" ", "-")}`);
    const top = make("div", "stage-top");
    const icon = result.status === "CORRECT" ? "✓" : result.status === "ROOT CAUSE" ? "!" : "↳";
    top.append(make("span", "stage-marker", icon));
    top.append(make("span", "stage-name", stage.name));
    top.append(make("span", "stage-status", result.status));
    card.append(top);
    card.append(make("p", "stage-summary", stage.summary));
    if (index < model.evaluation.stages.length - 1) card.append(make("span", "stage-connector", "→"));
    container.append(card);
  }
}

function renderSelectedStage(model) {
  const heading = document.querySelector("#details-heading");
  const badge = document.querySelector("#selected-status");
  const details = document.querySelector("#stage-details");
  heading.textContent = stageNames[model.selectedStage.id];
  badge.textContent = model.stageResult.status;
  badge.className = `status-pill status-${model.stageResult.status.toLowerCase().replaceAll(" ", "-")}`;
  details.replaceChildren();

  const grid = make("div", "detail-grid");
  const expected = make("div", "detail-block");
  expected.append(make("span", "detail-label", "Expected for the original request"));
  expected.append(make("div", "detail-value", JSON.stringify(model.selectedStage.expectedOutput, null, 2)));
  const actual = make("div", "detail-block");
  actual.append(make("span", "detail-label", "Actual simulated behavior"));
  actual.append(make("div", "detail-value", JSON.stringify(model.selectedStage.actualOutput, null, 2)));
  grid.append(expected, actual);
  grid.append(make("p", "detail-explanation", model.selectedStage.summary));
  details.append(grid);
}

function renderDashboard(model) {
  document.querySelector("#scenario-title").textContent = model.scenario.title;
  document.querySelector("#scenario-description").textContent = model.scenario.description;
  document.querySelector("#scenario-outcome").textContent = model.scenario.outcome;
  document.querySelector("#user-request").textContent = `USER REQUEST  “${model.scenario.request}”`;
  renderTimeline(model);
  renderDiagnosis(model);
  renderSelectedStage(model);
}

function start() {
  const scenario = getScenario(DEFAULT_SCENARIO_ID);
  renderDashboard(deriveDashboardModel(scenario, "understand"));
}

if (typeof document !== "undefined") start();
