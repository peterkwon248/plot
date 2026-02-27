"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useItemStore } from "@/stores/itemStore";
import type { Item, CreateItemInput } from "@/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/**
 * Supabase ↔ Zustand 양방향 동기화 훅
 *
 * - Supabase 미설정 시: 아무것도 안 함 (localStorage 모드)
 * - Supabase 설정 시:
 *   1. 초기 로드: Supabase → Zustand
 *   2. 실시간 구독: Supabase 변경 → Zustand 업데이트
 *   3. 로컬 변경: Zustand → Supabase 업로드
 */
export function useSupabaseSync() {
  const isConfigured = isSupabaseConfigured();
  const syncingRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  const { setItems, items } = useItemStore();

  // 초기 데이터 로드
  const loadItems = useCallback(async () => {
    if (!isConfigured) return;
    const supabase = createClient();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    userIdRef.current = user.id;

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[Plot] Supabase load error:", error);
      return;
    }

    if (data) {
      syncingRef.current = true;
      setItems(data as Item[]);
      syncingRef.current = false;
    }
  }, [isConfigured, setItems]);

  // 실시간 구독 설정
  useEffect(() => {
    if (!isConfigured) return;
    const supabase = createClient();
    if (!supabase) return;

    // 초기 로드
    loadItems();

    // 실시간 변경 구독
    const channel = supabase
      .channel("items-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          syncingRef.current = true;

          const store = useItemStore.getState();

          switch (payload.eventType) {
            case "INSERT": {
              const newItem = payload.new as unknown as Item;
              // 이미 존재하면 무시 (로컬에서 추가한 것)
              if (!store.items.find((i) => i.id === newItem.id)) {
                store.setItems([newItem, ...store.items]);
              }
              break;
            }
            case "UPDATE": {
              const updated = payload.new as unknown as Item;
              store.setItems(
                store.items.map((i) => (i.id === updated.id ? updated : i))
              );
              break;
            }
            case "DELETE": {
              const deletedId = (payload.old as unknown as { id: string }).id;
              store.setItems(store.items.filter((i) => i.id !== deletedId));
              break;
            }
          }

          syncingRef.current = false;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isConfigured, loadItems]);

  return {
    isConfigured,
    userId: userIdRef.current,

    // Supabase에 아이템 생성
    createItem: async (input: CreateItemInput) => {
      if (!isConfigured) return null;
      const supabase = createClient();
      if (!supabase || !userIdRef.current) return null;

      const { data, error } = await supabase
        .from("items")
        .insert({
          ...input,
          user_id: userIdRef.current,
          body: input.body || {},
          status: input.status || "inbox",
          priority: input.priority || "none",
          item_type: input.item_type || "auto",
          tags: input.tags || [],
        })
        .select()
        .single();

      if (error) {
        console.error("[Plot] Create error:", error);
        return null;
      }
      return data as Item;
    },

    // Supabase에 아이템 업데이트
    updateItem: async (id: string, updates: Partial<Item>) => {
      if (!isConfigured) return;
      const supabase = createClient();
      if (!supabase) return;

      const { error } = await supabase
        .from("items")
        .update(updates)
        .eq("id", id);

      if (error) {
        console.error("[Plot] Update error:", error);
      }
    },

    // Supabase에서 아이템 삭제 (soft delete)
    softDeleteItem: async (id: string) => {
      if (!isConfigured) return;
      const supabase = createClient();
      if (!supabase) return;

      const { error } = await supabase
        .from("items")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("[Plot] Delete error:", error);
      }
    },
  };
}
