import { clsx, type ClassValue } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// ─── className 합치기 ───
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ─── 상대 시간 (2시간 전, 3일 전) ───
export function timeAgo(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), {
    addSuffix: true,
    locale: ko,
  });
}

// ─── TipTap JSON → plain text ───
export function extractPlainText(tiptapJson: Record<string, unknown>): string {
  if (!tiptapJson || !(tiptapJson as { content?: unknown }).content) return "";

  const texts: string[] = [];

  function walk(node: Record<string, unknown>) {
    if (node.type === "text" && node.text) {
      texts.push(node.text as string);
    }
    if (Array.isArray(node.content)) {
      node.content.forEach((child) => walk(child as Record<string, unknown>));
    }
  }

  walk(tiptapJson);
  return texts.join(" ");
}

// ─── UUID 생성 ───
export function generateId(): string {
  return crypto.randomUUID();
}
