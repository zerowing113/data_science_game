import { useSavedState } from './journey';
import { useEffect } from 'react';
import { approvedFinalPrograms, emptyReflection, finalChallenge, finalFeatures, finalStarter, reflectionComplete, scoreFinal, type FinalAttempt, type FinalChoice, type FinalReflection } from './challenge';
import { useMission, type PracticeEvidence } from './mission';
import { money, shopRules, validStock } from './shop';
import { usePython } from './use-python';
import './challenge.css';

type Submission = ReturnType<typeof scoreFinal> & {
  seed: number; attempt: FinalAttempt; attempts: FinalAttempt[];
  reflection: FinalReflection; complete: boolean; practice: PracticeEvidence[];
};

export function FinalChallenge({ onBack }: { onBack: () => void }) {
  const mission = useMission();
  const python = usePython('final');
  const [seed, setSeed] = useSavedState('final.seed', 1);
  const challenge = finalChallenge(seed);
  const [choice, setChoice] = useSavedState<FinalChoice>('final.choice', 'trend');
  const [code, setCode] = useSavedState('final.code', finalStarter('trend'));
  const [expectation, setExpectation] = useSavedState('final.expectation', '');
  const [attempts, setAttempts] = useSavedState<FinalAttempt[]>('final.attempts', []);
  const [pending, setPending] = useSavedState<FinalAttempt>('final.pending');
  const [preview, setPreview] = useSavedState<FinalAttempt>('final.preview');
  const [stock, setStock] = useSavedState<string[]>('final.stock', []);
  const [submissions, setSubmissions] = useSavedState<Submission[]>('final.submissions', []);
  const current = submissions.find((item) => item.seed === seed);
  const busy = python.phase === 'loading' || python.phase === 'running';
  const dirty = preview && (code !== preview.code || choice !== preview.choice || expectation.trim() !== preview.expectation);
  const quantities = stock.map((value) => value.trim() === '' ? NaN : Number(value));
  const canSubmit = !current && !busy && preview?.result && !dirty && validStock(quantities, challenge.future.length);

  useEffect(() => {
    const source = pending;
    if (!source || !['complete', 'error', 'unavailable'].includes(python.phase)) return;
    setPending(undefined);
    const attempt = { ...source, ...(python.result ? { result: python.result } : { error: python.message }) };
    setAttempts((previous) => [...previous, attempt]);
    setPreview(python.result ? attempt : undefined);
    if (python.result) setStock(python.result.predictions.map((value) => String(Math.min(shopRules.dailyCapacity, Math.round(value)))));
  }, [python.phase, python.result, python.message]);

  function run() {
    if (current || busy || python.phase === 'unavailable' || !expectation.trim() || !code.trim()) return;
    setPending({ number: attempts.length + 1, code, choice, expectation: expectation.trim() });
    setPreview(undefined);
    setStock([]);
    python.run({ code, scenario: { history: challenge.history, future: challenge.future }, evaluationDates: challenge.future.map((row) => row.date), approvedPrograms: approvedFinalPrograms });
  }

  function reset() {
    const source = pending;
    if (source) {
      setAttempts((previous) => [...previous, { ...source, error: 'Run interrupted by reset.' }]);
      setPending(undefined);
    }
    setPreview(undefined);
    setStock([]);
    python.reset();
  }

  function submit() {
    if (!canSubmit || !preview) return;
    setSubmissions((previous) => [...previous, { ...scoreFinal(challenge, preview, quantities), seed, attempt: preview, attempts: [...attempts], reflection: emptyReflection(), complete: false, practice: Object.values(mission.state.evidence).filter((item): item is PracticeEvidence => !!item) }]);
  }

  function reflect(field: keyof FinalReflection, value: string) {
    setSubmissions((previous) => previous.map((item) => item.seed === seed && !item.complete ? { ...item, reflection: { ...item.reflection, [field]: value } } : item));
  }

  function complete() {
    setSubmissions((previous) => previous.map((item) => item.seed === seed && item.eligible && reflectionComplete(item.reflection) ? { ...item, complete: true } : item));
  }

  function retry() {
    if (!current) return;
    setSeed(seed + 1);
    setAttempts([]);
    setExpectation('');
    reset();
  }

  return <section className="final-challenge" aria-label="Final challenge">
    <div className="section-heading"><div><span className="eyebrow">TRANSFER YOUR LEARNING</span><h2>Challenge {seed}: the festival sale</h2></div><button className="text-button" onClick={onBack}>Back to practice</button></div>
    <p>A new batch of Everyday Mugs, 21 earlier training days, and a planned seven-day sale. Forecast demand for {challenge.future[0].date} through {challenge.future[6].date}. Challenge number {seed} reproduces this dataset. Progress saves automatically in this browser.</p>
    <p>Beat the last training day's demand baseline on the same seven future dates, use valid forecast-time inputs, commit stock, and explain your decisions to complete the mission. Profit alone does not qualify.</p>
    <details><summary>Inspect final training data and available inputs</summary>
      <p>day and promotion are known before forecasting. demand and closing_requested_units are known only after closing; both are absent from future. Train only on history. The chronological split is fixed.</p>
      <div className="challenge-table"><table className="forecast-table"><caption>Final training history</caption><thead><tr><th>Date</th><th>day</th><th>promotion</th><th>demand</th><th>closing_requested_units</th></tr></thead><tbody>{challenge.history.map((row) => <tr key={row.date}><th>{row.date}</th><td>{row.day}</td><td>{row.promotion}</td><td>{row.demand}</td><td>{row.closing_requested_units}</td></tr>)}</tbody></table></div>
    </details>
    <div className="challenge-table"><table className="forecast-table"><caption>Final upcoming inputs</caption><thead><tr><th>Date</th><th>day</th><th>promotion</th></tr></thead><tbody>{challenge.future.map((row) => <tr key={row.date}><th>{row.date}</th><td>{row.day}</td><td>{row.promotion}</td></tr>)}</tbody></table></div>
    <label>Final features<select value={choice} disabled={!!current || python.phase === 'running'} onChange={(event) => { const next = event.target.value as FinalChoice; setChoice(next); setCode((previous) => previous.replace(/^features = \[(?:"closing_requested_units"|"day"(?:, "promotion")?)\]$/m, `features = ${finalFeatures[next]}`)); }}><option value="trend">Trend only</option><option value="promotions">Trend + planned promotions</option><option value="closing">Closing report (after close)</option></select></label>
    <p>The choice updates a recognized features line only; custom code is preserved. Saved Python determines validity. Completion supports the practice LinearRegression recipe with day, or day and promotion: create model, fit history[features] to history["demand"], return a dated Series from future predictions. Other programs can run but remain unverified. Comments and whitespace are allowed.</p>
    <label>Final expectation<input value={expectation} maxLength={500} disabled={!!current || python.phase === 'running'} onChange={(event) => setExpectation(event.target.value)} /></label>
    <label htmlFor="final-python">Final Python</label><div className="editor"><textarea id="final-python" value={code} spellCheck={false} disabled={!!current || python.phase === 'running'} onChange={(event) => setCode(event.target.value)} /></div>
    <div className="run-bar"><span role="status">{python.message}</span><button className="run-button" disabled={!!current || busy || python.phase === 'unavailable' || !expectation.trim() || !code.trim()} onClick={run}>Run final forecast</button></div>
    <div className="recovery-controls">{python.phase === 'running' && <button onClick={python.stop}>Stop final run</button>}<button className="text-button" disabled={!!current || python.phase === 'loading'} onClick={reset}>Reset final Python</button></div>
    {(python.phase === 'error' || python.phase === 'unavailable') && <pre role="alert" className="error-box">{python.message}</pre>}
    {preview?.result && <><p>Forecast validity: {preview.result.programValidity}. {preview.result.programValidity === 'valid' ? 'Supported code trains on earlier history using inputs available before forecasting.' : 'Custom Python cannot certify the feature and split rules; it cannot complete the mission.'}</p>
      {dirty && <p role="status">Your inputs changed. Run again before submitting.</p>}
      <p>{money(shopRules.saleCents)} sale price, {money(shopRules.purchaseCents)} purchase cost, {money(shopRules.salvageCents)} salvage per leftover. Stock must be whole mugs, 0–{shopRules.dailyCapacity.toLocaleString('en-US')} per day. Proposed stock is rounded forecast, capped at capacity. Each day is independent; leftovers are salvaged.</p>
      <div className="challenge-table"><table className="forecast-table"><caption>Final forecast and stock commitment</caption><thead><tr><th>Date</th><th>Forecast</th><th>Stock</th></tr></thead><tbody>{challenge.future.map((row, index) => <tr key={row.date}><th>{row.date}</th><td>{preview.result!.predictions[index].toFixed(1)}</td><td><input type="number" min={0} max={shopRules.dailyCapacity} step={1} aria-label={`Final stock for ${row.date}`} disabled={!!current} value={stock[index] ?? ''} onChange={(event) => setStock((previous) => previous.map((value, position) => position === index ? event.target.value : value))} /></td></tr>)}</tbody></table></div>
    </>}
    <p>Answers and scores appear only after submission. This is a browser learning exercise, not a secure exam. Once revealed, another scored attempt uses fresh data.</p>
    <button className="run-button" disabled={!canSubmit} onClick={submit}>Commit stock and submit challenge</button>
    {attempts.length > 0 && !current && <AttemptHistory attempts={attempts} />}
    {submissions.map((item) => <article key={item.seed} aria-label={`Challenge ${item.seed} results`} className="challenge-recap">
      <h3>{item.complete ? `Mission complete: challenge ${item.seed}` : `Challenge ${item.seed} submitted`}</h3>
      <p>Model MAE: {item.modelMae.toFixed(2)} · Baseline MAE: {item.baselineMae.toFixed(2)}. Both use the {item.rows.length} dates below. Forecast validity: {item.attempt.result?.programValidity}.</p>
      {!item.eligible && <p>This attempt cannot complete the mission: {item.attempt.result?.programValidity !== 'valid' ? 'feature availability and split are unverified.' : 'the model did not beat the baseline.'} Try a fresh challenge.</p>}
      <p>Profit: {money(item.shop.totals.profitCents)} · Ordered: {item.shop.totals.stock} · Demand: {item.shop.totals.demand} · Fulfilled: {item.shop.totals.fulfilled} · Lost sales: {item.shop.totals.lost} · Leftovers: {item.shop.totals.leftover}.</p>
      <div className="challenge-table"><table className="forecast-table"><caption>Final evaluation answers</caption><thead><tr><th>Date</th><th>Actual</th><th>Forecast</th><th>Baseline</th><th>Stock</th><th>Lost</th><th>Leftover</th><th>Profit</th></tr></thead><tbody>{item.rows.map((row, index) => <tr key={row.date}><th>{row.date}</th><td>{row.demand}</td><td>{row.predicted.toFixed(1)}</td><td>{row.baseline}</td><td>{item.shop.rows[index].stock}</td><td>{item.shop.rows[index].lost}</td><td>{item.shop.rows[index].leftover}</td><td>{money(item.shop.rows[index].profitCents)}</td></tr>)}</tbody></table></div>
      <p>Submitted run {item.attempt.number} · Visual choice: {item.attempt.choice} · Expected: {item.attempt.expectation}</p>
      <details><summary>Submitted final Python</summary><pre>{item.attempt.code}</pre></details>
      <AttemptHistory attempts={item.attempts} />
      <details><summary>Inspected practice evidence ({item.practice.length} steps)</summary><p>These are the practice results you explicitly inspected before submission. Other practice experiments remain in their workspaces.</p>{item.practice.map((evidence) => <details key={evidence.step}><summary>{evidence.step}</summary><pre>{JSON.stringify(evidence, null, 2)}</pre></details>)}</details>
      {item.seed === seed && !item.complete ? <div className="challenge-reflection">
        <p>Explain using this attempt's evidence. All three responses are required; the app checks that text is present, not whether you understand it.</p>
        <label>Feature reasoning<textarea maxLength={2000} value={item.reflection.features} onChange={(event) => reflect('features', event.target.value)} placeholder="Which saved features were available before forecasting? Which were not?" /></label>
        <label>Evaluation reasoning<textarea maxLength={2000} value={item.reflection.evaluation} onChange={(event) => reflect('evaluation', event.target.value)} placeholder="Compare your two MAEs and explain the shared dates and chronological split." /></label>
        <label>Stocking reasoning<textarea maxLength={2000} value={item.reflection.stocking} onChange={(event) => reflect('stocking', event.target.value)} placeholder="Use your stock, lost sales, leftovers and profit to explain your decision." /></label>
        <button className="run-button" disabled={!item.eligible || !reflectionComplete(item.reflection)} onClick={complete}>Complete mission</button>
      </div> : <div><h4>Your explanations</h4><p>Features: {item.reflection.features || 'Not provided'}</p><p>Evaluation: {item.reflection.evaluation || 'Not provided'}</p><p>Stocking: {item.reflection.stocking || 'Not provided'}</p></div>}
    </article>)}
    {current && <button className="run-button" onClick={retry}>Try a fresh challenge</button>}
  </section>;
}

function AttemptHistory({ attempts }: { attempts: FinalAttempt[] }) {
  return <details><summary>Final experiment history ({attempts.length} runs)</summary>{attempts.map((attempt) => <details key={attempt.number}><summary>Run {attempt.number}: {attempt.error ? 'failed' : attempt.result?.programValidity}</summary><p>Choice: {attempt.choice}. Expected: {attempt.expectation}</p><pre>{attempt.code}</pre>{attempt.error ? <pre>{attempt.error}</pre> : <><p>Predictions: {attempt.result?.predictions.map((value) => value.toFixed(1)).join(', ')}</p><pre>{attempt.result?.output}</pre></>}</details>)}</details>;
}
