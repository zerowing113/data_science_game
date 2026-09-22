import { useState } from 'react';
import type { EvaluationRecord } from './EvaluationLab';
import { EvaluationTimeline } from './EvaluationTimeline';

export function EvaluationVisual({ record, status }: { record: EvaluationRecord; status: string }) {
  const [selected, setSelected] = useState(0);
  const rows = record.rows;
  const row = rows[selected];
  const maximum = Math.max(1, ...rows.flatMap((item) => [item.actual, item.baseline, item.predicted]));
  const errorMaximum = Math.max(1, ...rows.flatMap((item) => [item.modelError, item.baselineError]));
  const x = (index: number) => 60 + index * 710 / (rows.length - 1);
  const demandY = (value: number) => 170 - value / maximum * 120;
  const errorY = (value: number) => 360 - value / errorMaximum * 115;
  const path = (field: 'actual' | 'baseline' | 'predicted') => rows.map((item, index) => `${x(index)},${demandY(item[field])}`).join(' ');
  const totalModelError = rows.reduce((sum, item) => sum + item.modelError, 0);
  const totalBaselineError = rows.reduce((sum, item) => sum + item.baselineError, 0);

  return <section className="evaluation-visual" aria-label={`Visual evaluation run ${record.number}`}>
    <div className="evaluation-visual-heading"><div><span className="eyebrow">FROM DAILY ERRORS TO A SCORE</span><h3>See where the forecast misses</h3></div><strong>Saved run {record.number}</strong></div>
    <p className="visual-run-status">{status}</p>
    <EvaluationTimeline trainingDays={record.trainingDays} label={`Saved evaluation split for run ${record.number}`} />
    <div className="evaluation-visual-grid">
      <div>
        <div className="evaluation-chart-legend"><span>● Observed demand</span><span>◇ Model predictions</span><span>▪ Baseline · dashed line</span></div>
        <div className="evaluation-chart-scroll" role="region" aria-label={`Scrollable comparison charts for run ${record.number}`} tabIndex={0}>
          <svg viewBox="0 0 830 400" role="img" aria-label={`Run ${record.number}: demand and absolute errors on the same ${rows.length} evaluation dates, in mugs per day. Use the date buttons below for exact values.`}>
            <text x="16" y="22" className="plot-title">Demand · mugs / day</text>
            <text x="16" y="221" className="plot-title">Absolute error · mugs / day · lower is better</text>
            <rect x={x(selected) - 20} y="36" width="40" height="330" rx="8" fill="#f4e6be" />
            {[0, .5, 1].map((fraction) => <g key={fraction}>
              <line x1="52" x2="792" y1={demandY(maximum * fraction)} y2={demandY(maximum * fraction)} stroke="#dce3d7" />
              <text x="44" y={demandY(maximum * fraction) + 4} textAnchor="end">{(maximum * fraction).toFixed(0)}</text>
              <line x1="52" x2="792" y1={errorY(errorMaximum * fraction)} y2={errorY(errorMaximum * fraction)} stroke="#dce3d7" />
              <text x="44" y={errorY(errorMaximum * fraction) + 4} textAnchor="end">{(errorMaximum * fraction).toFixed(0)}</text>
            </g>)}
            <polyline points={path('actual')} fill="none" stroke="#68777e" strokeWidth="3" />
            <polyline points={path('baseline')} fill="none" stroke="#a76829" strokeWidth="2" strokeDasharray="7 5" />
            <polyline points={path('predicted')} fill="none" stroke="#276b52" strokeWidth="2" />
            {rows.map((item, index) => <g key={item.date}>
              <circle cx={x(index)} cy={demandY(item.actual)} r="5" fill="#68777e" />
              <rect x={x(index) - 4} y={demandY(item.baseline) - 4} width="8" height="8" fill="#a76829" />
              <path d={`M${x(index)} ${demandY(item.predicted) - 7}l7 7 -7 7 -7 -7Z`} fill="#fffdf7" stroke="#276b52" strokeWidth="2" />
              <rect x={x(index) - 15} y={errorY(item.baselineError)} width="12" height={360 - errorY(item.baselineError)} fill="#bf8b51" />
              <rect x={x(index) + 3} y={errorY(item.modelError)} width="12" height={360 - errorY(item.modelError)} fill="#e4eee3" stroke="#276b52" strokeWidth="2" />
              <text x={x(index)} y="191" textAnchor="middle">{item.date.slice(5).replace('-', '/')}</text>
              <text x={x(index)} y="382" textAnchor="middle">{item.date.slice(5).replace('-', '/')}</text>
            </g>)}
          </svg>
        </div>
        <p className="error-bar-key">Daily error bars: solid = baseline · outlined = model. Both plots use the same dates; each has its own vertical scale.</p>
        <div className="evaluation-date-picker" role="group" aria-label={`Inspect evaluation dates for run ${record.number}`}>{rows.map((item, index) => <button key={item.date} aria-label={`Inspect errors on ${item.date}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.date.slice(5).replace('-', '/')}</button>)}</div>
      </div>
      <aside className="error-inspector" aria-label={`Daily error explanation for run ${record.number}`}>
        <span className="eyebrow">INSPECT ONE DAY</span><h4>{row.date}</h4>
        <p>Observed demand: <strong>{row.actual.toFixed(2)} mugs</strong></p>
        <div><span>Model absolute error</span><strong>|{row.predicted.toFixed(2)} − {row.actual.toFixed(2)}| = {row.modelError.toFixed(2)} mugs</strong></div>
        <div><span>Baseline absolute error</span><strong>|{row.baseline.toFixed(2)} − {row.actual.toFixed(2)}| = {row.baselineError.toFixed(2)} mugs</strong></div>
        <p>The distance counts whether a prediction is too high or too low. Zero means an exact match for this day.</p>
      </aside>
    </div>
    <div className="mae-explanation">
      <div><span>Model · sum of daily absolute errors ÷ days</span><strong>{totalModelError.toFixed(2)} ÷ {rows.length} days = {record.modelMae.toFixed(2)} mugs/day</strong></div>
      <div><span>Baseline · sum of daily absolute errors ÷ days</span><strong>{totalBaselineError.toFixed(2)} ÷ {rows.length} days = {record.baselineMae.toFixed(2)} mugs/day</strong></div>
    </div>
    <p className="error-bar-key">Displayed values are rounded. Scores use full precision. This chart shows the saved Python output, not an assumption about the feature selector.</p>
  </section>;
}
