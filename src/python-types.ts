import type { scenario } from './scenario';

export type RunRequest = {
  id: number;
  code: string;
  scenario: typeof scenario;
};

export type PythonMessage =
  | { type: 'loading'; message: string }
  | { type: 'ready' }
  | { type: 'result'; id: number; predictions: number[]; output: string }
  | { type: 'error'; id?: number; message: string };
