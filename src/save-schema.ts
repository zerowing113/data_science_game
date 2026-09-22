// Validate the entire save before mounting any workspace. Unknown fields require
// a format migration, rather than quietly discarding potentially useful data.
type Check = (value: unknown) => boolean;
const text: Check = (v) => typeof v === 'string';
const bool: Check = (v) => typeof v === 'boolean';
const number: Check = (v) => typeof v === 'number' && Number.isFinite(v);
const integer = (min: number, max = Number.MAX_SAFE_INTEGER): Check => (v) => number(v) && Number.isSafeInteger(v) && Number(v) >= min && Number(v) <= max;
const one = (...values: unknown[]): Check => (v) => values.includes(v);
const optional = (check: Check): Check => (v) => v === undefined || check(v);
const array = (check: Check, length?: number): Check => (v) => Array.isArray(v) && (length === undefined || v.length === length) && v.every(check);
const object = (fields: Record<string, Check>): Check => (v) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const data = v as Record<string, unknown>;
  return Object.keys(data).every((key) => Object.hasOwn(fields, key)) && Object.entries(fields).every(([key, check]) => check(data[key]));
};
const either = (...checks: Check[]): Check => (v) => checks.some((check) => check(v));
const strings = array(text);
const predictions = array((v) => number(v) && Number(v) >= 0);
const weekPredictions: Check = (v) => predictions(v) && (v as unknown[]).length === 7;
const feature = one('trend', 'promotions');
const timing = one('closing', 'known');
const preparation = one('untreated', 'median');
const finalChoice = one('trend', 'promotions', 'closing');
const leakageCheck = object({ validity: one('valid', 'leaked', 'unverified'), reason: text, forecastPredictions: optional(weekPredictions), forecastError: optional(text) });
const resultFields = { predictions, output: text, features: optional(text), modelConfiguration: optional(text), leakageCheck: optional(leakageCheck), programValidity: optional(one('valid', 'unverified')), type: optional(one('result')), id: optional(integer(0)) };
const result = object(resultFields);
const weekResult = object({ ...resultFields, predictions: weekPredictions });
const source = { number: integer(1), code: text, expectation: text };
const forecastSource = { ...source, choice: feature };
const forecast = object({ ...forecastSource, ...resultFields, predictions: weekPredictions });
const evaluationSource = { ...forecastSource, trainingDays: one(14, 21) };
const scoreFields = { modelMae: number, baselineMae: number, rows: array(object({ date: text, actual: number, baseline: number, predicted: number, baselineError: number, modelError: number })) };
const matchesEvaluation: Check = (v) => {
  const record = v as { trainingDays?: number; predictions: unknown[]; rows: unknown[] };
  const length = record.trainingDays === 14 ? 14 : 7;
  return record.predictions.length === length && record.rows.length === length;
};
const evaluation: Check = (v) => object({ ...evaluationSource, ...resultFields, ...scoreFields })(v) && matchesEvaluation(v);
const historyRecord = object({ ...forecastSource, trainingDays: optional(one(14, 21)), result: optional(result), error: optional(text) });
const missingSource = { ...source, choice: preparation, practiceRepair: optional(bool), trainingDates: strings, evaluationDates: strings };
const missing = either(object({ ...missingSource, status: one('failed', 'interrupted'), error: text }), (v) => object({ ...missingSource, status: one('completed'), ...resultFields, ...scoreFields })(v) && matchesEvaluation(v));
const timingSource = { ...source, choice: timing, practiceRepair: optional(bool) };
const leakage: Check = (v) => object({ ...timingSource, ...resultFields, ...scoreFields, leakageCheck })(v) && matchesEvaluation(v);
const failure = object({ ...timingSource, validity: one('unverified'), error: text });
const totals = { stock: number, demand: number, fulfilled: number, lost: number, leftover: number, revenueCents: number, purchaseCents: number, salvageCents: number, profitCents: number };
const shopFields = { rows: array(object({ date: text, ...totals }), 7), totals: object(totals) };
const decision = object({ ...shopFields, number: integer(1), experiment: forecast, replay: bool });
const evidenceChecks = {
  explore: object({ step: one('explore'), day: integer(0, 27), column: one('date', 'day', 'promotion', 'demand') }),
  forecast: object({ step: one('forecast'), record: forecast }),
  evaluate: object({ step: one('evaluate'), record: evaluation }),
  repair: object({ step: one('repair'), record: missing }),
  timing: object({ step: one('timing'), record: leakage }),
  stock: object({ step: one('stock'), record: decision }),
};
const stepMap = (check: Check) => object(Object.fromEntries(Object.keys(evidenceChecks).map((key) => [key, optional(check)])));
const evidence = either(...Object.values(evidenceChecks));
const finalAttempt = object({ ...source, choice: finalChoice, result: optional(weekResult), error: optional(text) });
const submission = object({
  seed: integer(1, 10000), attempt: finalAttempt, attempts: array(finalAttempt), reflection: object({ features: text, evaluation: text, stocking: text }), complete: bool, practice: array(evidence),
  rows: array(object({ date: text, day: number, promotion: number, demand: number, predicted: number, baseline: number }), 7), modelMae: number, baselineMae: number, shop: object(shopFields), eligible: bool,
});
const python = object({ phase: one('loading', 'ready', 'running', 'complete', 'error', 'unavailable'), message: text, result: optional(result) });

const fields: Record<string, Check> = {
  'mission': object({ active: bool, current: integer(0, 5), evidence: object(Object.fromEntries(Object.entries(evidenceChecks).map(([key, check]) => [key, optional(check)]))), observed: stepMap(bool), hints: stepMap(integer(0, 3)) }),
  'forecast.submitted': object(forecastSource), 'forecast.previous': forecast,
  'forecast.history': array(historyRecord), 'evaluation.history': array(historyRecord),
  'evaluation.trainingDays': one(14, 21), 'evaluation.submitted': object(evaluationSource), 'evaluation.runs': array(evaluation),
  'missing.submitted': object(missingSource), 'missing.records': array(missing),
  'timing.repairStage': bool, 'timing.submitted': object(timingSource), 'timing.runs': array(leakage), 'timing.failures': array(failure),
  'stock.selected': forecast, 'stock.draft': strings, 'stock.committed': bool, 'stock.decisions': array(decision),
  'final.seed': integer(1, 10000), 'final.attempts': array(finalAttempt), 'final.pending': finalAttempt, 'final.preview': finalAttempt, 'final.stock': strings, 'final.submissions': array(submission),
  'history.inspectedDay': integer(0, 27), 'history.inspectedColumn': one('date', 'day', 'promotion', 'demand'), 'history.viewedFuture': bool, 'history.column': one('date', 'day', 'promotion', 'demand'), 'history.tab': one('history', 'future'), 'history.sort': one('date-asc', 'date-desc', 'promotion-asc', 'promotion-desc', 'demand-asc', 'demand-desc'), 'history.selectedDay': integer(0, 34), 'history.chartSelection': integer(0),
};
for (const [area, choice] of Object.entries({ forecast: feature, evaluation: feature, missing: preparation, timing, final: finalChoice })) {
  fields[`${area}.choice`] = choice;
  fields[`${area}.code`] = text;
  fields[`${area}.expectation`] = text;
  fields[`${area}.python`] = python;
}
for (const key of ['finalOpen', 'finalStarted', 'evaluationOpen', 'missingDataOpen', 'leakageOpen']) fields[`workspace.${key}`] = bool;

export function readJourney(raw: string): Record<string, unknown> {
  const save: unknown = JSON.parse(raw);
  const envelope = object({ version: one(1), values: object(Object.fromEntries(Object.entries(fields).map(([key, check]) => [key, optional(check)]))) });
  if (!envelope(save)) throw new Error('Unreadable or incompatible save');
  const values = (save as { values: Record<string, unknown> }).values;
  // Shapes alone cannot establish that evidence is usable. Reject incomplete
  // result arrays and contradictory final states rather than inventing progress.
  const checkLengths = (value: unknown): boolean => {
    if (!value || typeof value !== 'object') return true;
    if (Array.isArray(value)) return value.every(checkLengths);
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.predictions) && ![7, 14].includes(record.predictions.length)) return false;
    if (Array.isArray(record.rows) && ![7, 14].includes(record.rows.length)) return false;
    if (record.phase === 'complete' && !record.result) return false;
    if (record.phase !== undefined && record.phase !== 'complete' && record.result) return false;
    return Object.values(record).every(checkLengths);
  };
  if (!checkLengths(values)) throw new Error('Incomplete experiment evidence');
  const seed = Number(values['final.seed'] ?? 1);
  const submissions = (values['final.submissions'] ?? []) as { seed: number; attempt: { result?: unknown } }[];
  if (submissions.some((item) => item.seed > seed || !item.attempt.result) || new Set(submissions.map((item) => item.seed)).size !== submissions.length ||
      (seed > 1 && !submissions.some((item) => item.seed === seed - 1))) throw new Error('Inconsistent revealed challenges');
  for (const area of ['forecast', 'evaluation', 'missing', 'timing', 'final']) {
    const state = values[`${area}.python`] as { phase: string; result?: { predictions: number[] } } | undefined;
    const submitted = values[`${area}.submitted`] as { trainingDays?: number } | undefined;
    const expected = area === 'evaluation' && submitted?.trainingDays === 14 ? 14 : 7;
    if (state?.result && (state.result.predictions.length !== expected || (area !== 'final' && !submitted))) throw new Error('Incomplete run source');
  }
  return values;
}
