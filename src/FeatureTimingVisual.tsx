import { useState } from 'react';
import type { LeakageExperiment } from './leakage';

const featureTiming = [
  { name: 'day', late: false, label: 'Calendar trend', explanation: 'Known before forecasting. Days since opening come from the calendar; you do not need to wait for customer demand.' },
  { name: 'promotion', late: false, label: 'Planned promotion', explanation: 'Known before forecasting. The shop has already planned these promotions, so their schedule is available for the upcoming inputs.' },
  { name: 'closing_requested_units', late: true, label: 'Closing request report', explanation: 'Only after the shop closes. This report counts all requests, including unfulfilled demand. Historical exports contain it, but upcoming inputs omit it. A past answer is not an available forecast input.' },
];

export function FeatureTimingTimeline() {
  const [selected, setSelected] = useState(featureTiming[0]);
  return <section className="feature-timeline" aria-label="Feature availability timeline">
    <span className="eyebrow">WHAT CAN THE SHOP KNOW IN TIME?</span><h3>Put each input on the clock</h3>
    <p>Forecast September 28–October 4 before those days happen. Select a feature to inspect when its information arrives.</p>
    <div className="timing-axis"><strong>Known before forecasting</strong><strong>Forecast cutoff</strong><strong>After each day closes</strong></div>
    {featureTiming.map((feature) => {
      const button = <button className={`timing-feature ${feature.late ? 'late' : 'known'}`} aria-label={`Inspect ${feature.name} availability`} aria-pressed={selected.name === feature.name} onClick={() => setSelected(feature)}><code>{feature.name}</code><span>{feature.label}</span><b>{feature.late ? '× Too late for this forecast' : '✓ Available at cutoff'}</b></button>;
      return <div className="timing-lane" key={feature.name}>
        {feature.late ? <span className="timing-absent">Not in upcoming inputs</span> : button}
        <span className="timing-boundary" aria-hidden="true">{feature.late ? '×' : '→'}</span>
        {feature.late ? button : <span className="timing-absent">No closing outcome needed</span>}
      </div>;
    })}
    <section className="timing-feature-detail" aria-label="Selected feature timing"><strong>{selected.name}</strong><p>{selected.explanation}</p></section>
    <p className="timing-visual-note">Availability guide, not a check of your edited Python. Choose and code your own feature set; the saved experiment below records its actual timing check.</p>
  </section>;
}

export function TimingEvidence({ record, status }: { record: LeakageExperiment; status: string }) {
  const check = record.leakageCheck;
  const scale = Math.max(1, record.modelMae, record.baselineMae);
  const outcome = check.forecastError ? 'Upcoming execution failed'
    : check.forecastPredictions ? `${check.forecastPredictions.length} upcoming predictions returned`
    : 'Upcoming execution not recorded';
  return <section className="timing-evidence" aria-label={`Timing evidence for experiment ${record.number}`}>
    <div className="timing-evidence-heading"><div><span className="eyebrow">TWO DIFFERENT QUESTIONS</span><h3>A low error is only half the story</h3></div><strong>Saved experiment {record.number}</strong></div>
    <p className="timing-visual-note">{status}</p>
    <div className="timing-evidence-grid">
      <section aria-label={`Historical accuracy for experiment ${record.number}`} className="timing-score-card"><span className="timing-card-number">1</span><h4>Did it fit later history?</h4><p>Evaluation: September 21–27, 2026<br />Earlier training: August 31–September 20</p>
        <strong>Historical MAE: {record.modelMae.toFixed(2)} mugs/day</strong><div className="timing-score-track" aria-hidden="true"><span style={{ width: `${record.modelMae / scale * 100}%` }} /></div>
        <strong>Baseline MAE: {record.baselineMae.toFixed(2)} mugs/day</strong><div className="timing-score-track baseline" aria-hidden="true"><span style={{ width: `${record.baselineMae / scale * 100}%` }} /></div>
        <p className="timing-visual-note">Lower is better. Bars share a scale within this comparison. Zero error can still depend on information that arrives too late.</p>
      </section>
      <section aria-label={`Forecast feasibility for experiment ${record.number}`} className={`timing-forecast-card ${check.validity}`}><span className="timing-card-number">2</span><h4>Could the same code forecast?</h4><p>Upcoming inputs: September 28–October 4<br />{check.forecastError || check.forecastPredictions ? 'Same code tried with all 28 observed days' : 'No forecast-time execution evidence saved'}</p>
        <strong className="timing-outcome">{outcome}</strong><p className="timing-verdict">Timing verdict: {check.validity}</p><p>{check.reason}</p>
        <p><strong>Future accuracy: unknown</strong><br />Upcoming demand is not observed here. Execution is not an accuracy test.</p>
      </section>
    </div>
    <p className="timing-visual-note">Evidence belongs to this saved Python execution. A selector change cannot revise it. This diagram does not verify how arbitrary custom code uses its inputs.</p>
  </section>;
}
