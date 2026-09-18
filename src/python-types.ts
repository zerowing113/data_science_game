export type PythonScenario = {
  history: Record<string, string | number | null>[];
  future: Record<string, string | number | null>[];
};

export type RunRequest = {
  id: number;
  code: string;
  scenario: PythonScenario;
  evaluationDates?: string[];
  approvedPrograms?: string[];
  leakageCheck?: { forecast: PythonScenario; approvedPrograms: string[] };
};

export type LeakageCheck = { validity: 'valid' | 'leaked' | 'unverified'; reason: string; forecastPredictions?: number[]; forecastError?: string };
export type PythonResult = { predictions: number[]; output: string; features?: string; modelConfiguration?: string; leakageCheck?: LeakageCheck; programValidity?: 'valid' | 'unverified' };

export type PythonMessage =
  | { type: 'loading'; message: string }
  | { type: 'ready' }
  | ({ type: 'result'; id: number } & PythonResult)
  | { type: 'error'; id?: number; message: string };
