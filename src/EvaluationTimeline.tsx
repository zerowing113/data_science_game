import { evaluationSplit, type TrainingDays } from './evaluation';

export function EvaluationTimeline({ trainingDays, label }: { trainingDays: TrainingDays; label: string }) {
  const { history, heldOut } = evaluationSplit(trainingDays);
  return <section className="evaluation-timeline" aria-label={label}>
    <div className="split-periods" style={{ gridTemplateColumns: `${history.length}fr ${heldOut.length}fr` }}>
      <div><strong>{history.length} training days</strong><span>{history[0].date} – {history.at(-1)!.date}</span><small>Earlier observations · learn here</small></div>
      <div><strong>{heldOut.length} evaluation days</strong><span>{heldOut[0].date} – {heldOut.at(-1)!.date}</span><small>Later observations · test here</small></div>
    </div>
    <ol className="split-calendar" aria-label="Observations in chronological order">{[...history, ...heldOut].map((row, index) => <li key={row.date} className={index < trainingDays ? 'training-date' : 'evaluation-date'} aria-label={`${row.date}: ${index < trainingDays ? 'training observation' : 'evaluation observation'}`}><span>{row.date.slice(5).replace('-', '/')}</span><strong>{index < trainingDays ? 'T' : 'E'}</strong></li>)}</ol>
    <p>T = training · E = evaluation. Time moves left to right, then to the next row. Evaluation demand is observed history held back from the Python inputs, not next week's unknown demand.</p>
  </section>;
}
