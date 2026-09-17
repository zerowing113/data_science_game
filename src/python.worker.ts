import type { PyodideInterface } from 'pyodide';
import type { PythonMessage, RunRequest } from './python-types';

const send = (message: PythonMessage) => self.postMessage(message);
let python: PyodideInterface;
let output = '';

async function initialize() {
  try {
    send({ type: 'loading', message: 'Loading Python…' });
    const moduleUrl = `${self.location.origin}/python/pyodide.mjs`;
    const { loadPyodide } = await import(/* @vite-ignore */ moduleUrl);
    python = await loadPyodide({ indexURL: `${self.location.origin}/python/` });
    send({ type: 'loading', message: 'Loading pandas & scikit-learn…' });
    await python.loadPackage(['pandas', 'scikit-learn']);
    python.setStdout({ batched: (line) => { output = (output + line + '\n').slice(-8000); } });
    python.setStderr({ batched: (line) => { output = (output + line + '\n').slice(-8000); } });
    send({ type: 'ready' });
  } catch (error) {
    send({ type: 'error', message: `Python could not load. ${String(error)}` });
  }
}

self.onmessage = async ({ data }: MessageEvent<RunRequest>) => {
  const globals = python.toPy({ scenario_json: JSON.stringify(data.scenario) });
  output = '';
  try {
    await python.runPythonAsync(`import json
import pandas as pd
_scenario = json.loads(scenario_json)
history = pd.DataFrame(_scenario["history"])
future = pd.DataFrame(_scenario["future"])
`, { globals });
    await python.runPythonAsync(data.code, { globals });
    // Read predictions from this run's fresh namespace, never a previous run.
    const encoded = await python.runPythonAsync(`import json as _result_json
import numpy as _result_numpy
_values = _result_numpy.asarray(predictions)
if _values.ndim != 1 or len(_values) != 7:
    raise ValueError("Return exactly seven predictions, one for each future day.")
if _values.dtype.kind not in "iuf" or not _result_numpy.isfinite(_values).all() or (_values < 0).any():
    raise ValueError("Predictions must be finite, non-negative numbers.")
_result_json.dumps(_values.tolist(), allow_nan=False)
`, { globals });
    send({ type: 'result', id: data.id, predictions: JSON.parse(encoded), output: output.trim() });
  } catch (error) {
    send({ type: 'error', id: data.id, message: String(error) });
  } finally {
    globals.destroy();
  }
};

void initialize();
