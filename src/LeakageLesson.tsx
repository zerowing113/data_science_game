import { useEffect, useState } from 'react';
import { evaluationSplit, scoreEvaluation } from './evaluation';
import { approvedTimingPrograms, leakageForecast, leakageScenario, leakageStarter, timingAssignment, timingFeatures, type FailedTimingAttempt, type LeakageAttempt, type LeakageExperiment, type TimingChoice } from './leakage';
import { scenario } from './scenario';
import { usePython } from './use-python';
import './leakage.css';

export function LeakageLesson() {
  const python = usePython();
  const [choice, setChoice] = useState<TimingChoice>('closing');
  const [code, setCode] = useState(leakageStarter('closing'));
  const [expectation, setExpectation] = useState('');
  const [submitted, setSubmitted] = useState<LeakageAttempt>();
  const [runs, setRuns] = useState<LeakageExperiment[]>([]);
  const [failures, setFailures] = useState<FailedTimingAttempt[]>([]);
  const busy = python.phase === 'loading' || python.phase === 'running';
  useEffect(() => {
    if (!submitted || !python.result) return;
    const completed: LeakageExperiment = { ...submitted, ...python.result, ...scoreEvaluation(21, python.result.predictions), leakageCheck: python.result.leakageCheck ?? { validity: 'unverified', reason: 'Timing verification was unavailable.' } };
    setRuns((saved) => saved.some((record) => record.number === completed.number) ? saved : [...saved, completed]);
  }, [submitted, python.result]);
  useEffect(() => {
    if (!submitted || !['error', 'unavailable'].includes(python.phase) || runs.some((record) => record.number === submitted.number)) return;
    const failed: FailedTimingAttempt = { ...submitted, validity: 'unverified', error: python.message };
    setFailures((saved) => saved.some((record) => record.number === failed.number) ? saved : [...saved, failed]);
  }, [submitted, python.phase, python.message, runs]);
  function run() {
    setSubmitted({ number: (submitted?.number ?? 0) + 1, code, choice, expectation: expectation.trim() });
    python.run({ code, scenario: leakageScenario, evaluationDates: evaluationSplit(21).heldOut.map((row) => row.date), leakageCheck: { forecast: leakageForecast, approvedPrograms: approvedTimingPrograms } });
  }
  function reset() {
    if (submitted && python.phase === 'running') {
      const interrupted: FailedTimingAttempt = { ...submitted, validity: 'unverified', error: 'Interrupted by resetting Python. No result was saved.' };
      setFailures((saved) => saved.some((record) => record.number === interrupted.number) ? saved : [...saved, interrupted]);
    }
    python.reset();
  }
  return <section className="results-card leakage-lesson" aria-labelledby="leakage-title">
    <span className="eyebrow">A PERFECT PRACTICE SCORE?</span><h2 id="leakage-title">Investigate feature timing</h2>
    <p>This simulated export adds a closing report that looks closely related to demand. Try it on later historical days, then see whether the same Python can forecast the upcoming week.</p>
    <p>Historical training: <strong>2026-08-31 – 2026-09-20</strong>. Evaluation: <strong>2026-09-21 – 2026-09-27</strong>. The baseline repeats the last training demand, 60 mugs, on those same seven dates.</p>
    <details className="timing-inspection"><summary>Inspect feature timing</summary>
      <p><strong>day</strong>: date trend known before the forecast. <strong>promotion</strong>: planned promotion known before the forecast.</p>
      <p><strong>closing_requested_units</strong>: Only after the shop closes. This fictional report counts all customer requests, including unfulfilled demand. In this deterministic fixture it equals observed demand; it is not fulfilled sales. Historical exports have it, but upcoming inputs omit it entirely.</p>
      {runs.some((record) => record.leakageCheck.validity === 'leaked' || record.leakageCheck.forecastError) && <p>Using an answer-derived column is leakage: later historical rows look predictable because the answer has already arrived. Remove that feature in Python and retry with inputs available when making the decision.</p>}
    </details>
    <label>Timing features <select value={choice} disabled={python.phase === 'running'} onChange={(event) => { const next = event.target.value as TimingChoice; setChoice(next); setCode((current) => current.replace(timingAssignment, `features = ${timingFeatures[next]}`)); }}><option value="closing">Closing requested units</option><option value="known">Trend + planned promotions</option></select></label>
    <p>The selector edits the starter feature line. Saved Python determines validity; editing Python directly may leave the selector showing your earlier choice.</p>
    {!timingAssignment.test(code) && <p className="inline-note">Custom feature code is preserved. Edit Python directly or restore the timing starter to reconnect the selector.</p>}
    <label>Leakage expectation <input maxLength={500} value={expectation} disabled={python.phase === 'running'} onChange={(event) => setExpectation(event.target.value)} placeholder="Will this work before next week happens?" /></label>
    <div className="code-label"><label htmlFor="leakage-code">Leakage Python</label><button className="text-button" disabled={python.phase === 'running'} onClick={() => setCode(leakageStarter(choice))}>Restore timing starter</button></div>
    <div className="editor"><textarea id="leakage-code" spellCheck={false} value={code} disabled={python.phase === 'running'} onChange={(event) => setCode(event.target.value)} /></div>
    <p className="code-help">Return a pandas Series named predictions with future.index. Timing verification supports this LinearRegression recipe with closing_requested_units, day, or day + promotion. Comments and formatting may change. Other custom programs still execute, but remain unverified.</p>
    <div className="run-bar"><span role="status">{python.phase === 'complete' ? 'Timing experiment complete' : python.message}</span><button className="run-button" disabled={busy || python.phase === 'unavailable' || !code.trim() || !expectation.trim()} onClick={run}>Run timing experiment</button></div>
    <div className="recovery-controls">{python.phase === 'running' && <button onClick={python.stop}>Stop timing experiment</button>}<button className="text-button" disabled={python.phase === 'loading'} onClick={reset}>Reset timing Python</button><span>Saved experiments remain until page reload.</span></div>
    {(python.phase === 'error' || python.phase === 'unavailable') && <div className="error-box" role="alert"><strong>Attempt unverified. No new historical score or valid result was saved.</strong><pre>{python.message}</pre></div>}
    <h3>Saved timing experiments</h3>
    <p>Validity is retained with each experiment. Leaked and unverified runs cannot qualify as valid winning forecasts. A valid timing check alone does not complete a mission or prove accuracy on unseen demand.</p>
    {runs.length === 0 && <p>No timing experiments yet.</p>}
    {runs.map((record) => <article className="timing-record" key={record.number} aria-label={`Timing experiment ${record.number}`}>
      <h3>Timing experiment {record.number}</h3>
      <p><strong>Historical model MAE: {record.modelMae.toFixed(2)} mugs/day</strong><br /><strong>Baseline MAE: {record.baselineMae.toFixed(2)} mugs/day</strong></p>
      <p>Training August 31–September 20; evaluation September 21–27, 2026. Lower MAE is better.</p>
      <p className={`timing-validity ${record.leakageCheck?.validity}`}><strong>Validity: {record.leakageCheck?.validity ?? 'unverified'}</strong>. {record.leakageCheck?.reason}</p>
      {record.leakageCheck?.forecastError && <div className="error-box"><strong>Forecast-time execution failed</strong><pre>{record.leakageCheck.forecastError}</pre><p>{record.leakageCheck.validity === 'leaked' ? 'The closing report is unavailable for upcoming days. Inspect feature timing, edit Python, and rerun.' : 'This custom program could not produce upcoming predictions. Inspect the error, edit Python, and rerun.'} No future accuracy score is available.</p></div>}
      <p>Before running: {record.expectation}</p><p>Visual choice: {record.choice === 'closing' ? 'Closing requested units' : 'Trend + planned promotions'}. Executed model features: <code>{record.features}</code>.</p>
      <p>Model configuration: <code>{record.modelConfiguration}</code></p>
      <div className="timing-scroll" role="region" aria-label={`Historical timing results ${record.number}`} tabIndex={0}><table className="forecast-table"><caption>Historical comparison · experiment {record.number}</caption><thead><tr>{['Date', 'Actual demand', 'Baseline', 'Model', 'Model absolute error'].map((name) => <th scope="col" key={name}>{name}</th>)}</tr></thead><tbody>{record.rows.map((row) => <tr key={row.date}><th scope="row">{row.date}</th><td>{row.actual.toFixed(2)}</td><td>{row.baseline.toFixed(2)}</td><td>{row.predicted.toFixed(2)}</td><td>{row.modelError.toFixed(2)}</td></tr>)}</tbody></table></div>
      {record.leakageCheck?.forecastPredictions && <><p>The same code was retrained on all 28 observed days and executed on September 28–October 4 inputs. Upcoming demand is unknown; these are predictions, with no future MAE.</p><table className="forecast-table"><caption>Upcoming predictions</caption><thead><tr><th scope="col">Date</th><th scope="col">Predicted demand</th></tr></thead><tbody>{record.leakageCheck.forecastPredictions.map((value, index) => <tr key={scenario.future[index].date}><th scope="row">{scenario.future[index].date}</th><td>{value.toFixed(2)}</td></tr>)}</tbody></table></>}
      <details className="python-output"><summary>Saved timing Python · experiment {record.number}</summary><pre>{record.code}</pre></details>
      {record.output && <details className="python-output"><summary>Timing output · experiment {record.number}</summary><pre>{record.output}</pre></details>}
    </article>)}
    {failures.map((record) => <article className="timing-record" key={record.number} aria-label={`Failed timing attempt ${record.number}`}><h3>Failed timing attempt {record.number}</h3><p><strong>Validity: {record.validity}</strong>. No historical score or upcoming predictions were saved.</p><p>Before running: {record.expectation}</p><div className="error-box"><pre>{record.error}</pre></div><details className="python-output"><summary>Saved failed timing Python · attempt {record.number}</summary><pre>{record.code}</pre></details></article>)}
  </section>;
}
