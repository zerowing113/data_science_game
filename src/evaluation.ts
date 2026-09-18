import { featureLine, scenario, type FeatureChoice } from './scenario';

export type TrainingDays = 14 | 21;

export function evaluationSplit(trainingDays: TrainingDays) {
  const history = scenario.history.slice(0, trainingDays);
  const heldOut = scenario.history.slice(trainingDays);
  return {
    history,
    heldOut,
    future: heldOut.map(({ demand: _demand, ...inputs }) => inputs),
    baseline: history[history.length - 1].demand,
  };
}

export function evaluationStarter(choice: FeatureChoice) {
  return `import pandas as pd
from sklearn.linear_model import LinearRegression

# history contains only the earlier training days.
# future contains later evaluation inputs, without their demand answers.
${featureLine(choice)}
model = LinearRegression()
model.fit(history[features], history["demand"])

# Keep each prediction attached to its evaluation date.
predictions = pd.Series(model.predict(future[features]), index=future.index)`;
}

export function scoreEvaluation(trainingDays: TrainingDays, predictions: number[]) {
  const split = evaluationSplit(trainingDays);
  if (predictions.length !== split.heldOut.length || predictions.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('A comparison needs a valid prediction for every evaluation day.');
  }
  const rows = split.heldOut.map((row, index) => ({
    date: row.date, actual: row.demand, baseline: split.baseline, predicted: predictions[index],
    baselineError: Math.abs(row.demand - split.baseline), modelError: Math.abs(row.demand - predictions[index]),
  }));
  return {
    rows,
    baselineMae: rows.reduce((sum, row) => sum + row.baselineError, 0) / rows.length,
    modelMae: rows.reduce((sum, row) => sum + row.modelError, 0) / rows.length,
  };
}
