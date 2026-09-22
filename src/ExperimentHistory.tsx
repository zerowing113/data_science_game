import { useEffect } from 'react';
import { useSavedState } from './journey';
import type { PythonResult } from './python-types';

type Source = { number: number; code: string; expectation: string; choice: string; trainingDays?: number };
type Record = Source & { result?: PythonResult; error?: string };

export function useExperimentHistory(area: 'forecast' | 'evaluation', submitted: Source | undefined,
  python: { phase: string; message: string; result?: PythonResult }) {
  const [records, setRecords] = useSavedState<Record[]>(`${area}.history`, []);
  useEffect(() => {
    if (!submitted || !['complete', 'error', 'unavailable'].includes(python.phase)) return;
    const record = { ...submitted, ...(python.result ? { result: python.result } : { error: python.message }) };
    setRecords((previous) => previous.some((item) => item.number === record.number) ? previous : [...previous, record]);
  }, [submitted, python.phase, python.message, python.result, setRecords]);
  function interrupt() {
    if (!submitted || python.phase !== 'running') return;
    const record = { ...submitted, error: 'Run interrupted by reset. No forecast or score.' };
    setRecords((previous) => previous.some((item) => item.number === record.number) ? previous : [...previous, record]);
  }
  return { records, interrupt };
}

export function ExperimentHistory({ area, records }: { area: 'forecast' | 'evaluation'; records: Record[] }) {
  if (!records.length) return null;
  return <details><summary>{area === 'forecast' ? 'Forecast' : 'Comparison'} experiment history ({records.length} runs)</summary>
    {records.map((record) => <details key={record.number}><summary>Run {record.number}: {record.error ? 'failed or interrupted' : 'completed'}</summary>
      <p>Original choice: {record.choice}. Expected: {record.expectation}{record.trainingDays && ` Training days: ${record.trainingDays}.`}</p>
      <pre>{record.code}</pre>{record.error ? <pre>{record.error}</pre> : <><p>Predictions: {record.result?.predictions.map((value) => value.toFixed(1)).join(', ')}</p><pre>{record.result?.output}</pre></>}
    </details>)}
  </details>;
}
