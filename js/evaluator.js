const STAGE_ORDER = ["understand", "choose", "execute"];

function compareFields(expected = {}, actual = {}) {
  const fields = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  return [...fields]
    .filter((field) => !Object.hasOwn(expected, field)
      || !Object.hasOwn(actual, field)
      || !Object.is(expected[field], actual[field]))
    .map((field) => ({ field, expected: expected[field], actual: actual[field] }));
}

function stagePosition(stageId) {
  return STAGE_ORDER.indexOf(stageId);
}

export function evaluateScenario(scenario) {
  const orderedStages = [...scenario.stages].sort((a, b) => stagePosition(a.id) - stagePosition(b.id));
  const results = orderedStages.map((stage) => ({
    stageId: stage.id,
    localMismatches: compareFields(stage.expectedForInput, stage.actualOutput),
    endToEndMismatches: compareFields(stage.expectedOutput, stage.actualOutput),
    status: "CORRECT",
    affectedFields: [],
  }));

  const rootIndex = results.findIndex((result) => result.localMismatches.length > 0);
  const rootCauseStageId = rootIndex < 0 ? null : results[rootIndex].stageId;
  const propagatedFields = new Set();

  if (rootIndex >= 0) {
    results[rootIndex].status = "ROOT CAUSE";
    const rootStage = orderedStages[rootIndex];
    const rootEndToEndFields = new Set(results[rootIndex].endToEndMismatches.map((mismatch) => mismatch.field));
    for (const mismatch of results[rootIndex].localMismatches) {
      if (rootEndToEndFields.has(mismatch.field)) propagatedFields.add(`${rootStage.id}.${mismatch.field}`);
    }
  }

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    const stage = orderedStages[index];
    if (index === rootIndex) continue;

    const affectedFields = result.endToEndMismatches.filter((mismatch) => (
      scenario.causalDependencies.some((link) => {
        if (link.toStage !== stage.id || link.toField !== mismatch.field) return false;
        if (!propagatedFields.has(`${link.fromStage}.${link.fromField}`)) return false;

        const sourceStage = orderedStages.find((candidate) => candidate.id === link.fromStage);
        return sourceStage
          && Object.is(sourceStage.actualOutput[link.fromField], stage.actualOutput[link.toField]);
      })
    ));

    if (affectedFields.length > 0) {
      result.status = "AFFECTED";
      result.affectedFields = affectedFields.map(({ field }) => field);
      for (const field of result.affectedFields) propagatedFields.add(`${stage.id}.${field}`);
    } else if (result.localMismatches.length > 0 || result.endToEndMismatches.length > 0) {
      result.status = "UNLINKED MISMATCH";
    }
  }

  return { scenarioId: scenario.id, rootCauseStageId, stages: results };
}

export function findLastError(scenario) {
  const orderedStages = [...scenario.stages].sort((a, b) => stagePosition(b.id) - stagePosition(a.id));
  for (const stage of orderedStages) {
    const mismatches = compareFields(stage.expectedOutput, stage.actualOutput);
    if (mismatches.length > 0) {
      return {
        stageId: stage.id,
        event: stage.event,
        mismatches,
        explanation: scenario.naiveExplanation,
      };
    }
  }
  return null;
}

export { compareFields };
