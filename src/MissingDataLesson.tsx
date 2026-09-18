import { useEffect, useState } from 'react';
import { scoreEvaluation } from './evaluation';
import { missingDataDates, missingDataFixture, missingDataStarter, preparationLabels, type MissingDataAttempt, type PreparationChoice } from './missing-data';
import { usePython } from './use-python';
import { useMission, usePracticeAttempt } from './mission';
import './missing-data.css';

type Submitted = Pick<MissingDataAttempt, 'number' | 'code' | 'expectation' | 'choice' | 'trainingDates' | 'evaluationDates' | 'practiceRepair'>;

export function MissingDataLesson() {
  const mission = useMission();
  const starter = (choice: PreparationChoice) => missingDataStarter(choice, mission.state.active);
  const python = usePython();
  const [choice, setChoice] = useState<PreparationChoice>('untreated');
  const [code, setCode] = useState(missingDataStarter('untreated'));
  const [expectation, setExpectation] = useState('');
  const [submitted, setSubmitted] = useState<Submitted>();
  const [records, setRecords] = useState<MissingDataAttempt[]>([]);
  usePracticeAttempt('repair', python.phase, submitted !== undefined);
  const busy = python.phase === 'loading' || python.phase === 'running';
  const observedFailure = records.some((record) => record.status === 'failed');

  useEffect(() => {
    if (!submitted) return;
    let record: MissingDataAttempt;
    if (python.phase === 'complete' && python.result) {
      record = { ...submitted, status: 'completed', ...python.result, ...scoreEvaluation(21, python.result.predictions) };
    } else if (python.phase === 'error' || python.phase === 'unavailable') {
      record = { ...submitted, status: python.phase === 'error' ? 'failed' : 'interrupted', error: python.message };
    } else return;
    setRecords((previous) => previous.some((item) => item.number === record.number) ? previous : [...previous, record]);
  }, [submitted, python.phase, python.result, python.message]);

  function run() {
    setSubmitted({ number: (submitted?.number ?? 0) + 1, code, expectation: expectation.trim(), choice, practiceRepair: mission.state.active && choice === 'median' && observedFailure, trainingDates: [...missingDataDates.training], evaluationDates: [...missingDataDates.evaluation] });
    python.run({ code, scenario: missingDataFixture, evaluationDates: missingDataDates.evaluation });
  }
  function reset() {
    if (python.phase === 'running' && submitted) {
      setRecords((previous) => previous.some((record) => record.number === submitted.number) ? previous : [...previous, { ...submitted, status: 'interrupted', error: 'Reset during execution. No forecast or score.' }]);
    }
    python.reset();
  }
  function choose(next: PreparationChoice) {
    setChoice(next);
    setCode((current) => current === starter(choice) ? starter(next) : current);
  }

  return <section className="results-card missing-data-lesson" aria-labelledby="missing-data-title">
    <span className="eyebrow">INVESTIGATE AN INCOMPLETE EXPORT</span><h2 id="missing-data-title">Repair missing data</h2>
    <p>This separate simulated practice export has 2 missing cells in <code>day</code>, the numerical days-since-opening field. The calendar dates survived the export. Demand still means mugs wanted, not fulfilled sales.</p>
    <p>Training: <strong>2026-08-31 – 2026-09-20</strong> (21 days). Evaluation: <strong>2026-09-21 – 2026-09-27</strong> (7 days). Evaluation demand is withheld from Python.</p>
    <table className="forecast-table"><caption>Missing-value locations · day column</caption><thead><tr><th scope="col">Date</th><th scope="col">Partition</th><th scope="col">Day value</th></tr></thead><tbody><tr><th scope="row">2026-09-10</th><td>Training</td><td>Missing</td></tr><tr><th scope="row">2026-09-24</th><td>Evaluation</td><td>Missing</td></tr></tbody></table>
    <p>Try the incomplete inputs, then inspect what happened before choosing a repair.</p>
    <label>Preparation choice <select value={choice} disabled={python.phase === 'running'} onChange={(event) => choose(event.target.value as PreparationChoice)}><option value="untreated">{preparationLabels.untreated}</option><option value="median" disabled={!observedFailure}>{preparationLabels.median}</option></select></label>
    {code !== starter(choice) && <p className="inline-note">Custom Python is preserved. The visual choice is your intention; saved code determines the preparation actually run. Restore the starter to apply the selected choice.</p>}
    <label>Missing-data expectation <input value={expectation} maxLength={500} disabled={python.phase === 'running'} onChange={(event) => setExpectation(event.target.value)} placeholder="What might happen to training or forecast error?" /></label>
    <div className="code-label"><label htmlFor="missing-data-code">Missing-data Python</label><button className="text-button" disabled={python.phase === 'running'} onClick={() => setCode(starter(choice))}>Restore missing-data starter</button></div>
    {mission.state.active && choice === 'median' && <p className="inline-note">Less scaffolding: replace the NotImplementedError with your two preparation lines. Hints offer increasing help after you have seen a consequence.</p>}
    <p className="code-help">Edit the preparation and train a real model. Return a pandas Series named predictions indexed by future.index. The supported repair starter learns fill values from training only; custom code is not automatically audited for imputation leakage.</p>
    <div className="editor"><textarea id="missing-data-code" spellCheck={false} value={code} disabled={python.phase === 'running'} onChange={(event) => setCode(event.target.value)} /></div>
    <div className="run-bar"><span role="status">{python.phase === 'error' ? 'Missing-data experiment failed' : python.phase === 'complete' ? 'Missing-data experiment complete' : python.message}</span><button className="run-button" disabled={busy || python.phase === 'unavailable' || !code.trim() || !expectation.trim()} onClick={run}>Run missing-data experiment</button></div>
    <div className="recovery-controls">{python.phase === 'running' && <button onClick={python.stop}>Stop missing-data run</button>}<button className="text-button" disabled={python.phase === 'loading'} onClick={reset}>Reset missing-data Python</button><span>Saved attempts stay until this page is reloaded.</span></div>
    {(python.phase === 'error' || python.phase === 'unavailable') && <div className="error-box" role="alert"><strong>No new forecast or score.</strong><pre>{python.message}</pre></div>}
    {observedFailure && <details className="missing-explanation"><summary>Why did this fail?</summary><p>The untreated starter passes missing values (NaN) into LinearRegression, which cannot train on them. Inspect the saved error: edited code can also fail for other reasons.</p><p>Fit the imputer on training rows only, then reuse its learned values on evaluation inputs. Fitting on later inputs would leak information from the period you are evaluating.</p><p>A median repair makes this starter runnable; it does not recover the true missing day. Compare the repaired prediction against actual demand. You can also investigate deriving the missing day number from the intact date.</p></details>}
    <h3>Before and after</h3><p>Both attempts retain their original code, expectation, preparation choice, and dates. A failure has no forecast or score. Baseline repeats the last training demand, 60 mugs; MAE averages absolute errors over the same seven evaluation dates.</p>
    {records.length === 0 && <p>No missing-data experiments yet.</p>}
    {records.length > 0 && <div className="missing-table-scroll" role="region" aria-label="Missing-data comparisons" tabIndex={0}><table className="forecast-table"><caption>Missing-data experiment comparison</caption><thead><tr><th scope="col">Run</th><th scope="col">Preparation choice</th><th scope="col">Status</th><th scope="col">Model MAE</th></tr></thead><tbody>{records.map((record) => <tr key={record.number}><th scope="row">{record.number}</th><td>{preparationLabels[record.choice]}</td><td>{record.status}</td><td>{record.status === 'completed' ? record.modelMae.toFixed(2) : 'No score'}</td></tr>)}</tbody></table></div>}
    {records.map((record) => <article className="missing-record" aria-label={`Missing-data run ${record.number}`} key={record.number}>
      <h3>Missing-data run {record.number}</h3><p>Preparation choice: {preparationLabels[record.choice]}</p><p>Before running: {record.expectation}</p><p>Training: {record.trainingDates[0]} – {record.trainingDates.at(-1)}. Evaluation: {record.evaluationDates[0]} – {record.evaluationDates.at(-1)}.</p>
      {record.status !== 'completed' ? <><strong>{record.status === 'failed' ? 'Failed — no forecast or score' : 'Interrupted — no forecast or score'}</strong><pre className="missing-error">{record.error}</pre></> : <>
        <p><strong>Model MAE: {record.modelMae.toFixed(2)} mugs/day</strong><br /><strong>Baseline MAE: {record.baselineMae.toFixed(2)} mugs/day</strong></p>
        <p>Recorded features: <code>{record.features}</code>. Model configuration: <code>{record.modelConfiguration}</code>.</p>
        <div className="missing-table-scroll" role="region" aria-label={`Missing-data predictions run ${record.number}`} tabIndex={0}><table className="forecast-table"><caption>Repaired forecast and errors · run {record.number}</caption><thead><tr>{['Date', 'Actual demand', 'Baseline', 'Prediction', 'Absolute error'].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{record.rows.map((row) => <tr key={row.date}><th scope="row">{row.date}</th>{[row.actual, row.baseline, row.predicted, row.modelError].map((value, index) => <td key={index}>{value.toFixed(2)}</td>)}</tr>)}</tbody></table></div>
        {record.output && <details className="python-output"><summary>Saved output · run {record.number}</summary><pre>{record.output}</pre></details>}
      </>}
      <details className="python-output"><summary>Saved missing-data Python · run {record.number}</summary><pre>{record.code}</pre></details>
      {mission.state.active && record.status === 'completed' && record.practiceRepair && <button className="run-button practice-inspect" onClick={() => mission.dispatch({ type: 'inspect', evidence: { step: 'repair', record } })}>I inspected repaired run {record.number}</button>}
    </article>)}
  </section>;
}
