import { useState } from 'react';
import { scenario } from './scenario';
import { advanceShop, money, shopRules, validStock, type ForecastExperiment, type StockingDecision } from './shop';
import './stocking.css';

export function StockingDesk({ forecast }: { forecast?: ForecastExperiment }) {
  const [selected, setSelected] = useState<ForecastExperiment>();
  const [draft, setDraft] = useState<string[]>([]);
  const [committed, setCommitted] = useState(false);
  const [decisions, setDecisions] = useState<StockingDecision[]>([]);
  const stock = draft.map((value) => value.trim() === '' ? NaN : Number(value));
  const valid = validStock(stock);

  function selectForecast() {
    if (!forecast) return;
    setSelected({ ...forecast, predictions: [...forecast.predictions] });
    setDraft(forecast.predictions.map((value) => String(Math.round(value))));
    setCommitted(false);
  }

  function advance() {
    if (!selected || !valid || committed) return;
    const outcome = advanceShop(stock);
    setDecisions((previous) => [...previous, { ...outcome, number: previous.length + 1, experiment: selected, replay: previous.length > 0 }]);
    setCommitted(true);
  }

  return <section className="results-card stocking-desk" aria-labelledby="stocking-title">
    <div className="section-heading"><div><span className="eyebrow">FROM FORECAST TO SHELF</span><h2 id="stocking-title">Stock the shop</h2></div></div>
    <p>Plan daily mug stock for September 28 – October 4 using a completed upcoming-week forecast. Historical evaluation runs do not supply this week's stocking predictions.</p>
    <div className="stocking-rules"><h3>Before you commit</h3><p><strong>{money(shopRules.saleCents)} sale price · {money(shopRules.purchaseCents)} purchase cost · {money(shopRules.salvageCents)} recovered per leftover</strong></p><p>Commit all seven daily quantities before revealing demand. Each day's order arrives before customers shop. Buy all ordered stock, including unsold mugs. Leftovers are cleared for {money(shopRules.salvageCents)} each at day's end; no stock carries over. Lost sales are unfilled demand and are not backordered.</p><p>Profit = sales revenue + leftover recovery − purchase cost. This simplified shop excludes fixed costs, taxes, and extra lost-sale fees. Daily capacity: {shopRules.dailyCapacity.toLocaleString('en-US')} mugs.</p><p><strong>Profit is business feedback, not proof of model quality.</strong> Use the evaluation lab to assess forecast error.</p></div>
    {!forecast && <p>Complete an upcoming-week forecast to plan stock.</p>}
    {forecast && <><p>Latest completed forecast: <strong>run {forecast.number}</strong>. Saved forecasts remain available even if a later Python attempt fails or is reset.</p><button className="run-button" onClick={selectForecast}>Plan stock from forecast run {forecast.number}</button></>}
    {selected && <div className="stock-plan">
      <h3>Planning from forecast run {selected.number}</h3>
      <p>Stock suggestions round that saved forecast to the nearest whole mug. Edit any quantity before committing. Editor changes or a new forecast do not silently change this plan.</p>
      {forecast && forecast.number !== selected.number && <p className="inline-note">A newer forecast is available. Select it above to replace this draft; this plan still uses run {selected.number}.</p>}
      <div className="stock-table-scroll" tabIndex={0} role="region" aria-label="Stock plan table"><table className="forecast-table"><caption>Daily stock plan · forecast run {selected.number}</caption><thead><tr><th scope="col">Date</th><th scope="col">Predicted demand</th><th scope="col">Stock to order</th></tr></thead><tbody>{scenario.future.map((day, index) => <tr key={day.date}><th scope="row">{day.date}</th><td>{selected.predictions[index].toFixed(1)}</td><td><input aria-label={`Stock for ${day.date}`} type="number" min={0} max={shopRules.dailyCapacity} step={1} value={draft[index]} disabled={committed} onChange={(event) => setDraft((current) => current.map((value, position) => position === index ? event.target.value : value))} /></td></tr>)}</tbody></table></div>
      {!valid && <p className="inline-note">Enter a whole quantity from 0 to {shopRules.dailyCapacity.toLocaleString('en-US')} for every day. Blank, fractional, and negative quantities cannot be committed.</p>}
      {decisions.length > 0 && <p className="inline-note">Demand for this fixed practice week has already been revealed. Further decisions are replays, not unseen forecasting tests. The data explorer keeps the original forecast-time inputs.</p>}
      <div className="recovery-controls"><button className="run-button" disabled={!valid || committed} onClick={advance}>Advance shop and reveal demand</button>{committed && <button className="text-button" onClick={() => setCommitted(false)}>Revise stock for a replay</button>}</div>
    </div>}
    {decisions.length > 0 && <div className="stock-table-scroll" tabIndex={0} role="region" aria-label="Compare saved stocking decisions"><table className="forecast-table"><caption>Stocking comparison</caption><thead><tr>{['Decision', 'Forecast run', 'Stock', 'Demand', 'Fulfilled', 'Lost', 'Leftover', 'Profit'].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{decisions.map((decision) => <tr key={decision.number}><th scope="row">{decision.number}{decision.replay ? ' (replay)' : ''}</th><td>{decision.experiment.number}</td><td>{decision.totals.stock}</td><td>{decision.totals.demand}</td><td>{decision.totals.fulfilled}</td><td>{decision.totals.lost}</td><td>{decision.totals.leftover}</td><td>{money(decision.totals.profitCents)}</td></tr>)}</tbody></table></div>}
    {decisions.map((decision) => <article className="stock-outcome" key={decision.number} aria-label={`Stocking decision ${decision.number}`}>
      <h3>Stocking decision {decision.number} · Forecast run {decision.experiment.number}</h3>
      <p>{decision.replay ? 'Replay of already revealed demand.' : 'First reveal of this practice week.'} Each decision is an independent simulation of September 28 – October 4.</p>
      <div className="stock-totals">{[`Stock ordered: ${decision.totals.stock}`, `Demand: ${decision.totals.demand}`, `Fulfilled orders: ${decision.totals.fulfilled}`, `Lost sales: ${decision.totals.lost}`, `Leftover inventory: ${decision.totals.leftover}`, `Profit: ${money(decision.totals.profitCents)}`].map((label) => <strong key={label}>{label}</strong>)}</div>
      <p>Sales revenue: {money(decision.totals.revenueCents)} + leftover recovery: {money(decision.totals.salvageCents)} − purchase cost: {money(decision.totals.purchaseCents)} = profit: {money(decision.totals.profitCents)}.</p>
      <p>Demand counts all mugs wanted, including lost sales. Fulfilled orders count only mugs actually sold.</p>
      <div className="stock-legend"><span>Green: fulfilled</span><span>Orange: lost sales</span><span>Purple: leftovers</span></div>
      {decision.rows.map((row) => <div className="stock-day" key={row.date}><span>{row.date}</span><div className="stock-bar" role="img" aria-label={`${row.date}: ${row.fulfilled} fulfilled, ${row.lost} lost sales, ${row.leftover} leftover`}>{[row.fulfilled, row.lost, row.leftover].map((value, index) => <i key={index} className={['fulfilled', 'lost', 'leftover'][index]} style={{ width: `${value / Math.max(row.demand, row.stock, 1) * 100}%` }} />)}</div><span>{row.fulfilled} sold · {row.lost} lost · {row.leftover} left</span></div>)}
      <div className="stock-table-scroll" tabIndex={0} role="region" aria-label={`Shop outcomes for decision ${decision.number}`}><table className="forecast-table"><caption>Daily shop outcomes · decision {decision.number}</caption><thead><tr>{['Date', 'Forecast', 'Stock', 'Demand', 'Fulfilled', 'Lost', 'Leftover', 'Profit'].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{decision.rows.map((row, index) => <tr key={row.date}><th scope="row">{row.date}</th><td>{decision.experiment.predictions[index].toFixed(1)}</td><td>{row.stock}</td><td>{row.demand}</td><td>{row.fulfilled}</td><td>{row.lost}</td><td>{row.leftover}</td><td>{money(row.profitCents)}</td></tr>)}</tbody></table></div>
      <details className="python-output"><summary>Source forecast · decision {decision.number}</summary><p>Forecast run {decision.experiment.number} · visual choice: {decision.experiment.choice === 'trend' ? 'Trend only' : 'Trend + promotions'}. The saved code determines the actual model and features.</p><p>Original expectation: {decision.experiment.expectation}</p><pre>{decision.experiment.code}</pre>{decision.experiment.output && <pre>{decision.experiment.output}</pre>}</details>
    </article>)}
  </section>;
}
