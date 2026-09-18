import { useEffect, useRef } from 'react';
import { practiceSteps, useMission, type PracticeEvidence } from './mission';
import './mission.css';

const steps = {
  explore: { title: 'Explore', objective: 'Select a historical day, inspect a column, and open upcoming inputs. Notice which demand values are still unknown.', help: ['Compare a promotion day with an ordinary day.', 'The column buttons explain when each value becomes available.', 'Select a historical date, click Explain demand, then open Upcoming week and confirm your inspection.'] },
  forecast: { title: 'Forecast', objective: 'Choose features, write an expectation, run the working starter, and inspect the upcoming forecast.', help: ['Read the error or compare the promotion-day predictions with your expectation.', 'The features list controls which columns the model uses. Restore the starter if your edit broke the script.', 'Try Trend + promotions, write an expectation, and run. Inspect the seven-day result before continuing.'] },
  evaluate: { title: 'Compare', objective: 'Choose a chronological split and features, predict the effect, then compare your model with the baseline on the same dates.', help: ['Lower MAE means a smaller average prediction error.', 'Both forecasts must be scored on the same later dates. A poor score is evidence you can learn from.', 'Try Trend + promotions with 21 training days. Run and inspect actual demand, predictions, and both MAEs.'] },
  repair: { title: 'Repair', objective: 'Try untreated data first. Then choose training medians, write the two missing preparation lines, run, and inspect the repaired forecast.', help: ['Find the missing cells and inspect the failed attempt before repairing.', 'Fit the imputer on history; use transform, without fitting again, on future inputs.', 'X_train = imputer.fit_transform(history[features])\nX_future = imputer.transform(future[features])'] },
  timing: { title: 'Check timing', objective: 'Try the closing report and inspect its consequence. Choose known inputs, start the independent repair, then write the training and prediction block.', help: ['A perfect historical score may depend on information you cannot have before forecasting.', 'Choose Trend + planned promotions. Start the independent repair and create, fit, and predict with LinearRegression.', 'model = LinearRegression()\nmodel.fit(history[features], history["demand"])\npredictions = pd.Series(model.predict(future[features]), index=future.index)'] },
  stock: { title: 'Stock', objective: 'Use your upcoming forecast from step 2, review the business rules, commit daily orders, and inspect demand, lost sales, leftovers, and profit.', help: ['Demand and fulfilled sales are different; compare both after advancing.', 'Unsold stock still costs money, with only $1 recovered per leftover. This is business feedback, not a model-quality score.', 'Select a saved forecast, enter whole daily quantities, advance the shop, and inspect that decision. Replays use already revealed demand.'] },
};

function evidenceLabel(evidence: PracticeEvidence) {
  switch (evidence.step) {
    case 'explore': return `Historical day ${evidence.day}; ${evidence.column} and upcoming inputs inspected`;
    case 'forecast': return `Forecast run ${evidence.record.number}`;
    case 'evaluate': return `Evaluation run ${evidence.record.number}: model MAE ${evidence.record.modelMae.toFixed(2)}`;
    case 'repair': return `Missing-data run ${evidence.record.number}`;
    case 'timing': return `Timing experiment ${evidence.record.number}: ${evidence.record.leakageCheck.validity}`;
    case 'stock': return `Stocking decision ${evidence.record.number}, from forecast run ${evidence.record.experiment.number}`;
  }
}

export function MissionGuide({ onOpenFinal }: { onOpenFinal: () => void }) {
  const { state, step, dispatch } = useMission();
  const heading = useRef<HTMLHeadingElement>(null);
  const completed = practiceSteps.filter((item) => state.evidence[item]).length;
  const hints = state.hints[step] ?? 0;
  useEffect(() => {
    if (state.active) { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'start' }); }
  }, [state.active, state.current]);
  if (!state.active) return <section className="mission-guide" aria-label="Practice mission"><h2>One question, six steps</h2><p>Follow a guided practice journey from exploring demand to stocking the shop. Start with working Python, then write more of the repairs yourself. Progress and experiments stay in this page until reload.</p><button className="run-button" onClick={() => dispatch({ type: 'start' })}>{completed ? 'Resume guided practice' : 'Start guided practice'}</button><p>Or use the workspaces below for free practice. Ready to apply your learning?</p><button className="secondary-button" onClick={onOpenFinal}>Open final challenge</button></section>;
  return <section className="mission-guide" aria-label="Practice mission">
    <span className="eyebrow">GUIDED PRACTICE</span><h2 ref={heading} tabIndex={-1}>Step {state.current + 1} of 6: {steps[step].title}</h2>
    <p>{steps[step].objective}</p><p><strong>{completed} of 6 steps inspected</strong>. Progress records your actions and results, not proof of understanding.</p>
    <progress aria-label="Practice progress" value={completed} max={6} />
    <nav aria-label="Practice steps">{practiceSteps.map((item, index) => <button key={item} aria-label={`Review step ${index + 1}: ${steps[item].title}`} aria-current={item === step ? 'step' : undefined} disabled={index > completed} onClick={() => dispatch({ type: 'visit', index })}>Review step {index + 1}: {steps[item].title}{state.evidence[item] ? ' ✓' : ''}</button>)}</nav>
    {state.evidence[step] && <p className="mission-evidence">Inspected evidence: {evidenceLabel(state.evidence[step])}. Saved work stays available when you revisit a step.</p>}
    <div className="mission-hints"><p>Optional help · Hints viewed: {hints} of 3</p>{!state.observed[step] && <p>{step === 'explore' ? 'Inspect the data to unlock hints.' : 'Run an experiment first to unlock hints.'}</p>}{steps[step].help.slice(0, hints).map((hint, index) => <pre key={index}>Hint {index + 1}: {hint}</pre>)}<button className="text-button" disabled={!state.observed[step] || hints === 3} onClick={() => dispatch({ type: 'hint' })}>Show next hint</button></div>
    {completed === 6 && <div className="mission-finished"><h3>Practice journey complete</h3><p>You explored, forecast, compared, repaired, checked timing, and inspected a stocking outcome. Continue to the fresh-data final challenge and reflection; this practice journey does not award a final win.</p><button className="run-button" onClick={onOpenFinal}>Open final challenge</button></div>}
    <div className="recovery-controls">{state.current < 5 && <button className="run-button" disabled={!state.evidence[step]} onClick={() => dispatch({ type: 'next' })}>Continue to next step</button>}<button className="text-button" onClick={() => dispatch({ type: 'pause' })}>Return to free practice</button></div>
  </section>;
}
