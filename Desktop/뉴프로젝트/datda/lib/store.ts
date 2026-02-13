import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Phase, StatusType, ResultType, CloseType } from './constants';
import { VAULT_CONFIG, TIMER_PRESETS, RESULT_TYPES, OVERLOAD_CONFIG } from './constants';

// ============================================================
// Types
// ============================================================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export interface CompletedSession {
  id: string;
  taskTitle: string;
  resultType: ResultType | '';
  timerMinutes: number;
  closeReason: string;
  closeType: CloseType;
  lockLocation: string;
  nextAction: string;
  status: StatusType | '';
  completedAt: number;
}

export interface GoalStep {
  action: string;
  minutes: number;
  resultType: string;
  completed: boolean;
  completedAt: number | null;
  discarded: boolean;
  discardedAt: number | null;
}

export interface Goal {
  id: string;
  title: string;
  createdAt: number;
  steps: GoalStep[];
  round: number;
}

// ============================================================
// Session Slice
// ============================================================

interface SessionState {
  phase: Phase;
  taskTitle: string;
  resultType: ResultType | '';
  timerMinutes: number;
  timerStartedAt: number | null;
  closeReason: string;
  closeType: CloseType | '';
  lockLocation: string;
  nextAction: string;
  status: StatusType | '';
  completedAt: number | null;
  // AI recommendation (pre-filled from goal decomposition)
  aiRecommendation: { action: string; minutes: number; resultType: string } | null;
}

interface SessionActions {
  startOpen: (taskTitle: string) => void;
  setResultType: (type: ResultType) => void;
  startMake: (minutes: number) => void;
  goToClose: () => void;
  completeClose: (reason: string) => void;
  completeLock: (location: string) => void;
  setNextAction: (action: string) => void;
  setStatus: (status: StatusType) => void;
  setCloseType: (type: CloseType) => void;
  finalClose: () => void;
  resetSession: () => void;
  setAiRecommendation: (rec: { action: string; minutes: number; resultType: string } | null) => void;
}

// ============================================================
// Vault Slice
// ============================================================

interface VaultState {
  goals: Goal[];
  lastVaultAccess: number | null;
}

interface VaultActions {
  addGoal: (title: string) => void;
  removeGoal: (id: string) => void;
  addGoalWithSteps: (title: string, steps: { action: string; minutes: number; resultType: string }[], round?: number) => void;
  toggleStepComplete: (goalId: string, stepIndex: number) => void;
  updateGoalStep: (goalId: string, stepIndex: number, updates: Partial<Pick<GoalStep, 'action' | 'minutes' | 'resultType'>>) => void;
  replaceGoalSteps: (goalId: string, steps: { action: string; minutes: number; resultType: string }[]) => void;
  moveGoalStep: (goalId: string, fromIndex: number, toIndex: number) => void;
  reorderGoalSteps: (goalId: string, newSteps: GoalStep[]) => void;
  shuffleGoalSteps: (goalId: string) => void;
  getNextStep: (goalId: string) => GoalStep | null;
  getTodaysSuggestion: () => { goalId: string; goalTitle: string; step: GoalStep; stepIndex: number } | null;
  getAllSuggestions: () => { goalId: string; goalTitle: string; step: GoalStep; stepIndex: number }[];
  canAccessVault: () => boolean;
  recordVaultAccess: () => void;
  getNextAccessTime: () => Date | null;
  isOverloaded: () => boolean;
}

// ============================================================
// History Slice
// ============================================================

interface HistoryState {
  sessions: CompletedSession[];
}

interface HistoryActions {
  addSession: (session: CompletedSession) => void;
}

// ============================================================
// Settings Slice
// ============================================================

interface SettingsState {
  userTimerPresets: number[] | null;
  userResultTypes: string[] | null;
  hasSeenOnboarding: boolean;
  showDiscardedRecords: boolean;
}

interface SettingsActions {
  getTimerPresets: () => number[];
  getResultTypes: () => string[];
  setUserTimerPresets: (presets: number[]) => void;
  setUserResultTypes: (types: string[]) => void;
  addTimerPreset: (minutes: number) => void;
  removeTimerPreset: (minutes: number) => void;
  addResultType: (type: string) => void;
  removeResultType: (type: string) => void;
  resetSettings: () => void;
  completeOnboarding: () => void;
  toggleShowDiscardedRecords: () => void;
}

// ============================================================
// Combined Store
// ============================================================

type DatdaStore = SessionState &
  SessionActions &
  VaultState &
  VaultActions &
  HistoryState &
  HistoryActions &
  SettingsState &
  SettingsActions;

const initialSessionState: SessionState = {
  phase: 'idle',
  taskTitle: '',
  resultType: '',
  timerMinutes: 0,
  timerStartedAt: null,
  closeReason: '',
  closeType: '',
  lockLocation: '',
  nextAction: '',
  status: '',
  completedAt: null,
  aiRecommendation: null,
};

export const useDatdaStore = create<DatdaStore>()(
  persist(
    (set, get) => ({
      // --- Session State ---
      ...initialSessionState,

      // --- Session Actions ---
      startOpen: (taskTitle: string) => {
        set({ taskTitle, phase: 'open' });
        // Transition to make phase after opening
        set({ phase: 'make' });
      },

      setResultType: (type: ResultType) => {
        set({ resultType: type });
      },

      startMake: (minutes: number) => {
        set({
          timerMinutes: minutes,
          timerStartedAt: Date.now(),
          phase: 'make',
        });
      },

      goToClose: () => {
        set({ phase: 'close' });
      },

      completeClose: (reason: string) => {
        set({ closeReason: reason, phase: 'lock' });
      },

      completeLock: (location: string) => {
        set({ lockLocation: location, phase: 'end' });
      },

      setNextAction: (action: string) => {
        set({ nextAction: action });
      },

      setStatus: (status: StatusType) => {
        set({ status });
      },

      setCloseType: (type: CloseType) => {
        set({ closeType: type });
      },

      finalClose: () => {
        const state = get();
        const completedSession: CompletedSession = {
          id: generateId(),
          taskTitle: state.taskTitle,
          resultType: state.resultType,
          timerMinutes: state.timerMinutes,
          closeReason: state.closeReason,
          closeType: state.closeType as CloseType,
          lockLocation: state.lockLocation,
          nextAction: state.nextAction,
          status: state.status,
          completedAt: Date.now(),
        };

        // Auto-complete, discard, or defer matching goal step
        const updatedGoals = state.goals.map((goal) => {
          let steps = goal.steps.map((step) =>
            !step.completed && !step.discarded && step.action === state.taskTitle
              ? state.closeType === '폐기'
                ? { ...step, discarded: true, discardedAt: Date.now() }
                : state.closeType === '완료'
                ? { ...step, completed: true, completedAt: Date.now() }
                : step
              : step
          );

          // 보류: move matching step to end of active queue (before finished)
          if (state.closeType === '보류') {
            const idx = steps.findIndex(
              (s) => !s.completed && !s.discarded && s.action === state.taskTitle
            );
            if (idx !== -1) {
              const [deferred] = steps.splice(idx, 1);
              const active = steps.filter((s) => !s.completed && !s.discarded);
              const finished = steps.filter((s) => s.completed || s.discarded);
              steps = [...active, deferred, ...finished];
            }
          }

          return { ...goal, steps };
        });

        // Save to history, update goals, reset current session, set final phase
        set({
          ...initialSessionState,
          phase: 'final',
          sessions: [...state.sessions, completedSession],
          goals: updatedGoals,
        });
      },

      resetSession: () => {
        set({ ...initialSessionState });
      },

      setAiRecommendation: (rec) => {
        set({ aiRecommendation: rec });
      },

      // --- Vault State ---
      goals: [],
      lastVaultAccess: null,

      // --- Vault Actions ---
      addGoal: (title: string) => {
        const newGoal: Goal = {
          id: generateId(),
          title,
          createdAt: Date.now(),
          steps: [],
          round: 1,
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },

      removeGoal: (id: string) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      addGoalWithSteps: (title: string, steps: { action: string; minutes: number; resultType: string }[], round?: number) => {
        const newGoal: Goal = {
          id: generateId(),
          title,
          createdAt: Date.now(),
          steps: steps.map((s) => ({ ...s, completed: false, completedAt: null, discarded: false, discardedAt: null })),
          round: round ?? 1,
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },

      toggleStepComplete: (goalId: string, stepIndex: number) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  steps: g.steps.map((s, i) =>
                    i === stepIndex
                      ? { ...s, completed: !s.completed, completedAt: !s.completed ? Date.now() : null }
                      : s
                  ),
                }
              : g
          ),
        }));
      },

      updateGoalStep: (goalId: string, stepIndex: number, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  steps: g.steps.map((s, i) =>
                    i === stepIndex ? { ...s, ...updates } : s
                  ),
                }
              : g
          ),
        }));
      },

      replaceGoalSteps: (goalId: string, steps) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  steps: steps.map((s) => ({
                    ...s,
                    completed: false,
                    completedAt: null,
                    discarded: false,
                    discardedAt: null,
                  })),
                }
              : g
          ),
        }));
      },

      moveGoalStep: (goalId: string, fromIndex: number, toIndex: number) => {
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;
            const steps = [...g.steps];
            const [moved] = steps.splice(fromIndex, 1);
            steps.splice(toIndex, 0, moved);
            return { ...g, steps };
          }),
        }));
      },

      reorderGoalSteps: (goalId: string, newSteps: GoalStep[]) => {
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;
            // Keep finished steps pinned at bottom
            const active = newSteps.filter((s) => !s.completed && !s.discarded);
            const finished = newSteps.filter((s) => s.completed || s.discarded);
            return { ...g, steps: [...active, ...finished] };
          }),
        }));
      },

      shuffleGoalSteps: (goalId: string) => {
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;
            // Separate active vs finished steps
            const active = g.steps.filter((s) => !s.completed && !s.discarded);
            const finished = g.steps.filter((s) => s.completed || s.discarded);
            // Only shuffle active steps
            for (let i = active.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [active[i], active[j]] = [active[j], active[i]];
            }
            return { ...g, steps: [...active, ...finished] };
          }),
        }));
      },

      getNextStep: (goalId: string) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal) return null;
        return goal.steps.find((s) => !s.completed && !s.discarded) || null;
      },

      getTodaysSuggestion: () => {
        const { goals } = get();
        for (const goal of goals) {
          const stepIndex = goal.steps.findIndex((s) => !s.completed && !s.discarded);
          if (stepIndex !== -1) {
            return { goalId: goal.id, goalTitle: goal.title, step: goal.steps[stepIndex], stepIndex };
          }
        }
        return null;
      },

      getAllSuggestions: () => {
        const { goals } = get();
        const suggestions: { goalId: string; goalTitle: string; step: GoalStep; stepIndex: number }[] = [];
        for (const goal of goals) {
          const stepIndex = goal.steps.findIndex((s) => !s.completed && !s.discarded);
          if (stepIndex !== -1) {
            suggestions.push({ goalId: goal.id, goalTitle: goal.title, step: goal.steps[stepIndex], stepIndex });
          }
        }
        return suggestions;
      },

      canAccessVault: () => {
        const { lastVaultAccess } = get();
        if (lastVaultAccess === null) return true;
        const cooldownMs = VAULT_CONFIG.accessCooldownHours * 60 * 60 * 1000;
        return Date.now() - lastVaultAccess >= cooldownMs;
      },

      recordVaultAccess: () => {
        set({ lastVaultAccess: Date.now() });
      },

      getNextAccessTime: () => {
        const { lastVaultAccess } = get();
        if (lastVaultAccess === null) return null;
        const cooldownMs = VAULT_CONFIG.accessCooldownHours * 60 * 60 * 1000;
        return new Date(lastVaultAccess + cooldownMs);
      },

      isOverloaded: () => {
        const { goals } = get();
        const activeGoals = goals.filter((g) =>
          g.steps.some((s) => !s.completed && !s.discarded)
        );
        return activeGoals.length >= OVERLOAD_CONFIG.maxActiveGoals;
      },

      // --- History State ---
      sessions: [],

      // --- History Actions ---
      addSession: (session: CompletedSession) => {
        set((state) => ({
          sessions: [...state.sessions, session],
        }));
      },

      // --- Settings State ---
      userTimerPresets: null,
      userResultTypes: null,
      hasSeenOnboarding: false,
      showDiscardedRecords: true,

      // --- Settings Actions ---
      getTimerPresets: () => {
        const { userTimerPresets } = get();
        if (userTimerPresets && userTimerPresets.length > 0) return userTimerPresets;
        return [...TIMER_PRESETS];
      },

      getResultTypes: () => {
        const { userResultTypes } = get();
        if (userResultTypes && userResultTypes.length > 0) return userResultTypes;
        return [...RESULT_TYPES];
      },

      setUserTimerPresets: (presets: number[]) => {
        set({ userTimerPresets: presets.length > 0 ? presets : null });
      },

      setUserResultTypes: (types: string[]) => {
        set({ userResultTypes: types.length > 0 ? types : null });
      },

      addTimerPreset: (minutes: number) => {
        const current = get().getTimerPresets();
        if (current.includes(minutes) || current.length >= 8) return;
        const updated = [...current, minutes].sort((a, b) => a - b);
        set({ userTimerPresets: updated });
      },

      removeTimerPreset: (minutes: number) => {
        const current = get().getTimerPresets();
        const updated = current.filter((m) => m !== minutes);
        set({ userTimerPresets: updated.length > 0 ? updated : null });
      },

      addResultType: (type: string) => {
        const current = get().getResultTypes();
        if (current.includes(type) || current.length >= 8) return;
        set({ userResultTypes: [...current, type] });
      },

      removeResultType: (type: string) => {
        const current = get().getResultTypes();
        const updated = current.filter((t) => t !== type);
        set({ userResultTypes: updated.length > 0 ? updated : null });
      },

      resetSettings: () => {
        set({ userTimerPresets: null, userResultTypes: null });
      },

      completeOnboarding: () => {
        set({ hasSeenOnboarding: true });
      },

      toggleShowDiscardedRecords: () => {
        set((state) => ({ showDiscardedRecords: !state.showDiscardedRecords }));
      },
    }),
    {
      name: 'datda-storage',
    }
  )
);

// Hook to wait for Zustand persist hydration (safe for SSR/Next.js)
export function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // Check if already hydrated
    const unsub = useDatdaStore.persist.onFinishHydration(() => setHydrated(true));
    if (useDatdaStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
