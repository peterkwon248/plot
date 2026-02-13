// ============================================================
// datda (OMCL) - Gemini API Helper
// ============================================================

export interface StepRecommendation {
  action: string;
  minutes: number;
  resultType: string;
}

export interface DecomposeResult {
  steps: StepRecommendation[];
}

interface DecomposeRequest {
  goal: string;
  context?: string;
  previousSteps?: string[];
  round?: number;
}

const FALLBACK: DecomposeResult = {
  steps: [{
    action: '목표를 분해하는 중 오류가 발생했습니다. 직접 행동을 정해보세요.',
    minutes: 30,
    resultType: '',
  }],
};

export async function decomposeGoal(
  goal: string,
  context?: string,
  previousSteps?: string[],
  round?: number,
): Promise<DecomposeResult> {
  try {
    const body: DecomposeRequest = { goal };
    if (context) body.context = context;
    if (previousSteps) body.previousSteps = previousSteps;
    if (round) body.round = round;

    const response = await fetch('/api/decompose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) return FALLBACK;

    const data = await response.json();
    if (data.error) return FALLBACK;

    if (Array.isArray(data.steps) && data.steps.length > 0) {
      return { steps: data.steps };
    }

    return FALLBACK;
  } catch (error) {
    console.error('[datda] Failed to decompose goal:', error);
    return FALLBACK;
  }
}

export async function modifySteps(
  goalTitle: string,
  currentSteps: StepRecommendation[],
  userMessage: string,
): Promise<DecomposeResult> {
  try {
    const response = await fetch('/api/modify-steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalTitle, currentSteps, userMessage }),
    });

    if (!response.ok) return FALLBACK;

    const data = await response.json();
    if (data.error) return FALLBACK;

    if (Array.isArray(data.steps) && data.steps.length > 0) {
      return { steps: data.steps };
    }

    return FALLBACK;
  } catch (error) {
    console.error('[datda] Failed to modify steps:', error);
    return FALLBACK;
  }
}
