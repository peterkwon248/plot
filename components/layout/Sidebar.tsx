"use client";

import { useState, useMemo } from "react";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { useHubStore } from "@/stores/hubStore";
import { useCustomViewStore } from "@/stores/customViewStore";
import { CustomViewEditor } from "@/components/views/CustomViewEditor";
import { ItemStatusIcon } from "@/components/items/ItemStatusIcon";
import { getHubColorHex } from "@/lib/hubColors";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar-primitives";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type SidebarView = "inbox" | "active" | "all" | "done";

const NAV_VIEWS: { id: SidebarView; label: string }[] = [
  { id: "inbox", label: "\uBA54\uBAA8" },
  { id: "active", label: "\uC9C4\uD589" },
  { id: "all", label: "\uC804\uCCB4" },
  { id: "done", label: "\uC644\uB8CC" },
];

export function Sidebar() {
  const {
    currentView,
    setView,
    toggleCommandBar,
    setCustomView,
    selectItem,
    toggleSettings,
    activeCustomViewId,
    activeHubId,
    setActiveHub,
  } = useViewStore();
  const { getByStatus, items: allItems } = useItemStore();
  const hubList = useHubStore((s) => s.hubs);
  const { addHub } = useHubStore();
  const { views: customViews } = useCustomViewStore();
  const [showViewEditor, setShowViewEditor] = useState(false);

  const hubs = useMemo(
    () =>
      hubList
        .filter((h) => !h.archived_at)
        .sort((a, b) => a.sort_order - b.sort_order),
    [hubList]
  );

  const getHubItemCount = (hubId: string) =>
    allItems.filter((i) => !i.deleted_at && i.hub_id === hubId).length;

  return (
    <SidebarPrimitive collapsible="offcanvas">
      {/* ── Header ── */}
      <SidebarHeader className="h-11 flex-row items-center justify-between px-3 gap-2">
        <span className="text-[14px] leading-[20px] tracking-[-0.006em] font-semibold text-text-primary flex items-center gap-2">
          <span className="text-accent text-[18px] leading-none">{"\u2726"}</span>
          Plot
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleCommandBar(true)}
            className="flex items-center justify-center h-7 w-7 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated transition-colors"
            title="\uAC80\uC0C9 (\u2318K)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <circle cx="7" cy="7" r="4.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
          </button>
          <button
            onClick={() => toggleCommandBar(true)}
            className="flex items-center justify-center h-7 w-7 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated transition-colors"
            title="\uC0C8 \uD56D\uBAA9 (C)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* ── Main Navigation ── */}
        <SidebarGroup>
          <SidebarMenu>
            {NAV_VIEWS.map((view) => {
              const isActive =
                currentView === view.id &&
                !activeCustomViewId &&
                !activeHubId;
              const count = getByStatus(view.id).length;
              return (
                <SidebarMenuItem key={view.id}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setView(view.id)}
                    tooltip={view.label}
                    className="h-7 px-2.5 gap-2 text-[13px] hover:bg-bg-surface"
                  >
                    <ViewIcon viewType={view.id} active={isActive} />
                    <span>{view.label}</span>
                    {count > 0 && (
                      <span className="ml-auto text-[11px] tabular-nums text-text-tertiary">
                        {count}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="my-2 opacity-50" />

        {/* ── Workspace Section ── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.04em] text-text-tertiary">{"\uC6CC\uD06C\uC2A4\uD398\uC774\uC2A4"}</SidebarGroupLabel>
          <SidebarMenu>
            {/* Custom Views as flat items */}
            {customViews.map((view) => (
              <SidebarMenuItem key={view.id}>
                <SidebarMenuButton
                  isActive={activeCustomViewId === view.id}
                  onClick={() => setCustomView(view.id)}
                  className="h-7 px-2.5 gap-2 text-[13px] hover:bg-bg-surface"
                >
                  <span className="text-[15px] shrink-0">{view.icon}</span>
                  <span className="truncate">{view.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {/* More dropdown - like Linear's */}
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-7 px-2.5 gap-2 text-[13px] hover:bg-bg-surface">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="shrink-0"
                    >
                      <circle cx="4" cy="8" r="1.2" fill="currentColor" />
                      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                      <circle cx="12" cy="8" r="1.2" fill="currentColor" />
                    </svg>
                    <span>{"\uB354\uBCF4\uAE30"}</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side="bottom"
                  align="start"
                >
                  <DropdownMenuItem onClick={() => setShowViewEditor(true)}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="text-text-tertiary"
                    >
                      <line x1="7" y1="3" x2="7" y2="11" />
                      <line x1="3" y1="7" x2="11" y2="7" />
                    </svg>
                    <span>{"\uC0C8 \uBDF0 \uB9CC\uB4E4\uAE30"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toggleSettings()}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      className="text-text-tertiary"
                    >
                      <circle cx="7" cy="7" r="2.5" />
                      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.8 2.8l1.1 1.1M10.1 10.1l1.1 1.1M2.8 11.2l1.1-1.1M10.1 3.9l1.1-1.1" />
                    </svg>
                    <span>{"\uC124\uC815"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="my-2 opacity-50" />

        {/* ── Projects (Hubs) Section - Linear's "Your teams" pattern ── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.04em] text-text-tertiary">{"\uD504\uB85C\uC81D\uD2B8"}</SidebarGroupLabel>
          <SidebarGroupAction
            onClick={() => {
              const name = prompt("\uD504\uB85C\uC81D\uD2B8 \uC774\uB984:");
              if (name?.trim()) {
                addHub({ name: name.trim(), color: "purple" });
              }
            }}
            title="\uC0C8 \uD504\uB85C\uC81D\uD2B8"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <line x1="7" y1="3" x2="7" y2="11" />
              <line x1="3" y1="7" x2="11" y2="7" />
            </svg>
          </SidebarGroupAction>
          <SidebarMenu>
            {hubs.length === 0 ? (
              <SidebarMenuItem>
                <SidebarMenuButton className="h-7 px-2.5 gap-2 text-[13px] text-text-disabled hover:bg-bg-surface" disabled>
                  <span>
                    {"\uD504\uB85C\uC81D\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4"}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              hubs.map((hub, index) => {
                const hubActive =
                  currentView === "hub" && activeHubId === hub.id;
                const itemCount = getHubItemCount(hub.id);
                const hubItems = allItems
                  .filter((i) => !i.deleted_at && i.hub_id === hub.id)
                  .slice(0, 5);

                return (
                  <Collapsible
                    key={hub.id}
                    asChild
                    defaultOpen={index === 0}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={hub.name}
                          isActive={hubActive}
                          className="h-7 px-2.5 gap-2 text-[13px] hover:bg-bg-surface"
                        >
                          <div
                            className="inline-flex size-5 items-center justify-center rounded shrink-0 text-[10px] font-bold"
                            style={{
                              backgroundColor: `${getHubColorHex(hub.color)}25`,
                              color: getHubColorHex(hub.color),
                            }}
                          >
                            {hub.name.charAt(0)}
                          </div>
                          <span className="truncate">{hub.name}</span>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            className="ml-auto shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                          >
                            <path d="M4.5 2.5L7.5 6L4.5 9.5" />
                          </svg>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction showOnHover>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                            >
                              <circle
                                cx="3.5"
                                cy="7"
                                r="1"
                                fill="currentColor"
                              />
                              <circle
                                cx="7"
                                cy="7"
                                r="1"
                                fill="currentColor"
                              />
                              <circle
                                cx="10.5"
                                cy="7"
                                r="1"
                                fill="currentColor"
                              />
                            </svg>
                            <span className="sr-only">
                              {"\uB354\uBCF4\uAE30"}
                            </span>
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-48 rounded-lg"
                          side="right"
                          align="start"
                        >
                          <DropdownMenuItem
                            onClick={() => setActiveHub(hub.id)}
                          >
                            <span>
                              {"\uD504\uB85C\uC81D\uD2B8 \uBCF4\uAE30"}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <span>
                              {"\uD504\uB85C\uC81D\uD2B8 \uC124\uC815"}
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              isActive={hubActive}
                              onClick={() => setActiveHub(hub.id)}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                className="shrink-0"
                              >
                                <rect
                                  x="2"
                                  y="3"
                                  width="10"
                                  height="1.5"
                                  rx="0.5"
                                />
                                <rect
                                  x="2"
                                  y="6.25"
                                  width="10"
                                  height="1.5"
                                  rx="0.5"
                                />
                                <rect
                                  x="2"
                                  y="9.5"
                                  width="10"
                                  height="1.5"
                                  rx="0.5"
                                />
                              </svg>
                              <span>{"\uC804\uCCB4 \uD56D\uBAA9"}</span>
                              {itemCount > 0 && (
                                <span className="ml-auto text-[11px] tabular-nums text-text-tertiary">
                                  {itemCount}
                                </span>
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          {hubItems.map((item) => (
                            <SidebarMenuSubItem key={item.id}>
                              <SidebarMenuSubButton
                                onClick={() => selectItem(item.id)}
                              >
                                <ItemStatusIcon
                                  status={item.status}
                                  size={12}
                                />
                                <span className="truncate text-[12px]">
                                  {item.title}
                                </span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="border-t border-border-subtle p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => toggleSettings()}
              tooltip={"\uC124\uC815"}
              className="h-7 px-2.5 gap-2 text-[13px] hover:bg-bg-surface"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <circle cx="8" cy="8" r="3" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
              </svg>
              <span>{"\uC124\uC815"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* View Editor Modal */}
      {showViewEditor && (
        <CustomViewEditor onClose={() => setShowViewEditor(false)} />
      )}
    </SidebarPrimitive>
  );
}

function ViewIcon({
  viewType,
  active,
}: {
  viewType: SidebarView;
  active: boolean;
}) {
  const color = active ? "var(--color-accent)" : undefined;

  switch (viewType) {
    case "inbox":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0"
             fill="none" stroke={color || "var(--color-text-secondary)"} strokeWidth="1.5"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 8.5h3.5L7 10.5h2l1.5-2H14" />
          <path d="M3 4.5l-1 4v4.5a1 1 0 001 1h10a1 1 0 001-1V8.5l-1-4H3z" />
        </svg>
      );
    case "active":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0"
             fill="none" stroke={color || "var(--color-status-in-progress)"} strokeWidth="1.5">
          <circle cx="8" cy="8" r="5.5" strokeDasharray="17.3 17.3" strokeDashoffset="-4.3" />
          <circle cx="8" cy="8" r="2" fill={color || "var(--color-status-in-progress)"} stroke="none" />
        </svg>
      );
    case "all":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0"
             fill="none" stroke={color || "var(--color-text-secondary)"} strokeWidth="1.5"
             strokeLinecap="round">
          <line x1="3" y1="4" x2="13" y2="4" />
          <line x1="8" y1="8" x2="13" y2="8" />
          <line x1="3" y1="12" x2="10" y2="12" />
        </svg>
      );
    case "done":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <circle cx="8" cy="8" r="6" fill="none"
                  stroke={color || "var(--color-status-done)"} strokeWidth="1.5" />
          <path d="M5.5 8L7.2 9.7L10.5 6.3" fill="none"
                stroke={color || "var(--color-status-done)"} strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
