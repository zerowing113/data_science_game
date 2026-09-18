import { useCallback, useEffect, useRef, useState } from 'react';
import type { PythonMessage, PythonResult, RunRequest } from './python-types';

type PythonState = {
  phase: 'loading' | 'ready' | 'running' | 'complete' | 'error' | 'unavailable';
  message: string;
  result?: PythonResult;
};

export function usePython() {
  const [state, setState] = useState<PythonState>({ phase: 'loading', message: 'Loading Python…' });
  const worker = useRef<Worker | null>(null);
  const sequence = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const terminate = useCallback(() => {
    clearTimeout(timeout.current);
    const previous = worker.current;
    worker.current = null;
    previous?.terminate();
  }, []);

  const reset = useCallback(() => {
    terminate();
    ++sequence.current;
    setState({ phase: 'loading', message: 'Loading a fresh Python session…' });
    const instance = new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' });
    worker.current = instance;
    const unavailable = (message: string) => {
      if (worker.current !== instance) return;
      terminate();
      setState({ phase: 'unavailable', message });
    };
    timeout.current = setTimeout(() => unavailable('Python took too long to load. Reset Python to try again.'), 120_000);
    instance.onerror = () => unavailable('Python stopped unexpectedly. Reset Python to try again.');
    instance.onmessage = ({ data }: MessageEvent<PythonMessage>) => {
      // A terminated worker may still have queued events. Ignore every event
      // from that session, including loading, ready, and startup errors.
      if (worker.current !== instance) return;
      if ('id' in data && data.id !== undefined && data.id !== sequence.current) return;
      if (data.type === 'loading') {
        setState({ phase: 'loading', message: data.message });
        return;
      }
      clearTimeout(timeout.current);
      if (data.type === 'ready') setState({ phase: 'ready', message: 'Python is ready' });
      if (data.type === 'result') setState({ phase: 'complete', message: 'Forecast ready', result: data });
      if (data.type === 'error') {
        if (data.id === undefined) unavailable(`${data.message}\nReset Python to try again.`);
        else setState({ phase: 'error', message: data.message });
      }
    };
  }, [terminate]);

  useEffect(() => {
    reset();
    return terminate;
  }, [reset, terminate]);

  function stop() {
    if (state.phase !== 'running') return;
    terminate();
    ++sequence.current;
    setState({ phase: 'unavailable', message: 'Run stopped. Reset Python to start a fresh session. Your code and prediction are kept.' });
  }

  function run(request: Omit<RunRequest, 'id'>) {
    const instance = worker.current;
    if (!instance || ['loading', 'running', 'unavailable'].includes(state.phase)) return;
    const id = ++sequence.current;
    setState({ phase: 'running', message: 'Training your model…' });
    instance.postMessage({ ...request, id });
    timeout.current = setTimeout(() => {
      if (worker.current !== instance || sequence.current !== id) return;
      terminate();
      setState({ phase: 'unavailable', message: 'This run took too long and was stopped. Reset Python to start a fresh session. Your code and prediction are kept.' });
    }, 60_000);
  }

  return { ...state, run, stop, reset };
}
