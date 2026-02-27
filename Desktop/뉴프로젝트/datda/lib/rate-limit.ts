// ============================================================
// datda - AI Modification Rate Limiter (localStorage-based)
// ============================================================

const STORAGE_KEY = 'datda-ai-modify-last';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function canModifyWithAi(): boolean {
  if (typeof window === 'undefined') return false;
  const last = localStorage.getItem(STORAGE_KEY);
  return last !== getTodayKey();
}

export function recordAiModification(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, getTodayKey());
}

export function getNextModifyTime(): Date | null {
  if (typeof window === 'undefined') return null;
  const last = localStorage.getItem(STORAGE_KEY);
  if (!last || last !== getTodayKey()) return null;
  // Return tomorrow midnight
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}
