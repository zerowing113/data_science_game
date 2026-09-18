export type DemandDay = { day: number; date: string; promotion: number; demand: number };

export function simulatedDemand(day: number, promotion: number) {
  return 20 + 2 * day + 12 * promotion;
}

// Deliberately simple, noise-free teaching fixture: the learner can see what a
// fitted feature does before later missions introduce messy observations.
const observations: DemandDay[] = Array.from({ length: 28 }, (_, day) => {
  const promotion = Number(day % 7 === 4 || day % 7 === 5);
  return {
    day,
    date: new Date(Date.UTC(2026, 7, 31 + day)).toISOString().slice(0, 10),
    promotion,
    demand: simulatedDemand(day, promotion),
  };
});

export const scenario = {
  history: observations,
  future: Array.from({ length: 7 }, (_, index) => {
    const day = 28 + index;
    return {
      day,
      date: new Date(Date.UTC(2026, 7, 31 + day)).toISOString().slice(0, 10),
      promotion: Number(day % 7 === 4 || day % 7 === 5),
    };
  }),
};

export function dayLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: '2-digit', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`)).replaceAll(',', '');
}

export type FeatureChoice = 'trend' | 'promotions';
// Only rewrite the exact supported starter assignment. Custom Python may span
// lines or use expressions; never treat its first line as a whole statement.
export const starterFeaturesAssignment = /^features = \["day"(?:, "promotion")?\]$/m;
export const featureLine = (choice: FeatureChoice) =>
  choice === 'trend' ? 'features = ["day"]' : 'features = ["day", "promotion"]';

export function starterCode(choice: FeatureChoice) {
  return `from sklearn.linear_model import LinearRegression

# history and future are ready-to-use pandas tables.
# day: days since opening; promotion: 1 on a planned sale day.
${featureLine(choice)}

# Learn the relationship from 28 days of observed demand.
model = LinearRegression()
model.fit(history[features], history["demand"])

# Forecast daily demand for the coming week.
predictions = model.predict(future[features])
print("Forecast complete —", len(predictions), "days")`;
}
