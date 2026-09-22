import { missingDataFixture } from './missing-data';

export function MissingDataVisual() {
  const partitions = [
    { name: 'Training', rows: missingDataFixture.history },
    { name: 'Evaluation', rows: missingDataFixture.future },
  ];
  return <section className="missing-map" aria-label="Incomplete export map">
    <div className="missing-map-heading"><div><span className="eyebrow">CHECK THE SHOP'S EXPORT</span><h3>Two gaps in the day column</h3></div><span className="missing-count">? = missing</span></div>
    <p>Each card is one actual input row. The number is days since opening, not demand. Missing is not zero; August 31 really is day 0.</p>
    <div className="missing-partitions">{partitions.map(({ name, rows }) => <div className="missing-partition" key={name}>
      <h4>{name} <span>{rows.length}{name === 'Evaluation' ? ' later historical observations held out for testing' : ' earlier observations for learning'}</span></h4>
      <ol className="missing-day-grid">{rows.map((row) => <li key={row.date} className={row.day === null ? 'missing-day is-missing' : 'missing-day'} aria-label={`${row.date}: ${name}, day ${row.day === null ? 'missing' : row.day}`}>
        <time dateTime={row.date}>{row.date.slice(5).replace('-', '/')}</time><strong>{row.day === null ? '?' : row.day}</strong><span>{row.day === null ? 'Missing' : 'day'}</span>
      </li>)}</ol>
    </div>)}</div>
    <p className="missing-map-note">The dates survived. The original gaps stay visible here even after a successful run; your Python receives a fresh copy each time.</p>
    <details className="preparation-illustration"><summary>How training-only preparation works</summary>
      <p><strong>Illustration only</strong> — this explains the principle, not what your code has done. Choosing a preparation option does not execute or verify it.</p>
      <ol className="preparation-flow">
        <li><span className="preparation-step">1</span><h4>Learn once from training</h4><p>Use only the earlier, observed values to learn a fill value. A blank stays unknown until your preparation handles it.</p><div className="preparation-sample">Training: known values + <b>?</b></div></li>
        <li><span className="preparation-step">2</span><h4>Carry the same value forward</h4><p>Transform training and later inputs with that learned value. Do not learn a new value from the evaluation rows.</p><div className="preparation-sample">Learned fill → training &amp; evaluation</div></li>
        <li><span className="preparation-step">3</span><h4>Run, then inspect the evidence</h4><p>A filled input is an estimate, not the recovered truth. Compare the resulting predictions and errors; inspect saved code and output to understand the preparation.</p><div className="preparation-sample">Python → predictions → errors</div></li>
      </ol>
    </details>
  </section>;
}

export function MissingDataFailure({ error, interrupted = false }: { error: string; interrupted?: boolean }) {
  // Match the final exception, not text that could occur in an earlier chained
  // exception or the learner's source shown inside a traceback.
  const exception = error.match(/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*(?::[^\r\n]*)?$/gm)?.at(-1);
  const unfinished = exception === 'NotImplementedError: Write the preparation block';
  const missingInputs = exception === 'ValueError: Input X contains NaN.'
    && error.includes('LinearRegression does not accept missing values encoded as NaN natively.');
  const title = interrupted ? 'This attempt did not finish'
    : unfinished ? 'The preparation block is unfinished'
    : missingInputs ? 'The model received missing inputs' : 'Python could not finish this run';
  const action = interrupted ? 'Reset missing-data Python, check your saved code, and run again. This attempt has no forecast or score.'
    : unfinished ? 'Replace the placeholder with your preparation: learn from training, then transform later inputs using the same learned values. The choice alone does not fill the gaps. Optional practice hints can help.'
    : missingInputs ? 'LinearRegression cannot use these missing inputs. Choose a repair, complete its Python preparation, and rerun. Learn fill values from training only; use them unchanged on later inputs.'
    : 'Open the technical details, check the final error and the indicated line in your saved Python, then edit and rerun. This error does not establish that missing values caused the failure.';
  return <div className="missing-feedback"><strong>{title}</strong><p>{action}</p><details><summary>Full technical details</summary><pre className="missing-error">{error}</pre></details></div>;
}
