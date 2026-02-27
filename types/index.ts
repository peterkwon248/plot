// ─── Status ───
export type ItemStatus = "inbox" | "todo" | "in_progress" | "done";

// ─── Priority ───
export type ItemPriority = "none" | "low" | "medium" | "high" | "urgent";

// ─── Item Type ───
export type ItemType = "auto" | "note" | "task";

// ─── View ───
export type ViewType = "inbox" | "active" | "all" | "done";

// ─── Core Item ───
export interface Item {
  id: string;
  user_id: string;
  title: string;
  body: Record<string, unknown>;
  body_plain: string;
  status: ItemStatus;
  priority: ItemPriority;
  item_type: ItemType;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  deleted_at: string | null;
}

// ─── Create ───
export interface CreateItemInput {
  title: string;
  body?: Record<string, unknown>;
  status?: ItemStatus;
  priority?: ItemPriority;
  item_type?: ItemType;
  tags?: string[];
}

// ─── Update ───
export type UpdateItemInput = Partial<
  Omit<Item, "id" | "user_id" | "created_at">
>;

// ─── Inferred display type ───
export function inferDisplayType(item: Item): "note" | "task" {
  if (item.item_type !== "auto") return item.item_type as "note" | "task";
  if (!item.body_plain || item.body_plain.trim().length < 50) return "task";
  return "note";
}
