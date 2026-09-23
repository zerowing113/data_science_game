import { finalChallenge, type FinalAttempt, type scoreFinal } from './challenge';
import { EvaluationVisual } from './EvaluationVisual';
import './evaluation.css';

type ChallengeInputs = Pick<ReturnType<typeof finalChallenge>, 'history' | 'future'>;

export function FinalSplit({ history, future, revealed = false }: ChallengeInputs & { revealed?: boolean }) {
  return <section className="evaluation-timeline" aria-label="Final chronological split">
    <div className="split-periods" style={{ gridTemplateColumns: '3fr 1fr' }}><div><strong>{history.length} training days</strong><span>{history[0].date} – {history.at(-1)!.date}</span><small>Earlier observed history</small></div><div><strong>{future.length} {revealed ? 'evaluation' : 'upcoming'} days</strong><span>{future[0].date} – {future.at(-1)!.date}</span><small>{revealed ? 'Answers revealed after commitment' : 'Answers not yet revealed'}</small></div></div>
    <ol className="split-calendar" aria-label="Final dates in chronological order">{[...history, ...future].map((row, index) => <li key={row.date} className={index < history.length ? 'training-date' : 'evaluation-date'} aria-label={`${row.date}: ${index < history.length ? 'training' : revealed ? 'evaluation' : 'upcoming'}`}><span>{row.date.slice(5).replace('-', '/')}</span><strong>{index < history.length ? 'T' : revealed ? 'E' : '?'}</strong></li>)}</ol>
    <p>T = training · {revealed ? 'E = evaluation after commitment' : '? = upcoming demand hidden'}. Only earlier history is supplied for training.</p>
  </section>;
}

export function FinalForecastWeek({ future, attempt, dirty, revealed }: Pick<ChallengeInputs, 'future'> & { attempt?: FinalAttempt; dirty: boolean; revealed: boolean }) {
  const predictions = attempt?.result?.predictions;
  const maximum = Math.max(1, ...(predictions ?? []));
  return <section className="final-week" aria-label="Final forecast week"><span className="eyebrow">YOUR FRESH SALE WEEK</span><h3>From known inputs to predicted demand</h3>
    <p>{predictions ? `Saved run ${attempt!.number} · actual Python predictions` : 'No current forecast'}{dirty ? ' · Draft changed; rerun before committing.' : ''}</p>
    <ol className="final-week-days">{future.map((row, index) => <li key={row.date}><time>{row.date}</time><div className="final-prediction-bar" aria-hidden="true">{predictions ? <i style={{ height: `${predictions[index] / maximum * 100}%` }} /> : '?'}</div><strong>{predictions ? predictions[index].toFixed(1) : '—'}</strong><span>{predictions ? 'mugs predicted' : 'not run'}</span><small>{row.promotion ? 'Promotion planned' : 'Regular day'}</small></li>)}</ol>
    <p>{revealed ? 'Committed answers appear in the saved recap below.' : 'Demand stays hidden until stock is committed.'} Planned promotions describe inputs, not which features your Python used.</p>
  </section>;
}

export function FinalEvaluation({ seed, attempt, rows, modelMae, baselineMae }: Pick<ReturnType<typeof scoreFinal>, 'rows' | 'modelMae' | 'baselineMae'> & { seed: number; attempt: FinalAttempt }) {
  const inputs = finalChallenge(seed);
  return <EvaluationVisual record={{ number: attempt.number, modelMae, baselineMae, rows: rows.map((row) => ({ date: row.date, actual: row.demand, predicted: row.predicted, baseline: row.baseline, modelError: Math.abs(row.predicted - row.demand), baselineError: Math.abs(row.baseline - row.demand) })) }}
    status={`Challenge ${seed} · submitted run ${attempt.number}. Scores and answers belong to this committed forecast, not a later editor or a practice run.`}
    timeline={<FinalSplit history={inputs.history} future={rows} revealed />} />;
}
