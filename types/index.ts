// ─── Status ───
export type ItemStatus = "inbox" | "todo" | "in_progress" | "done";

// ─── Priority ───
export type ItemPriority = "none" | "low" | "medium" | "high" | "urgent";

// ─── Item Type ───
export type ItemType = "auto" | "note" | "task";

// ─── View ───
export type ViewType = "inbox" | "active" | "all" | "done" | "hub";

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
  hub_id: string | null;
}

// ─── Create ───
export interface CreateItemInput {
  title: string;
  body?: Record<string, unknown>;
  status?: ItemStatus;
  priority?: ItemPriority;
  item_type?: ItemType;
  tags?: string[];
  hub_id?: string | null;
}

// ─── Update ───
export type UpdateItemInput = Partial<
  Omit<Item, "id" | "user_id" | "created_at">
>;

// ─── Hub Color ───
export type HubColor = "purple" | "blue" | "green" | "yellow" | "orange" | "red" | "pink" | "gray";

// ─── Hub ───
export interface Hub {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: HubColor;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

// ─── Hub Create ───
export interface CreateHubInput {
  name: string;
  color?: HubColor;
  description?: string;
}

// ─── Inferred display type ───
export function inferDisplayType(item: Item): "note" | "task" {
  if (item.item_type !== "auto") return item.item_type as "note" | "task";
  if (!item.body_plain || item.body_plain.trim().length < 50) return "task";
  return "note";
}
