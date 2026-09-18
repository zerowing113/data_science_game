import { useEffect, useRef, useState } from 'react';
import { scenario } from './scenario';
import { ForecastChart } from './ForecastChart';
import './demand-history.css';

const explanations = {
  date: 'Calendar date of this product-day, known before the forecast. Example: 2026-08-31 is the first historical day.',
  day: 'Days since opening, starting at zero; known before the forecast. Example: day 4 is the fifth day.',
  promotion: 'Whether a sale is planned before the forecast: 1 means a promotion, 0 means no promotion. Example: 2026-09-04 has promotion 1.',
  demand: 'Observed demand is the target: mugs customers wanted, only observed after that day. Future demand is unknown when forecasting and cannot be an input feature. Example: customers wanted 40 mugs on 2026-09-04.',
};

export function DemandHistory({ predictions }: { predictions?: number[] }) {
  const [column, setColumn] = useState<keyof typeof explanations>('date');
  const [tab, setTab] = useState<'history' | 'future'>('history');
  const [sort, setSort] = useState('date-asc');
  const [selectedDay, setSelectedDay] = useState<number>();
  const [chartSelection, setChartSelection] = useState(0);
  const selectedRow = useRef<HTMLTableRowElement>(null);
  useEffect(() => { selectedRow.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [selectedDay, tab, chartSelection]);
  const rows = (tab === 'history' ? scenario.history : scenario.future).map((row) => ({ ...row, demand: 'demand' in row ? row.demand as number : undefined }));
  const [sortField, direction] = sort.split('-');
  rows.sort((a, b) => {
    const key = sortField as keyof typeof a;
    const av = a[key] ?? 0;
    const bv = b[key] ?? 0;
    const comparison = typeof av === 'string' && typeof bv === 'string' ? av.localeCompare(bv) : Number(av) - Number(bv);
    return comparison * (direction === 'asc' ? 1 : -1) || a.day - b.day;
  });
  function switchTab(next: 'history' | 'future') {
    setTab(next);
    setSort('date-asc');
  }
  return <section className="history-card" aria-labelledby="history-title">
    <div className="section-heading"><div><span className="eyebrow">GET TO KNOW YOUR DATA</span><h2 id="history-title">Explore the demand history</h2></div></div>
    <p className="simulation-note"><strong>Simulated store data</strong> for a realistic shop scenario. This first mission uses deliberately simple, noise-free demand to make the trend and promotion patterns easy to see.</p>
    <p>Each row represents one product on one day: The Everyday Mug. Demand means mugs customers wanted, not fulfilled sales.</p>
    <p className="explore-hint">Inspect a day and a column before modeling. Exploring is optional; you can run a forecast whenever you are ready.</p>
    <ForecastChart predictions={predictions} selectedDay={selectedDay} onSelectDay={(day) => {
      const next = day < 28 ? 'history' : 'future';
      if (next !== tab) switchTab(next);
      setSelectedDay(day);
      setChartSelection((selection) => selection + 1);
    }} />
    <div className="history-controls">
      <div role="tablist" aria-label="Scenario records">{(['history', 'future'] as const).map((value) => <button key={value} id={`${value}-tab`} role="tab" aria-selected={tab === value} aria-controls="scenario-panel" tabIndex={tab === value ? 0 : -1} onClick={() => switchTab(value)} onKeyDown={(event) => {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const next = event.key === 'Home' ? 'history' : event.key === 'End' ? 'future' : tab === 'history' ? 'future' : 'history';
          switchTab(next);
          document.getElementById(`${next}-tab`)?.focus();
        }
      }}>{value === 'history' ? 'History' : 'Upcoming week'}</button>)}</div>
      <label>Sort records <select value={sort} onChange={(event) => setSort(event.target.value)}>
        <option value="date-asc">Date · oldest first</option><option value="date-desc">Date · newest first</option>
        <option value="promotion-desc">Promotion · sale days first</option><option value="promotion-asc">Promotion · ordinary days first</option>
        {tab === 'history' && <><option value="demand-desc">Demand · highest first</option><option value="demand-asc">Demand · lowest first</option></>}
      </select></label>
    </div>
    <div id="scenario-panel" role="tabpanel" aria-labelledby={`${tab}-tab`}>
    {tab === 'future' && <p className="future-note">Future inputs are known before forecasting. Actual future demand is unknown; model estimates are predicted demand, never observations.</p>}
    <div className="history-table-scroll" tabIndex={0} aria-label="Scrollable scenario records">
      <table className="history-table"><caption>{tab === 'history' ? 'Historical observations' : 'Future inputs'} · The Everyday Mug</caption><thead><tr>{Object.keys(explanations).map((name) => <th scope="col" key={name}><button aria-label={`Explain ${name}`} onClick={() => setColumn(name as keyof typeof explanations)}>{name}</button></th>)}</tr></thead><tbody>
        {rows.map((row) => <tr key={row.day} ref={selectedDay === row.day ? selectedRow : undefined} className={selectedDay === row.day ? 'selected-observation' : undefined} onClick={() => setSelectedDay(row.day)}><th scope="row"><button className="select-observation" aria-pressed={selectedDay === row.day} onClick={() => setSelectedDay(row.day)}>{row.date}</button></th><td>{row.day}</td><td>{row.promotion}</td><td>{row.demand ?? 'Unknown'}</td></tr>)}
      </tbody></table>
    </div>
    </div>
    <div className="column-explanation" role="region" aria-label="Column explanation"><strong>{column}</strong><p>{explanations[column]}</p></div>
  </section>;
}
