"use client";

import { useEffect, useCallback } from "react";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import type { ItemStatus } from "@/types";

/**
 * Linear 스타일 키보드 네비게이션
 *
 * j / ↓  — 아래로 이동
 * k / ↑  — 위로 이동
 * Enter  — 포커스된 아이템 열기 (디테일 패널)
 * Esc    — 디테일 패널 닫기 / 커맨드 바 닫기
 * c      — 새 아이템 생성 (커맨드 바)
 * ⌘K     — 커맨드 바 토글
 * 1-4    — 선택된 아이템 상태 변경
 * x      — 선택된 아이템 삭제
 */
export function useKeyboardNavigation() {
  const {
    focusedIndex,
    setFocusedIndex,
    selectItem,
    selectedItemId,
    isDetailOpen,
    isCommandBarOpen,
    toggleDetail,
    toggleCommandBar,
    currentView,
  } = useViewStore();

  const { getByStatus, updateItem, softDeleteItem, addItem } = useItemStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 입력 중이면 무시 (input, textarea, contenteditable)
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // 커맨드 바가 열려 있으면 ⌘K와 Esc만 처리
      if (isCommandBarOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          toggleCommandBar(false);
        }
        if (e.key === "Escape") {
          e.preventDefault();
          toggleCommandBar(false);
        }
        return;
      }

      // ⌘K — 커맨드 바 토글
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandBar(true);
        return;
      }

      // 편집 중이면 나머지 단축키 무시
      if (isEditing) return;

      const items = getByStatus(currentView);
      const maxIndex = items.length - 1;

      switch (e.key) {
        // ─── Navigation ───
        case "j":
        case "ArrowDown": {
          e.preventDefault();
          const next = Math.min(focusedIndex + 1, maxIndex);
          setFocusedIndex(next);
          break;
        }

        case "k":
        case "ArrowUp": {
          e.preventDefault();
          const prev = Math.max(focusedIndex - 1, 0);
          setFocusedIndex(prev);
          break;
        }

        // ─── Open / Close ───
        case "Enter": {
          e.preventDefault();
          if (items[focusedIndex]) {
            selectItem(items[focusedIndex].id);
          }
          break;
        }

        case "Escape": {
          if (isDetailOpen) {
            e.preventDefault();
            toggleDetail(false);
          }
          break;
        }

        // ─── Create ───
        case "c": {
          e.preventDefault();
          toggleCommandBar(true);
          break;
        }

        // ─── Status Change (선택된 아이템) ───
        case "1": {
          e.preventDefault();
          changeStatus("inbox", items);
          break;
        }
        case "2": {
          e.preventDefault();
          changeStatus("todo", items);
          break;
        }
        case "3": {
          e.preventDefault();
          changeStatus("in_progress", items);
          break;
        }
        case "4": {
          e.preventDefault();
          changeStatus("done", items);
          break;
        }

        // ─── Delete (x만 사용, Backspace/Delete는 일반 타이핑에서 오동작 방지) ───
        case "x": {
          e.preventDefault();
          const itemToDelete = selectedItemId
            ? items.find((i) => i.id === selectedItemId)
            : items[focusedIndex];
          if (itemToDelete) {
            softDeleteItem(itemToDelete.id);
            toggleDetail(false);
            // 삭제 후 focusedIndex 클램핑
            const newMax = items.length - 2; // 삭제 후 목록 길이 -1
            if (focusedIndex > newMax && newMax >= 0) {
              setFocusedIndex(newMax);
            }
          }
          break;
        }
      }
    },
    [
      focusedIndex,
      setFocusedIndex,
      selectItem,
      selectedItemId,
      isDetailOpen,
      isCommandBarOpen,
      toggleDetail,
      toggleCommandBar,
      currentView,
      getByStatus,
      updateItem,
      softDeleteItem,
      addItem,
    ]
  );

  // 상태 변경 헬퍼
  const changeStatus = useCallback(
    (status: ItemStatus, items: { id: string }[]) => {
      const target = selectedItemId
        ? items.find((i) => i.id === selectedItemId)
        : items[focusedIndex];
      if (target) {
        updateItem(target.id, { status });
      }
    },
    [selectedItemId, focusedIndex, updateItem]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
