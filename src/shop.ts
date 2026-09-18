import { scenario, simulatedDemand, type FeatureChoice } from './scenario';

export type ForecastExperiment = {
  number: number; code: string; expectation: string; choice: FeatureChoice;
  predictions: number[]; output: string;
};

export const shopRules = Object.freeze({ saleCents: 1200, purchaseCents: 500, salvageCents: 100, dailyCapacity: 10_000 });

export function validStock(stock: number[], expectedDays = scenario.future.length) {
  return stock.length === expectedDays && stock.every((value) => Number.isSafeInteger(value) && value >= 0 && value <= shopRules.dailyCapacity);
}

export function advanceShop(stock: number[]) {
  return simulateShop(stock, scenario.future.map((day) => ({ date: day.date, demand: simulatedDemand(day.day, day.promotion) })));
}

export function simulateShop(stock: number[], days: { date: string; demand: number }[]) {
  if (!validStock(stock, days.length)) throw new Error(`Choose a whole stock quantity from 0 to ${shopRules.dailyCapacity.toLocaleString('en-US')} for each day.`);
  const rows = days.map((day, index) => {
    const demand = day.demand;
    const fulfilled = Math.min(stock[index], demand);
    const lost = demand - fulfilled;
    const leftover = stock[index] - fulfilled;
    const revenueCents = fulfilled * shopRules.saleCents;
    const purchaseCents = stock[index] * shopRules.purchaseCents;
    const salvageCents = leftover * shopRules.salvageCents;
    return { date: day.date, stock: stock[index], demand, fulfilled, lost, leftover, revenueCents, purchaseCents, salvageCents, profitCents: revenueCents + salvageCents - purchaseCents };
  });
  const totals = rows.reduce((sum, row) => ({
    stock: sum.stock + row.stock, demand: sum.demand + row.demand,
    fulfilled: sum.fulfilled + row.fulfilled, lost: sum.lost + row.lost, leftover: sum.leftover + row.leftover,
    revenueCents: sum.revenueCents + row.revenueCents, purchaseCents: sum.purchaseCents + row.purchaseCents,
    salvageCents: sum.salvageCents + row.salvageCents, profitCents: sum.profitCents + row.profitCents,
  }), { stock: 0, demand: 0, fulfilled: 0, lost: 0, leftover: 0, revenueCents: 0, purchaseCents: 0, salvageCents: 0, profitCents: 0 });
  return { rows, totals };
}

export type StockingDecision = ReturnType<typeof advanceShop> & { number: number; experiment: ForecastExperiment; replay: boolean };
export const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
