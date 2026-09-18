import { useEffect, useState } from 'react';
import { DemandHistory } from './DemandHistory';
import { EvaluationLab } from './EvaluationLab';
import { MissingDataLesson } from './MissingDataLesson';
import { LeakageLesson } from './LeakageLesson';
import { StockingDesk } from './StockingDesk';
import type { ForecastExperiment } from './shop';
import { dayLabel, featureLine, scenario, starterCode, starterFeaturesAssignment, type FeatureChoice } from './scenario';
import { usePython } from './use-python';

type SubmittedRun = { number: number; code: string; expectation: string; choice: FeatureChoice };

export default function App() {
  const [choice, setChoice] = useState<FeatureChoice>('trend');
  const [code, setCode] = useState(starterCode('trend'));
  const [expectation, setExpectation] = useState('');
  const [submitted, setSubmitted] = useState<SubmittedRun>();
  const [previous, setPrevious] = useState<ForecastExperiment>();
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [missingDataOpen, setMissingDataOpen] = useState(false);
  const [leakageOpen, setLeakageOpen] = useState(false);
  const python = usePython();
  const busy = python.phase === 'loading' || python.phase === 'running';
  const dirty = submitted !== undefined && submitted.code !== code;
  const predictions = python.result?.predictions;

  useEffect(() => {
    if (python.result && submitted) setPrevious({ ...submitted, ...python.result });
  }, [python.result, submitted]);

  function choose(next: FeatureChoice) {
    setChoice(next);
    setCode((current) => current.replace(starterFeaturesAssignment, featureLine(next)));
  }

  function run() {
    setSubmitted({ number: (submitted?.number ?? 0) + 1, code, expectation: expectation.trim(), choice });
    python.run({ code, scenario });
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#main"><span className="brand-mark" aria-hidden="true">lg.</span><span>little goods<span className="brand-sub">THE FORECASTING GAME</span></span></a>
      <span className="chapter-label">FIELD NOTES <span>01 / FIRST FORECAST</span></span>
      <span className="lesson-badge">Learn by doing</span>
    </header>
    <main id="main">
      <div className="page-heading"><div><span className="eyebrow">YOU'RE THE SHOP'S NEW ANALYST</span><h1>Your first forecast</h1><p>A small shop. A growing demand. What will next week look like?</p></div><div className="mission-tag"><span>MISSION 01</span><strong>Predict daily demand</strong></div></div>
      <div className="workspace">
        <aside className="shop-column">
          <section className="shop-card" aria-labelledby="shop-title">
            <div className="shop-card-top"><span className="eyebrow">YOUR SHOP</span><span className="open-tag">OPEN FOR BUSINESS</span></div>
            <h2 id="shop-title">Little Goods Co.</h2>
            <p>Everyday objects, a little better.</p>
            <div className="product-display"><span className="product-number">BESTSELLER / 001</span><span className="mug" role="img" aria-label="Ceramic coffee mug">☕</span><span className="product-sticker">GOOD<br />MORNINGS</span></div>
            <div className="product-caption"><strong>The Everyday Mug</strong><span>Ceramic · Oat</span></div>
            <div className="shop-facts"><div><span>History</span><strong>28 days</strong></div><div><span>Forecast horizon</span><strong>Next 7 days</strong></div></div>
          </section>
          <section className="brief"><span className="eyebrow">A NOTE FROM THE OWNER</span><h2>Help us see what's coming.</h2><p>Our mug orders are growing. We have promotions planned for Friday and Saturday next week.</p><p>Train a model on the last 28 days to predict how many mugs customers will want each day.</p><div className="objective"><span aria-hidden="true">◎</span><p><strong>Your goal</strong>Run a forecast, then change a feature or a line of Python and notice what moves.</p></div></section>
          <p className="data-note">Simulated shop · intentionally simple data.<br />Demand means mugs wanted, not sales fulfilled.</p>
        </aside>
        <div className="analyst-column">
          <DemandHistory predictions={predictions} />
          <section className="experiment-card" aria-labelledby="experiment-title">
            <div className="section-heading"><div><span className="eyebrow">YOUR WORKBENCH</span><h2 id="experiment-title">Build a little intuition.</h2></div><span className="step-count">01 → 02 → 03</span></div>
            <fieldset disabled={python.phase === 'running'}><legend><span className="step-number">1</span>Choose what your model can see</legend><div className="feature-choices">
              <label className={choice === 'trend' ? 'feature-option selected' : 'feature-option'}><input type="radio" name="features" checked={choice === 'trend'} onChange={() => choose('trend')} /><span><strong>Trend only</strong><small>Learn from the day number.</small></span><span className="choice-glyph" aria-hidden="true">↗</span></label>
              <label className={choice === 'promotions' ? 'feature-option selected' : 'feature-option'}><input type="radio" name="features" checked={choice === 'promotions'} onChange={() => choose('promotions')} /><span><strong>Trend + promotions</strong><small>Also see the planned sale days.</small></span><span className="choice-glyph" aria-hidden="true">✧</span></label>
            </div></fieldset>
            <div className="prediction-input"><label htmlFor="expectation"><span className="step-number">2</span>Your prediction</label><input id="expectation" value={expectation} disabled={python.phase === 'running'} onChange={(event) => setExpectation(event.target.value)} placeholder="I think the promotion days will…" maxLength={500} /><p>Make a guess before you run. There's no wrong answer here.</p></div>
            <div className="code-label"><label htmlFor="python-code"><span className="step-number">3</span>Edit & run your Python</label><button className="text-button" disabled={python.phase === 'running'} onClick={() => setCode(starterCode(choice))}>Restore starter</button></div>
            <p className="code-help">Your choice updates the <code>features</code> line. The rest is yours to edit.</p>
            {!starterFeaturesAssignment.test(code) && <p className="inline-note">Custom features code is preserved. The choices above won't change it. Edit your features directly, or restore the starter to use the selected choice.</p>}
            <div className="editor"><div className="editor-toolbar"><span>forecast.py</span><span>PYTHON · PANDAS · SCIKIT-LEARN</span></div><textarea id="python-code" aria-label="Python code" spellCheck={false} value={code} onChange={(event) => setCode(event.target.value)} disabled={python.phase === 'running'} /></div>
            <div className="run-bar"><div role="status" aria-live="polite" className={`runtime-status ${python.phase}`}><span className={busy ? 'status-spinner' : 'status-dot'} aria-hidden="true" />{python.phase === 'error' ? 'Forecast failed — check the error below' : python.phase === 'unavailable' ? 'Python unavailable' : python.message}</div><button className="run-button" disabled={busy || python.phase === 'unavailable' || !expectation.trim() || !code.trim()} onClick={run}>{python.phase === 'running' ? 'Training…' : 'Run forecast'}<span aria-hidden="true">▶</span></button></div>
            <div className="recovery-controls">
              {python.phase === 'running' && <button className="secondary-button" onClick={python.stop}>Stop run</button>}
              <button className="text-button" disabled={python.phase === 'loading'} onClick={python.reset}>Reset Python</button>
              <span>Reset starts a fresh session and keeps your code and prediction.</span>
            </div>
            {!expectation.trim() && <p className="run-hint">Write your prediction to unlock Run forecast.</p>}
            {(python.phase === 'error' || python.phase === 'unavailable') && <div className="error-box" role="alert"><strong>{python.phase === 'error' ? 'Your code needs another look.' : 'The Python session is not ready.'}</strong><pre>{python.message}</pre>{python.phase === 'error' && <p>Edit your code above, then run it again.</p>}</div>}
          </section>
          <section className="results-card" aria-labelledby="results-title"><div className="section-heading"><div><span className="eyebrow">FROM DATA TO A DECISION</span><h2 id="results-title">{predictions ? 'Meet your forecast.' : 'A glimpse of the demand.'}</h2></div><span className="units-label">MUGS / DAY</span></div>
            {!predictions && <p className="empty-result">No current forecast. Run your model to predict the upcoming week in the chart above.</p>}
            {predictions && <><div className="result-summary"><span><strong>{predictions.reduce((sum, value) => sum + value, 0).toFixed(1)}</strong> mugs predicted next week</span><span>Sep 28 – Oct 04</span></div>{dirty && <p className="inline-note">Code changed since this forecast. Run again to update the results.</p>}<table className="forecast-table"><caption>Daily forecast · latest completed run</caption><thead><tr><th scope="col">Day</th><th scope="col">Predicted mugs</th></tr></thead><tbody>{predictions.map((value, index) => <tr key={scenario.future[index].date}><th scope="row">{dayLabel(scenario.future[index].date)}</th><td>{value.toFixed(1)}</td></tr>)}</tbody></table><div className="reflection"><span className="eyebrow">BEFORE YOU RAN, YOU THOUGHT</span><p>{submitted?.expectation}</p><strong>What changed on Friday and Saturday?</strong><p>Try the other feature choice or edit the code, then run another forecast.</p></div>{python.result?.output && <details className="python-output"><summary>Python output</summary><pre>{python.result.output}</pre></details>}</>}
            {!predictions && previous && <details className="previous-run">
              <summary>Previous successful forecast · run {previous.number}</summary>
              <p>This is a saved successful run, not the result of the current attempt. Its code and expectation are shown below.</p>
              <p><strong>Visual choice:</strong> {previous.choice === 'trend' ? 'Trend only' : 'Trend + promotions'} (the saved Python determines the features used).</p>
              <p><strong>Before that run:</strong> {previous.expectation}</p>
              <table className="forecast-table">
                <caption>Previous forecast · run {previous.number}</caption>
                <thead><tr><th scope="col">Day</th><th scope="col">Predicted mugs</th></tr></thead>
                <tbody>{previous.predictions.map((value, index) => <tr key={scenario.future[index].date}><th scope="row">{dayLabel(scenario.future[index].date)}</th><td>{value.toFixed(1)}</td></tr>)}</tbody>
              </table>
              <details className="python-output"><summary>Saved Python · run {previous.number}</summary><pre>{previous.code}</pre></details>
              {previous.output && <details className="python-output"><summary>Saved output · run {previous.number}</summary><pre>{previous.output}</pre></details>}
            </details>}
          </section>
          <StockingDesk forecast={previous} />
          {evaluationOpen ? <EvaluationLab /> : <section className="results-card"><h2>How good is your model?</h2><p>Compare against a simple baseline on later historical days.</p><button className="run-button" onClick={() => setEvaluationOpen(true)}>Open evaluation lab</button></section>}
          {missingDataOpen ? <MissingDataLesson /> : <section className="results-card"><h2>What if the data is incomplete?</h2><p>Inspect missing values, try a preparation choice, and compare the evidence from your runs.</p><button className="run-button" onClick={() => setMissingDataOpen(true)}>Open missing-data lesson</button></section>}
          {leakageOpen ? <LeakageLesson /> : <section className="results-card"><h2>Can you use that feature in time?</h2><p>Investigate an impressive historical result and test whether its inputs support a real forecast.</p><button className="run-button" onClick={() => setLeakageOpen(true)}>Open leakage lesson</button></section>}
        </div>
      </div>
      <footer><span>little goods · big questions</span><span>Your code runs in this browser. No Python installation needed.</span></footer>
    </main>
  </div>;
}
