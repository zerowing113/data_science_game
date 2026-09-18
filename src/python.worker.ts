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
    const requiredPackages = ['numpy', 'scipy', 'pandas', 'scikit-learn'];
    await python.loadPackage(requiredPackages);
    // loadPackage can resolve even when an individual download failed.
    // Retry missing core packages once, then verify usable imports before ready.
    const missing = requiredPackages.filter((name) => !python.loadedPackages[name]);
    if (missing.length) {
      send({ type: 'loading', message: 'Retrying incomplete Python package downloads…' });
      await python.loadPackage(missing);
    }
    const stillMissing = requiredPackages.filter((name) => !python.loadedPackages[name]);
    if (stillMissing.length) throw new Error(`Missing Python packages: ${stillMissing.join(', ')}. Reset Python to retry loading.`);
    await python.runPythonAsync('import pandas\nfrom sklearn.linear_model import LinearRegression');
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
    if (data.evaluationDates) {
      await python.runPythonAsync('future.index = pd.Index(future["date"], name="evaluation_date")', { globals });
    }
    await python.runPythonAsync(data.code, { globals });
    // Read predictions from this run's fresh namespace, never a previous run.
    const encoded = await python.runPythonAsync(`import json as _result_json
import numpy as _result_numpy
_values = _result_numpy.asarray(predictions)
if _values.ndim != 1:
    raise ValueError("Return one prediction per future day in a one-dimensional result.")
if _values.dtype.kind not in "iuf" or not _result_numpy.isfinite(_values).all() or (_values < 0).any():
    raise ValueError("Predictions must be finite, non-negative numbers.")
_result_json.dumps(_values.tolist(), allow_nan=False)
`, { globals });
    const predictions: number[] = JSON.parse(encoded);
    if (predictions.length !== data.scenario.future.length) {
      throw new Error(`Return exactly ${data.scenario.future.length} predictions, one for each future day.`);
    }
    let metadata: { features?: string; modelConfiguration?: string } = {};
    if (data.evaluationDates) {
      const expectedDates = data.evaluationDates;
      const datesJson = await python.runPythonAsync(`
import pandas as _result_pandas
if not isinstance(predictions, _result_pandas.Series):
    raise ValueError("Evaluation predictions must be a pandas Series indexed by future.index dates.")
_result_json.dumps(predictions.index.tolist())
`, { globals });
      const dates: unknown = JSON.parse(datesJson);
      if (!Array.isArray(dates) || dates.length !== expectedDates.length || dates.some((date, index) => date !== expectedDates[index])) {
        throw new Error('Evaluation dates must match the selected held-out dates in order. Keep the prediction date index aligned with its values.');
      }
      const metadataJson = await python.runPythonAsync(`_result_json.dumps({
    "features": repr(model.feature_names_in_.tolist()) if "model" in globals() and hasattr(model, "feature_names_in_") else repr(globals().get("features", "Custom code; see saved Python")),
    "modelConfiguration": (type(model).__name__ + " " + repr(model.get_params(deep=False))) if "model" in globals() and hasattr(model, "get_params") else repr(globals().get("model", "Custom predictions; see saved Python"))
})`, { globals });
      metadata = JSON.parse(metadataJson);
    }
    send({ type: 'result', id: data.id, predictions, output: output.trim(), ...metadata });
  } catch (error) {
    send({ type: 'error', id: data.id, message: String(error) });
  } finally {
    globals.destroy();
  }
};

void initialize();
