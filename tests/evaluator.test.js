import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCENARIO_ID, getScenario, scenarios } from "../js/scenarios.js";
import { evaluateScenario, findLastError } from "../js/evaluator.js";
import { deriveDashboardModel } from "../js/app.js";

const expectedRoots = new Map([
  ["misunderstood-request", "understand"],
  ["wrong-restaurant", "choose"],
  ["booking-failed", "execute"],
]);

test("loads exactly three scenarios and defaults to the Understand failure", () => {
  assert.equal(scenarios.length, 3);
  assert.equal(DEFAULT_SCENARIO_ID, "misunderstood-request");
  assert.equal(getScenario(DEFAULT_SCENARIO_ID).stages[0].id, "understand");
});

test("derives each root cause, correct stage, and downstream status from values", () => {
  for (const scenario of scenarios) {
    const result = evaluateScenario(scenario);
    assert.equal(result.rootCauseStageId, expectedRoots.get(scenario.id), scenario.id);
    assert.equal(result.stages.find((stage) => stage.stageId === result.rootCauseStageId).status, "ROOT CAUSE");
  }

  const misunderstood = evaluateScenario(getScenario("misunderstood-request"));
  assert.deepEqual(misunderstood.stages.map(({ stageId, status }) => [stageId, status]), [
    ["understand", "ROOT CAUSE"], ["choose", "AFFECTED"], ["execute", "AFFECTED"],
  ]);

  const wrongRestaurant = evaluateScenario(getScenario("wrong-restaurant"));
  assert.deepEqual(wrongRestaurant.stages.map(({ stageId, status }) => [stageId, status]), [
    ["understand", "CORRECT"], ["choose", "ROOT CAUSE"], ["execute", "AFFECTED"],
  ]);

  const bookingFailed = evaluateScenario(getScenario("booking-failed"));
  assert.deepEqual(bookingFailed.stages.map(({ stageId, status }) => [stageId, status]), [
    ["understand", "CORRECT"], ["choose", "CORRECT"], ["execute", "ROOT CAUSE"],
  ]);
});

test("reports field-level expected-versus-actual differences", () => {
  const result = evaluateScenario(getScenario("booking-failed"));
  const execute = result.stages.find((stage) => stage.stageId === "execute");
  assert.deepEqual(execute.localMismatches, [{ field: "partySize", expected: 2, actual: 4 }]);
  assert.deepEqual(execute.endToEndMismatches, [{ field: "partySize", expected: 2, actual: 4 }]);
});

test("classifies affected fields only when an explicit causal link carries the bad value", () => {
  const scenario = structuredClone(getScenario("misunderstood-request"));
  scenario.causalDependencies = scenario.causalDependencies.filter((link) => link.toStage !== "choose");
  const result = evaluateScenario(scenario);
  assert.equal(result.rootCauseStageId, "understand");
  assert.equal(result.stages.find((stage) => stage.stageId === "choose").status, "UNLINKED MISMATCH");
  assert.equal(result.stages.find((stage) => stage.stageId === "execute").status, "UNLINKED MISMATCH");
});

test("naive last-error diagnosis independently blames the final erroneous action", () => {
  for (const scenario of scenarios) {
    const naive = findLastError(scenario);
    assert.equal(naive.stageId, "execute", scenario.id);
    assert.ok(naive.event);
  }
  assert.notEqual(
    evaluateScenario(getScenario("misunderstood-request")).rootCauseStageId,
    findLastError(getScenario("misunderstood-request")).stageId,
  );
});

test("stage inspection changes selected details but not scenario-level diagnoses", () => {
  const scenario = getScenario("misunderstood-request");
  const rootView = deriveDashboardModel(scenario, "understand");
  const laterView = deriveDashboardModel(scenario, "execute");
  assert.equal(rootView.selectedStage.id, "understand");
  assert.equal(laterView.selectedStage.id, "execute");
  assert.deepEqual(laterView.evaluation, rootView.evaluation);
  assert.deepEqual(laterView.naiveDiagnosis, rootView.naiveDiagnosis);
});

test("evaluation ignores human-readable explanations", () => {
  const scenario = structuredClone(getScenario("wrong-restaurant"));
  const before = evaluateScenario(scenario);
  scenario.description = "Different wording";
  scenario.rootExplanation = "Changed diagnosis copy";
  scenario.stages[1].summary = "Updated UI label";
  assert.deepEqual(evaluateScenario(scenario), before);
});

test("a fully correct trace has no root cause, affected stages, or last error", () => {
  const scenario = structuredClone(getScenario("misunderstood-request"));
  for (const stage of scenario.stages) {
    stage.actualOutput = { ...stage.expectedOutput };
    stage.expectedForInput = { ...stage.expectedOutput };
  }
  const result = evaluateScenario(scenario);
  assert.equal(result.rootCauseStageId, null);
  assert.ok(result.stages.every((stage) => stage.status === "CORRECT"));
  assert.equal(findLastError(scenario), null);
});
