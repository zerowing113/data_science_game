import { useEffect, useState } from 'react';
import { evaluationSplit, evaluationStarter, scoreEvaluation, type TrainingDays } from './evaluation';
import { featureLine, starterFeaturesAssignment, type FeatureChoice } from './scenario';
import type { PythonResult } from './python-types';
import { usePython } from './use-python';
import { useMission, usePracticeAttempt } from './mission';
import './evaluation.css';

type Attempt = { number: number; trainingDays: TrainingDays; code: string; choice: FeatureChoice; expectation: string };
export type EvaluationRecord = Attempt & PythonResult & ReturnType<typeof scoreEvaluation>;

function SplitDates({ trainingDays }: { trainingDays: TrainingDays }) {
  const { history, heldOut } = evaluationSplit(trainingDays);
  return <p>Training: <strong>{history[0].date} – {history[history.length - 1].date}</strong><br />Evaluation: <strong>{heldOut[0].date} – {heldOut[heldOut.length - 1].date}</strong> ({heldOut.length} days)</p>;
}

export function EvaluationLab() {
  const mission = useMission();
  const python = usePython();
  const [trainingDays, setTrainingDays] = useState<TrainingDays>(21);
  const [choice, setChoice] = useState<FeatureChoice>('trend');
  const [code, setCode] = useState(evaluationStarter('trend'));
  const [expectation, setExpectation] = useState('');
  const [submitted, setSubmitted] = useState<Attempt>();
  const [runs, setRuns] = useState<EvaluationRecord[]>([]);
  usePracticeAttempt('evaluate', python.phase, submitted !== undefined);
  const busy = python.phase === 'loading' || python.phase === 'running';
  const split = evaluationSplit(trainingDays);

  useEffect(() => {
    if (!submitted || !python.result) return;
    const completed = { ...submitted, ...python.result, ...scoreEvaluation(submitted.trainingDays, python.result.predictions) };
    setRuns((previous) => previous.some((run) => run.number === completed.number) ? previous : [...previous, completed]);
  }, [submitted, python.result]);

  function run() {
    setSubmitted({ number: (submitted?.number ?? 0) + 1, trainingDays, code, choice, expectation: expectation.trim() });
    python.run({ code, scenario: { history: split.history, future: split.future }, evaluationDates: split.heldOut.map((row) => row.date) });
  }

  return <section className="results-card evaluation-lab" aria-labelledby="evaluation-title">
    <div className="section-heading"><div><span className="eyebrow">TEST ON LATER DAYS</span><h2 id="evaluation-title">Compare with a baseline</h2></div></div>
    <p>Practice forecasting days we have already observed. Train only on earlier days and evaluate on later days, so the starter learns without seeing the evaluation answers. This is a historical holdout, separate from your upcoming-week forecast.</p>
    <label>Chronological split <select value={trainingDays} disabled={python.phase === 'running'} onChange={(event) => setTrainingDays(Number(event.target.value) as TrainingDays)}><option value={21}>21 training days / 7 evaluation days</option><option value={14}>14 training days / 14 evaluation days</option></select></label>
    <SplitDates trainingDays={trainingDays} />
    <p><strong>Baseline: repeat the last observed demand.</strong> Predict {split.baseline} mugs on every evaluation day. It uses only the last training day; both forecasts are scored on exactly the same later dates.</p>
    <p>Mean absolute error (MAE) is the average distance between predicted and actual demand, in mugs per day. Lower is better. A score is historical evidence, not a guarantee about next week.</p>
    <label>Evaluation features <select value={choice} disabled={python.phase === 'running'} onChange={(event) => { const next = event.target.value as FeatureChoice; setChoice(next); setCode((current) => current.replace(starterFeaturesAssignment, featureLine(next))); }}><option value="trend">Trend only</option><option value="promotions">Trend + promotions</option></select></label>
    {!starterFeaturesAssignment.test(code) && <p className="inline-note">Custom features code is preserved. Edit it directly or restore the evaluation starter to reconnect this choice.</p>}
    <label>Evaluation expectation <input value={expectation} maxLength={500} disabled={python.phase === 'running'} onChange={(event) => setExpectation(event.target.value)} placeholder="Why might this beat the baseline?" /></label>
    <div className="code-label"><label htmlFor="evaluation-code">Evaluation Python</label><button className="text-button" disabled={python.phase === 'running'} onClick={() => setCode(evaluationStarter(choice))}>Restore evaluation starter</button></div>
    <p className="code-help">Use history for training and future for evaluation inputs. Return a pandas Series named predictions, indexed by future.index, with one finite, non-negative value per date. Date order is checked before scoring.</p>
    <div className="editor"><textarea id="evaluation-code" spellCheck={false} value={code} disabled={python.phase === 'running'} onChange={(event) => setCode(event.target.value)} /></div>
    <div className="run-bar"><span role="status">{python.phase === 'complete' ? 'Comparison complete' : python.phase === 'error' ? 'Comparison failed — check the error below' : python.phase === 'unavailable' ? 'Evaluation Python unavailable' : python.message}</span><button className="run-button" disabled={busy || python.phase === 'unavailable' || !code.trim() || !expectation.trim()} onClick={run}>Run comparison</button></div>
    <div className="recovery-controls">{python.phase === 'running' && <button onClick={python.stop}>Stop comparison</button>}<button className="text-button" disabled={python.phase === 'loading'} onClick={python.reset}>Reset evaluation Python</button><span>Code, expectation, and saved evaluations stay in this page.</span></div>
    {(python.phase === 'error' || python.phase === 'unavailable') && <div className="error-box" role="alert"><strong>Comparison unavailable. No score was saved for this attempt.</strong><pre>{python.message}</pre><p>Correct your code or reset Python. Saved evaluations below belong to their original runs.</p></div>}
    <h3>Saved evaluations</h3><p>Results keep their original settings and dates. Changing the editor or split does not change a saved run. Records last until this page is reloaded.</p>
    {new Set(runs.map((record) => record.trainingDays)).size > 1 && <p className="inline-note">Different evaluation dates: compare scores only within the same split.</p>}
    {runs.length > 0 && <div className="evaluation-table-scroll"><table className="forecast-table"><caption>Experiment comparison</caption><thead><tr><th scope="col">Run</th><th scope="col">Training days</th><th scope="col">Evaluation dates</th><th scope="col">Visual choice</th><th scope="col">Baseline MAE</th><th scope="col">Model MAE</th></tr></thead><tbody>{runs.map((record) => <tr key={record.number}><th scope="row">{record.number}</th><td>{record.trainingDays}</td><td>{record.rows[0].date} – {record.rows[record.rows.length - 1].date}</td><td>{record.choice === 'trend' ? 'Trend only' : 'Trend + promotions'}</td><td>{record.baselineMae.toFixed(2)}</td><td>{record.modelMae.toFixed(2)}</td></tr>)}</tbody></table></div>}
    {runs.length === 0 && <p>No successful comparisons yet.</p>}
    {runs.map((record) => <article className="evaluation-record" key={record.number} aria-label={`Evaluation run ${record.number}`}>
      <h3>Evaluation run {record.number}</h3><SplitDates trainingDays={record.trainingDays} />
      <p><strong>Baseline MAE: {record.baselineMae.toFixed(2)} mugs/day</strong><br /><strong>Model MAE: {record.modelMae.toFixed(2)} mugs/day</strong></p>
      <p>{record.modelMae < record.baselineMae ? 'Model beats the baseline on these evaluation days.' : 'Model does not beat the baseline on these evaluation days.'}</p>
      <p>Visual choice: {record.choice === 'trend' ? 'Trend only' : 'Trend + promotions'}. Recorded features: <code>{record.features}</code>. For custom code, inspect the saved Python to see how predictions were made.</p>
      <p>Model configuration: <code>{record.modelConfiguration}</code></p>
      <p>Before running: {record.expectation}</p>
      <div className="evaluation-table-scroll"><table className="forecast-table"><caption>Evaluation details · run {record.number}</caption><thead><tr>{['Date', 'Actual demand', 'Baseline', 'Model', 'Baseline absolute error', 'Model absolute error'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{record.rows.map((row) => <tr key={row.date}><th scope="row">{row.date}</th>{[row.actual, row.baseline, row.predicted, row.baselineError, row.modelError].map((value, index) => <td key={index}>{value.toFixed(2)}</td>)}</tr>)}</tbody></table></div>
      <details className="python-output"><summary>Saved evaluation Python · run {record.number}</summary><pre>{record.code}</pre></details>
      {record.output && <details className="python-output"><summary>Evaluation output · run {record.number}</summary><pre>{record.output}</pre></details>}
      {mission.state.active && <button className="run-button practice-inspect" onClick={() => mission.dispatch({ type: 'inspect', evidence: { step: 'evaluate', record } })}>I inspected evaluation run {record.number}</button>}
    </article>)}
  </section>;
}
