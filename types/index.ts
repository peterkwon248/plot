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
  due_date: string | null;  // ISO date string (date only, e.g., "2024-03-15")
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
  due_date?: string | null;
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

// ─── Chain (Node Link) ───
export type ChainRelation = "related" | "parent" | "child" | "blocks" | "blocked_by";

export interface Chain {
  id: string;
  source_id: string;   // 링크를 생성한 쪽
  target_id: string;   // 연결된 대상
  relation: ChainRelation;
  created_at: string;
}

// ─── Activity Log ───
export type ActivityAction =
  | "created"
  | "status_changed"
  | "priority_changed"
  | "hub_assigned"
  | "hub_removed"
  | "title_changed"
  | "chain_added"
  | "chain_removed"
  | "due_date_set"
  | "due_date_removed";

export interface ActivityEntry {
  id: string;
  item_id: string;
  action: ActivityAction;
  from_value?: string;
  to_value?: string;
  created_at: string;
}

// ─── List Filter (Active filter state) ───
export interface ListFilter {
  status?: ItemStatus[];
  priority?: ItemPriority[];
  hub_ids?: string[];
  tags?: string[];
}

// ─── Display Settings ───
export type GroupByOption = "none" | "status" | "priority" | "hub";
export type SortByOption = "manual" | "created" | "updated" | "priority" | "title";
export type SortDirection = "asc" | "desc";
export type LayoutMode = "list" | "board";

export interface DisplaySettings {
  groupBy: GroupByOption;
  sortBy: SortByOption;
  sortDir: SortDirection;
  showProperties: {
    priority: boolean;
    hub: boolean;
    date: boolean;
    id: boolean;
    preview: boolean;
  };
  layout: LayoutMode;
}

// ─── Custom View (Saved Filter) ───
export interface CustomViewFilter {
  status?: ItemStatus[];
  priority?: ItemPriority[];
  hub_ids?: string[];
  tags?: string[];
}

export interface CustomView {
  id: string;
  name: string;
  icon: string;     // emoji or symbol
  filter: CustomViewFilter;
  sort_by: "manual" | "created" | "updated" | "priority" | "title";
  sort_dir: "asc" | "desc";
  created_at: string;
}
