import { evaluationStarter } from './evaluation';
import type { PythonResult } from './python-types';
import { simulateShop } from './shop';

export type FinalChoice = 'trend' | 'promotions' | 'closing';
export const finalFeatures = { trend: '["day"]', promotions: '["day", "promotion"]', closing: '["closing_requested_units"]' };
export const approvedFinalPrograms = [evaluationStarter('trend'), evaluationStarter('promotions')];
export function finalStarter(choice: FinalChoice) {
  return `import pandas as pd
from sklearn.linear_model import LinearRegression
features = ${finalFeatures[choice]}
# Train on history and return a pandas Series indexed by future.index.
raise NotImplementedError("Write your final model")`;
}

// The seed determines both the dates and demand rule. Answers belong to the
// scoring side, never the scenario sent to learner Python. This is not security.
export function finalChallenge(seed: number) {
  const base = 30 + seed * 10;
  const trend = seed % 2 ? 2 : 1;
  const lift = 30 + 6 * (seed % 4);
  const days = Array.from({ length: 28 }, (_, day) => {
    const date = new Date(Date.UTC(2026, 9, 5 + (seed - 1) * 35 + day)).toISOString().slice(0, 10);
    const promotion = Number(day >= 20 || day % 7 === 4 || day % 7 === 5);
    return { date, day, promotion, demand: base + trend * day + lift * promotion };
  });
  const history = days.slice(0, 21).map((row) => ({ ...row, closing_requested_units: row.demand }));
  const answers = days.slice(21);
  return { seed, history, future: answers.map(({ demand: _demand, ...inputs }) => inputs), answers, baseline: history[20].demand };
}

export type FinalAttempt = { number: number; code: string; expectation: string; choice: FinalChoice; result?: PythonResult; error?: string };
export type FinalReflection = { features: string; evaluation: string; stocking: string };
export const emptyReflection = (): FinalReflection => ({ features: '', evaluation: '', stocking: '' });
export const reflectionComplete = (reflection: FinalReflection) => Object.values(reflection).every((value) => value.trim());

export function scoreFinal(challenge: ReturnType<typeof finalChallenge>, attempt: FinalAttempt, stock: number[]) {
  const predictions = attempt.result?.predictions;
  if (!predictions || predictions.length !== challenge.answers.length || predictions.some((value) => !Number.isFinite(value) || value < 0)) throw new Error('A successful dated forecast is required.');
  const rows = challenge.answers.map((row, index) => ({ ...row, predicted: predictions[index], baseline: challenge.baseline }));
  const modelMae = rows.reduce((sum, row) => sum + Math.abs(row.demand - row.predicted), 0) / rows.length;
  const baselineMae = rows.reduce((sum, row) => sum + Math.abs(row.demand - row.baseline), 0) / rows.length;
  return { rows, modelMae, baselineMae, shop: simulateShop(stock, challenge.answers), eligible: attempt.result?.programValidity === 'valid' && modelMae < baselineMae };
}
