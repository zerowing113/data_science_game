import { useEffect, useState } from 'react';
import { dayLabel } from './scenario';
import { money, type StockingDecision } from './shop';

const phases = ['Morning delivery', 'Customers place orders', 'Evening clearance'];

function DayScene({ row, phase, moving }: { row: StockingDecision['rows'][number]; phase: number; moving: boolean }) {
  const units = Math.max(1, Math.ceil(Math.max(row.stock, row.demand) / 12));
  const stockedSymbols = Math.ceil(row.stock / units);
  const leftoverSymbols = Math.ceil(row.leftover / units);
  return <div className={`shop-day-scene phase-${phase} ${moving ? 'is-playing' : ''}`} role="region" aria-label="Scrollable shop scene" tabIndex={0}>
    <svg viewBox="0 0 660 260" role="img" aria-label={`${phases[phase]}: ${row.stock} stocked; ${phase === 0 ? 'orders have not played yet' : `${row.fulfilled} sold, ${row.lost} unfilled, ${row.leftover} leftovers${phase === 2 ? ' cleared; shelf empty for tomorrow' : ''}`}`}>
      <rect width="660" height="260" rx="18" fill="#f2e4d0" />
      <path d="M0 224H660V260H0Z" fill="#d9c2a0" />
      <rect x="22" y="25" width="310" height="190" rx="24" fill="#fff5e3" />
      <text x="177" y="52" textAnchor="middle" fill="#43614b" fontSize="15">THE EVERYDAY MUG</text>
      {[127, 200].map(y => <rect key={y} x="38" y={y} width="276" height="10" rx="5" fill="#b1845e" />)}
      {Array.from({ length: 12 }, (_, i) => <g key={i} transform={`translate(${48 + i % 6 * 44} ${84 + Math.floor(i / 6) * 73})`}>
        <path d="M0 42H32" stroke="#decaae" strokeWidth="2" />
        {i < stockedSymbols && <g className={`shelf-mug ${i >= leftoverSymbols ? 'sold-mug' : 'remaining-mug'}`}>
          <path d="M23 5H28C39 5 39 22 27 22H23" fill="none" stroke="#b77554" strokeWidth="5" />
          <path d="M0 0H26V26Q26 36 16 36H10Q0 36 0 26Z" fill="#d99d78" />
          <path d="M5 5V23" stroke="#fbe5c8" strokeWidth="3" strokeLinecap="round" />
        </g>}
      </g>)}
      <path d="M350 106H383M376 98L384 106L376 114" stroke="#8d7959" fill="none" strokeWidth="3" />
      <g className={`sent-parcel ${row.fulfilled > 0 ? 'has-sales' : ''}`}>
        <rect x="413" y="84" width="68" height="49" rx="5" fill="#c79562" />
        <path d="M445 84V133" stroke="#f6dfaa" strokeWidth="12" />
      </g>
      <text x="448" y="65" textAnchor="middle" fill="#315c46" fontSize="14">Orders sent</text>
      <text x="448" y="156" textAnchor="middle" fill="#315c46" fontSize="21" fontWeight="bold">{phase === 0 ? '—' : `${row.fulfilled} sold`}</text>
      <rect x="510" y="82" width="127" height="52" rx="16" fill="#f6d4b0" />
      <text x="573" y="65" textAnchor="middle" fill="#835129" fontSize="14">Unmet demand</text>
      <text x="573" y="115" textAnchor="middle" fill="#835129" fontSize="19" fontWeight="bold">{phase === 0 ? '?' : `${row.lost} unfilled`}</text>
      <rect x="391" y="181" width="246" height="40" rx="9" fill="#e1d5e5" />
      <text x="514" y="207" textAnchor="middle" fill="#654c73" fontSize="16">{phase === 0 ? 'Clearance at the end of each day' : `${row.leftover} leftovers ${phase === 2 ? 'cleared' : 'to clear'}`}</text>
      <text x="177" y="244" textAnchor="middle" fill="#584c37" fontSize="14">{phase === 2 ? 'Empty for tomorrow · no carryover' : `${phase === 0 ? row.stock : row.leftover} mugs on the shelf after this stage`}</text>
    </svg>
    <p className="symbol-note">Each shelf symbol represents up to {units} mugs. Parcels are illustrative; the quantities shown are exact.</p>
  </div>;
}

/** Playback is transient presentation state. Only StockingDesk commits decisions. */
export function ShopPlayback({ decision, autoPlay, active }: { decision: StockingDecision; autoPlay: boolean; active: boolean }) {
  const end = decision.rows.length * phases.length;
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [step, setStep] = useState(autoPlay && !reducedMotion ? 0 : end);
  const [playing, setPlaying] = useState(autoPlay && !reducedMotion);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { setReducedMotion(preference.matches); if (preference.matches) setPlaying(false); };
    const visibility = () => { if (document.hidden) setPlaying(false); };
    preference.addEventListener('change', change);
    document.addEventListener('visibilitychange', visibility);
    return () => { preference.removeEventListener('change', change); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => { if (!active) setPlaying(false); }, [active]);
  useEffect(() => {
    if (!playing || !active || step === end) return;
    const timer = window.setTimeout(() => { setStep(step + 1); if (step + 1 === end) setPlaying(false); }, 1800);
    return () => window.clearTimeout(timer);
  }, [playing, active, step, end]);

  const complete = step === end;
  const day = Math.floor(step / phases.length);
  const phase = step % phases.length;
  const row = decision.rows[Math.min(day, decision.rows.length - 1)];
  const result = complete ? decision.totals : row;
  function show(next: number) { setPlaying(false); setStep(next); }

  return <section className="shop-playback" aria-label="Shop playback">
    <div className="playback-heading"><div><span className="eyebrow">YOUR SHOP IN MOTION</span><h3>{complete ? 'Week complete' : `Day ${day + 1} · ${dayLabel(row.date)}`}</h3></div><span>Decision {decision.number} · Forecast run {decision.experiment.number}</span></div>
    <p>{decision.replay ? 'Revised stock · replay of already revealed demand.' : 'Your committed week.'} Playback only views this saved decision; it never places another order.</p>
    <nav className="playback-days" aria-label="View saved shop days">{decision.rows.map((entry, index) => <button key={entry.date} aria-label={`View day ${index + 1}: ${entry.date}`} aria-pressed={!complete && day === index} onClick={() => show(index * phases.length + 2)}><span>{dayLabel(entry.date)}</span><strong>{money(entry.profitCents)}</strong><small>daily profit</small></button>)}</nav>
    <div className="playback-controls">
      <button className="run-button" onClick={() => { if (complete) setStep(0); setPlaying(!playing); }}>{complete ? 'Replay animation' : playing ? 'Pause playback' : 'Play playback'}</button>
      <button className="secondary-button" disabled={complete} onClick={() => show(Math.min(step + 1, end))}>Next stage</button>
      <button className="secondary-button" disabled={complete} onClick={() => show(end)}>Skip to week results</button>
    </div>
    {!complete && <><p className="playback-phase" aria-live="polite">{phases[phase]} · {playing ? 'Playing' : 'Paused'}</p><DayScene key={`${day}-${phase}`} row={row} phase={phase} moving={playing && !reducedMotion} /></>}
    {complete && <div className="week-flow" aria-label="Week outcome flow"><div><span>Ordered across 7 days</span><strong>{result.stock} mugs</strong><small>Each daily order arrived separately</small></div><span aria-hidden="true">→</span><div><span>Customers wanted</span><strong>{result.demand} mugs</strong><small>{result.fulfilled} sold + {result.lost} unfilled</small></div><span aria-hidden="true">→</span><div><span>Leftovers cleared</span><strong>{result.leftover} mugs</strong><small>No stock carried between days</small></div></div>}
    <div className="playback-ledger" aria-label={complete ? 'Week financial results' : 'Day financial results'}>
      <div><span>{complete ? 'Week' : 'Day'} stock</span><strong>{result.stock} stocked</strong></div>
      <div><span>Purchase cost</span><strong>−{money(result.purchaseCents)}</strong></div>
      <div><span>Sales revenue</span><strong>{!complete && phase === 0 ? 'Not played yet' : `+${money(result.revenueCents)}`}</strong></div>
      <div><span>Clearance recovery</span><strong>{!complete && phase < 2 ? 'At day end' : `+${money(result.salvageCents)}`}</strong></div>
      <div className="ledger-profit"><span>{complete ? 'Week' : 'Final daily'} profit</span><strong>{!complete && phase < 2 ? 'At day end' : money(result.profitCents)}</strong></div>
    </div>
    <p>Demand includes fulfilled and unfilled orders. Leftovers clear every evening; the next day starts with a new order. Profit is business feedback, not a forecast score.</p>
    {reducedMotion && <p>Reduced motion is on. View any day or use Next stage for a still view of each step.</p>}
  </section>;
}
