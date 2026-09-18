import { evaluationSplit, scoreEvaluation } from './evaluation';
import type { PythonResult } from './python-types';

export type PreparationChoice = 'untreated' | 'median';
export type MissingDataAttempt = {
  number: number;
  code: string;
  expectation: string;
  choice: PreparationChoice;
  trainingDates: string[];
  evaluationDates: string[];
} & (
  | { status: 'failed' | 'interrupted'; error: string }
  | ({ status: 'completed' } & PythonResult & ReturnType<typeof scoreEvaluation>)
);

const split = evaluationSplit(21);
export const missingDataFixture = {
  history: split.history.map((row) => ({ ...row, day: row.day === 10 ? null : row.day })),
  future: split.future.map((row) => ({ ...row, day: row.day === 24 ? null : row.day })),
};
export const missingDataDates = {
  training: split.history.map((row) => row.date),
  evaluation: split.heldOut.map((row) => row.date),
};
export const preparationLabels: Record<PreparationChoice, string> = {
  untreated: 'Leave missing values untreated',
  median: 'Fill with training medians',
};
export function missingDataStarter(choice: PreparationChoice) {
  const preparation = choice === 'median'
    ? `from sklearn.impute import SimpleImputer
imputer = SimpleImputer(strategy="median")
# Learn fill values ONLY from earlier training rows.
X_train = imputer.fit_transform(history[features])
# Apply the same learned values to later inputs; do not fit again.
X_future = imputer.transform(future[features])
print("Training fill values:", dict(zip(features, imputer.statistics_)))`
    : `# Try the incomplete inputs first.
X_train = history[features]
X_future = future[features]`;
  return `import pandas as pd
from sklearn.linear_model import LinearRegression

features = ["day", "promotion"]
${preparation}

model = LinearRegression()
model.fit(X_train, history["demand"])
predictions = pd.Series(model.predict(X_future), index=future.index)`;
}
