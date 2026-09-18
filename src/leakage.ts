import { evaluationSplit, scoreEvaluation } from './evaluation';
import { scenario } from './scenario';
import type { LeakageCheck, PythonResult } from './python-types';

export type TimingChoice = 'closing' | 'known';
export const timingFeatures = { closing: '["closing_requested_units"]', known: '["day", "promotion"]' };
export const timingAssignment = /^features = \[(?:"closing_requested_units"|"day"(?:, "promotion")?)\]$/m;
export function leakageStarter(choice: TimingChoice) {
  return `import pandas as pd
from sklearn.linear_model import LinearRegression

# Compare on later historical dates, then try the same code before next week.
features = ${timingFeatures[choice]}
model = LinearRegression()
model.fit(history[features], history["demand"])
predictions = pd.Series(model.predict(future[features]), index=future.index)`;
}

const split = evaluationSplit(21);
// A deliberately tempting fictional closing report, counting all requests,
// including unfulfilled demand. It is not fulfilled sales or a planned input.
export const leakageScenario = {
  history: split.history.map((row) => ({ ...row, closing_requested_units: row.demand })),
  future: split.heldOut.map(({ demand, ...inputs }) => ({ ...inputs, closing_requested_units: demand })),
};
export const leakageForecast = {
  history: scenario.history.map((row) => ({ ...row, closing_requested_units: row.demand })),
  future: scenario.future.map((row) => ({ ...row })),
};
export const approvedTimingPrograms = [leakageStarter('closing'), leakageStarter('known'), leakageStarter('known').replace('["day", "promotion"]', '["day"]')];
export type LeakageAttempt = { number: number; code: string; expectation: string; choice: TimingChoice };
export type LeakageExperiment = LeakageAttempt & PythonResult & ReturnType<typeof scoreEvaluation> & { leakageCheck: LeakageCheck };
export type FailedTimingAttempt = LeakageAttempt & { validity: 'unverified'; error: string };
