"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useItemStore } from "@/stores/itemStore";

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagEditor({ tags, onChange }: TagEditorProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const items = useItemStore((s) => s.items);
  const allTags = useMemo(() => Array.from(new Set(items.filter(i => !i.deleted_at).flatMap(i => i.tags))).sort(), [items]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on click outside
  useEffect(() => {
    if (!showSuggestions) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  const suggestions = allTags.filter(
    (t) => !tags.includes(t) && t.toLowerCase().includes(input.toLowerCase())
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInput("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) addTag(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Tags + Input */}
      <div className="flex flex-wrap gap-1 items-center min-h-[28px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-[12px] leading-[16px] bg-bg-elevated px-2 py-0.5 rounded-md text-text-secondary inline-flex items-center gap-1"
          >
            #{tag}
            <button
              onClick={() => removeTag(tag)}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="2.5" y1="2.5" x2="7.5" y2="7.5" />
                <line x1="7.5" y1="2.5" x2="2.5" y2="7.5" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "태그 추가..." : ""}
          className="flex-1 min-w-[60px] bg-transparent text-[12px] leading-[20px] text-text-primary placeholder:text-text-tertiary outline-none"
        />
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && input && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-full bg-bg-surface border border-border-default rounded-lg shadow-xl z-50 py-1 max-h-[120px] overflow-y-auto">
          {suggestions.slice(0, 5).map((tag) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="w-full text-left px-3 py-1.5 text-[12px] leading-[16px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Create new tag option */}
      {showSuggestions && input.trim() && !allTags.includes(input.trim().toLowerCase()) && (
        <div className="absolute top-full left-0 mt-1 w-full bg-bg-surface border border-border-default rounded-lg shadow-xl z-50 py-1">
          <button
            onClick={() => addTag(input)}
            className="w-full text-left px-3 py-1.5 text-[12px] leading-[16px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
          >
            &ldquo;{input.trim()}&rdquo; 태그 만들기
          </button>
        </div>
      )}
    </div>
  );
}
