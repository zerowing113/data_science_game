import type { scenario } from './scenario';

export type RunRequest = {
  id: number;
  code: string;
  scenario: typeof scenario;
  evaluationDates?: string[];
};

export type PythonResult = { predictions: number[]; output: string; features?: string; modelConfiguration?: string };

export type PythonMessage =
  | { type: 'loading'; message: string }
  | { type: 'ready' }
  | ({ type: 'result'; id: number } & PythonResult)
  | { type: 'error'; id?: number; message: string };
