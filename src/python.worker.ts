import type { PyodideInterface } from 'pyodide';
import type { LeakageCheck, PythonMessage, RunRequest } from './python-types';

const send = (message: PythonMessage) => self.postMessage(message);
let python: PyodideInterface;
let output = '';

async function matchesApprovedProgram(code: string, programs: string[]) {
  const globals = python.toPy({ submitted_code: code, approved_json: JSON.stringify(programs) });
  try {
    return Boolean(await python.runPythonAsync(`import ast, json
submitted_tree = ast.dump(ast.parse(submitted_code))
any(submitted_tree == ast.dump(ast.parse(program)) for program in json.loads(approved_json))`, { globals }));
  } finally { globals.destroy(); }
}

// Both runs use request-owned dates/counts, never mutable learner tables.
async function readPredictions(globals: ReturnType<PyodideInterface['toPy']>, expectedCount: number, expectedDates?: string[]) {
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
  if (predictions.length !== expectedCount) {
    throw new Error(`Return exactly ${expectedCount} predictions, one for each future day.`);
  }
  if (expectedDates) {
    const datesJson = await python.runPythonAsync(`import pandas as _result_pandas
if not isinstance(predictions, _result_pandas.Series):
    raise ValueError("Evaluation predictions must be a pandas Series indexed by future.index dates.")
_result_json.dumps(predictions.index.tolist())
`, { globals });
    const dates: unknown = JSON.parse(datesJson);
    if (!Array.isArray(dates) || dates.length !== expectedDates.length || dates.some((date, index) => date !== expectedDates[index])) {
      throw new Error('Evaluation dates must match the requested dates in order. Keep the prediction date index aligned with its values.');
    }
  }
  return predictions;
}

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
    const predictions = await readPredictions(globals, data.scenario.future.length, data.evaluationDates);
    let metadata: { features?: string; modelConfiguration?: string } = {};
    if (data.evaluationDates) {
      const metadataJson = await python.runPythonAsync(`_result_json.dumps({
    "features": repr(model.feature_names_in_.tolist()) if "model" in globals() and hasattr(model, "feature_names_in_") else repr(globals().get("features", "Custom code; see saved Python")),
    "modelConfiguration": (type(model).__name__ + " " + repr(model.get_params(deep=False))) if "model" in globals() and hasattr(model, "get_params") else repr(globals().get("model", "Custom predictions; see saved Python"))
})`, { globals });
      metadata = JSON.parse(metadataJson);
    }
    const historicalOutput = output.trim();
    let leakageCheck: LeakageCheck | undefined;
    if (data.leakageCheck) {
      // Inspect the submitted syntax in a separate namespace: a visual selector
      // or user-written metadata cannot certify how predictions were produced.
      const checkGlobals = python.toPy({ submitted_code: data.code, approved_json: JSON.stringify(data.leakageCheck.approvedPrograms), scenario_json: JSON.stringify(data.leakageCheck.forecast) });
      try {
        const supported = await matchesApprovedProgram(data.code, data.leakageCheck.approvedPrograms);
        await python.runPythonAsync('import json', { globals: checkGlobals });
        const usesLateFeature = supported && metadata.features?.includes('closing_requested_units');
        leakageCheck = { validity: usesLateFeature ? 'leaked' : 'unverified', reason: usesLateFeature ? 'This supported model uses a closing report unavailable before the forecast.' : 'Custom Python is unverified. Only the supported LinearRegression recipe can certify feature timing; inspect saved code and results.' };
        output = '';
        try {
          await python.runPythonAsync(`import pandas as pd
_scenario = json.loads(scenario_json)
history = pd.DataFrame(_scenario["history"])
future = pd.DataFrame(_scenario["future"])
future.index = pd.Index(future["date"], name="evaluation_date")`, { globals: checkGlobals });
          await python.runPythonAsync(data.code, { globals: checkGlobals });
          leakageCheck.forecastPredictions = await readPredictions(
            checkGlobals,
            data.leakageCheck.forecast.future.length,
            data.leakageCheck.forecast.future.map((row) => String(row.date)),
          );
          if (supported && !usesLateFeature) {
            leakageCheck.validity = 'valid';
            leakageCheck.reason = 'Supported code used only forecast-time inputs and ran successfully on the upcoming week. This verifies feature timing, not future accuracy.';
          }
        } catch (error) {
          leakageCheck.forecastError = String(error);
          if (!usesLateFeature) leakageCheck.reason = 'Forecast-time execution failed. This attempt is unverified and cannot qualify as valid evidence.';
        }
      } finally {
        checkGlobals.destroy();
      }
    }
    const programValidity = data.approvedPrograms ? (await matchesApprovedProgram(data.code, data.approvedPrograms) ? 'valid' : 'unverified') : undefined;
    send({ type: 'result', id: data.id, predictions, output: historicalOutput, ...metadata, ...(leakageCheck ? { leakageCheck } : {}), programValidity });
  } catch (error) {
    send({ type: 'error', id: data.id, message: String(error) });
  } finally {
    globals.destroy();
  }
};

// Chromium can fail concurrent cache writes when several lesson workers fetch
// the same large wheel. Coordinate startup only; model execution stays independent.
if (navigator.locks) {
  send({ type: 'loading', message: 'Waiting to initialize this Python workspace…' });
  void navigator.locks.request('little-goods-python-startup', initialize).catch((error) => {
    send({ type: 'error', message: `Python could not start. ${String(error)}` });
  });
} else {
  void initialize();
}
