import { useEffect, useRef, useState } from 'react';
import type { PythonMessage, RunRequest } from './python-types';

type PythonState = {
  phase: 'loading' | 'ready' | 'running' | 'complete' | 'error' | 'unavailable';
  message: string;
  result?: { predictions: number[]; output: string };
};

export function usePython() {
  const [state, setState] = useState<PythonState>({ phase: 'loading', message: 'Loading Python…' });
  const worker = useRef<Worker | null>(null);
  const sequence = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const instance = new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' });
    worker.current = instance;
    const unavailable = (message: string) => {
      clearTimeout(timeout.current);
      instance.terminate();
      setState({ phase: 'unavailable', message });
    };
    timeout.current = setTimeout(() => unavailable('Python took too long to load. Reload the page to try again.'), 120_000);
    instance.onerror = () => unavailable('Python stopped unexpectedly. Reload the page to try again.');
    instance.onmessage = ({ data }: MessageEvent<PythonMessage>) => {
      if (data.type === 'loading') {
        setState({ phase: 'loading', message: data.message });
        return;
      }
      if ('id' in data && data.id !== undefined && data.id !== sequence.current) return;
      clearTimeout(timeout.current);
      if (data.type === 'ready') setState({ phase: 'ready', message: 'Python is ready' });
      if (data.type === 'result') setState({ phase: 'complete', message: 'Forecast ready', result: data });
      if (data.type === 'error') setState({ phase: data.id === undefined ? 'unavailable' : 'error', message: data.message });
    };
    return () => {
      clearTimeout(timeout.current);
      instance.terminate();
    };
  }, []);

  function run(request: Omit<RunRequest, 'id'>) {
    if (!worker.current || ['loading', 'running', 'unavailable'].includes(state.phase)) return;
    const id = ++sequence.current;
    setState({ phase: 'running', message: 'Training your model…' });
    worker.current.postMessage({ ...request, id });
    timeout.current = setTimeout(() => {
      worker.current?.terminate();
      setState({ phase: 'unavailable', message: 'This run took too long. Reload the page to start a fresh Python session.' });
    }, 60_000);
  }

  return { ...state, run };
}
