import { useSavedState } from './journey';
import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import type { EvaluationRecord } from './EvaluationLab';
import type { MissingDataAttempt } from './missing-data';
import type { LeakageExperiment } from './leakage';
import type { ForecastExperiment, StockingDecision } from './shop';

export const practiceSteps = ['explore', 'forecast', 'evaluate', 'repair', 'timing', 'stock'] as const;
export type PracticeStep = typeof practiceSteps[number];
export type PracticeEvidence =
  | { step: 'explore'; day: number; column: string }
  | { step: 'forecast'; record: ForecastExperiment }
  | { step: 'evaluate'; record: EvaluationRecord }
  | { step: 'repair'; record: MissingDataAttempt }
  | { step: 'timing'; record: LeakageExperiment }
  | { step: 'stock'; record: StockingDecision };

type PracticeState = {
  active: boolean;
  current: number;
  evidence: Partial<Record<PracticeStep, PracticeEvidence>>;
  observed: Partial<Record<PracticeStep, boolean>>;
  hints: Partial<Record<PracticeStep, number>>;
};
type Action = { type: 'start' | 'pause' | 'next' | 'hint' }
  | { type: 'visit'; index: number }
  | { type: 'observe'; step: PracticeStep }
  | { type: 'inspect'; evidence: PracticeEvidence };

function progress(state: PracticeState, action: Action): PracticeState {
  if (action.type === 'start') return { ...state, active: true };
  if (action.type === 'pause') return { ...state, active: false };
  if (action.type === 'observe') return state.observed[action.step] ? state : { ...state, observed: { ...state.observed, [action.step]: true } };
  if (!state.active) return state;
  const step = practiceSteps[state.current];
  if (action.type === 'hint') return state.observed[step] ? { ...state, hints: { ...state.hints, [step]: Math.min(3, (state.hints[step] ?? 0) + 1) } } : state;
  if (action.type === 'next') return state.evidence[step] && state.current < practiceSteps.length - 1 ? { ...state, current: state.current + 1 } : state;
  if (action.type === 'visit') {
    const firstPending = practiceSteps.findIndex((item) => !state.evidence[item]);
    return action.index >= 0 && action.index < practiceSteps.length && (firstPending < 0 || action.index <= firstPending) ? { ...state, current: action.index } : state;
  }
  if (action.type !== 'inspect') return state;
  const evidence = action.evidence;
  if (evidence.step !== step || state.evidence[step]) return state;
  if (evidence.step === 'repair' && (evidence.record.status !== 'completed' || !evidence.record.practiceRepair)) return state;
  if (evidence.step === 'timing' && (evidence.record.leakageCheck.validity !== 'valid' || !evidence.record.practiceRepair)) return state;
  return { ...state, evidence: { ...state.evidence, [step]: evidence } };
}

const MissionContext = createContext<{
  state: PracticeState;
  dispatch: React.Dispatch<Action>;
  observe: (step: PracticeStep) => void;
} | null>(null);

export function MissionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useSavedState<PracticeState>('mission', { active: false, current: 0, evidence: {}, observed: {}, hints: {} });
  const dispatch = useCallback((action: Action) => setState((previous) => progress(previous, action)), [setState]);
  const observe = useCallback((step: PracticeStep) => dispatch({ type: 'observe', step }), [dispatch]);
  return <MissionContext.Provider value={{ state, dispatch, observe }}>{children}</MissionContext.Provider>;
}

export function useMission() {
  const mission = useContext(MissionContext);
  if (!mission) throw new Error('Practice workspaces need the mission provider.');
  const step = practiceSteps[mission.state.current];
  return { ...mission, step };
}

export function usePracticeAttempt(step: PracticeStep, phase: string, submitted: boolean) {
  const { observe } = useMission();
  useEffect(() => {
    if (submitted && ['complete', 'error', 'unavailable'].includes(phase)) observe(step);
  }, [observe, step, phase, submitted]);
}
