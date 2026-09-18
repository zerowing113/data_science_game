import { dayLabel, scenario } from './scenario';

export function ForecastChart({ predictions, selectedDay, onSelectDay }: { predictions?: number[]; selectedDay?: number; onSelectDay?: (day: number) => void }) {
  const width = 720;
  const height = 210;
  const padding = { left: 42, right: 20, top: 20, bottom: 36 };
  const maximum = Math.max(100, ...scenario.history.map((row) => row.demand), ...(predictions ?? []));
  const x = (day: number) => padding.left + day / 34 * (width - padding.left - padding.right);
  const y = (value: number) => height - padding.bottom - (value / maximum) * (height - padding.top - padding.bottom);
  const points = scenario.history.map((row) => `${x(row.day)},${y(row.demand)}`).join(' ');
  const forecast = predictions?.map((value, index) => `${x(index + 28)},${y(value)}`).join(' ');
  const point = (day: number, date: string, value: number, predicted: boolean) => <circle key={day} cx={x(day)} cy={y(value)} r={selectedDay === day ? 7 : 5} fill={selectedDay === day ? '#ad7217' : predicted ? '#1b654c' : '#718d84'} stroke="#fff" strokeWidth="1.5"
    role="button" tabIndex={0} aria-label={`Select ${predicted ? 'predicted' : 'observed'} demand on ${date}: ${predicted ? value.toFixed(1) : value} mugs`} aria-pressed={selectedDay === day}
    onClick={() => onSelectDay?.(day)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectDay?.(day); } }}><title>{dayLabel(date)}: {value.toFixed(1)} mugs</title></circle>;
  return <>
    <svg className="forecast-chart" viewBox={`0 0 ${width} ${height}`} role="group" aria-label={predictions ? 'Demand forecast chart: observed demand and seven predicted days' : 'Observed demand chart: 28 days of store history'}>
      <title>{predictions ? 'Your seven-day demand forecast' : 'Observed daily mug demand'}</title>
      <rect x={x(27.5)} y="12" width={width - x(27.5) - 8} height={height - 42} rx="8" fill="#f0f5d3" />
      {[0, 0.5, 1].map((fraction) => <g key={fraction}>
        <line x1={padding.left} x2={width - padding.right} y1={y(maximum * fraction)} y2={y(maximum * fraction)} stroke="#e3e8e2" />
        <text x="32" y={y(maximum * fraction) + 4} textAnchor="end">{Math.round(maximum * fraction)}</text>
      </g>)}
      <polyline points={points} stroke="#718d84" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      {scenario.history.map((row) => point(row.day, row.date, row.demand, false))}
      {forecast && <>
        <polyline points={forecast} stroke="#1b654c" strokeWidth="3.5" fill="none" strokeLinejoin="round" />
        {predictions?.map((value, index) => point(index + 28, scenario.future[index].date, value, true))}
      </>}
      {[0, 7, 14, 21, 28].map((day) => <text key={day} x={x(day)} y={height - 10} textAnchor="middle">{['Aug 31', 'Sep 07', 'Sep 14', 'Sep 21', 'Sep 28'][day / 7]}</text>)}
    </svg>
    <div className="chart-legend"><span><i className="history-key" />Observed demand</span><span><i className="forecast-key" />{predictions ? 'Your forecast' : 'Next 7 days · awaiting your model'}</span></div>
  </>;
}
