import { dayLabel, scenario } from './scenario';

export function ForecastWeek({ predictions, runNumber, message, selectedDay, onSelectDay }: {
  predictions?: number[];
  runNumber?: number;
  message: string;
  selectedDay?: number;
  onSelectDay: (day: number) => void;
}) {
  const maximum = Math.max(1, ...(predictions ?? []));
  return <section className="forecast-week" aria-label="Upcoming week forecast">
    <div className="week-heading"><div><span className="eyebrow">FUTURE INPUTS → PREDICTED DEMAND</span><h3>Next week, day by day</h3></div><span className="units-label">MUGS / DAY</span></div>
    <p className="week-source">{predictions ? `Completed forecast · run ${runNumber}` : 'No current forecast'} · Sep 28 – Oct 04, 2026</p>
    <div className="forecast-days">{scenario.future.map((row, index) => <button key={row.day} className={`forecast-day ${row.promotion ? 'promotion-day' : ''}`} aria-pressed={selectedDay === row.day} onClick={() => onSelectDay(row.day)} aria-label={`Inspect future inputs for ${row.date}: ${row.promotion ? 'promotion planned' : 'no promotion'}, ${predictions ? `${predictions[index].toFixed(1)} mugs predicted` : 'no prediction'}, actual demand unknown`}>
      <span className="week-day">{dayLabel(row.date).slice(0, 3)}</span><span className="week-date">{dayLabel(row.date).slice(4)}</span>
      <span className="day-bar" aria-hidden="true">{predictions ? <i style={{ height: `${predictions[index] / maximum * 100}%` }} /> : <span>?</span>}</span>
      <strong>{predictions ? predictions[index].toFixed(1) : '—'}</strong><span className="day-kind">{predictions ? 'predicted' : 'not run'}</span>
      <span className="promotion-tag">{row.promotion ? 'Sale planned' : 'Regular day'}</span>
    </button>)}</div>
    <p className="week-note">Actual demand: unknown on all seven days. Sale badges show planned inputs, not which features your Python used.</p>
    <p className="week-message">{message}</p>
  </section>;
}
