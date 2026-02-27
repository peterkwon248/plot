"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

interface Props {
  content: Record<string, unknown>;
  onChange?: (json: Record<string, unknown>) => void;
  editable?: boolean;
}

export function TipTapEditor({ content, onChange, editable = true }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "내용을 입력하세요...",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: content && Object.keys(content).length > 0 ? content : undefined,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[120px] text-[15px] leading-[24px] tracking-[-0.008em] text-text-primary",
      },
    },
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  return (
    <div className="tiptap-editor">
      <EditorContent editor={editor} />
      <style jsx global>{`
        .tiptap-editor .tiptap {
          outline: none;
        }
        .tiptap-editor .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #555555;
          pointer-events: none;
          height: 0;
        }
        .tiptap-editor .tiptap h1 {
          font-size: 20px;
          font-weight: 600;
          line-height: 28px;
          margin-bottom: 8px;
        }
        .tiptap-editor .tiptap h2 {
          font-size: 17px;
          font-weight: 600;
          line-height: 24px;
          margin-bottom: 6px;
        }
        .tiptap-editor .tiptap h3 {
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          margin-bottom: 4px;
        }
        .tiptap-editor .tiptap p {
          margin-bottom: 4px;
        }
        .tiptap-editor .tiptap ul,
        .tiptap-editor .tiptap ol {
          padding-left: 20px;
          margin-bottom: 4px;
        }
        .tiptap-editor .tiptap ul[data-type="taskList"] {
          padding-left: 0;
          list-style: none;
        }
        .tiptap-editor .tiptap ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .tiptap-editor .tiptap ul[data-type="taskList"] li input[type="checkbox"] {
          margin-top: 4px;
          accent-color: #22D3EE;
        }
        .tiptap-editor .tiptap code {
          background: #1C2428;
          border-radius: 4px;
          padding: 2px 4px;
          font-family: "JetBrains Mono", "Fira Code", monospace;
          font-size: 12px;
        }
        .tiptap-editor .tiptap pre {
          background: #0E1215;
          border: 1px solid #1E2A30;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
        }
        .tiptap-editor .tiptap pre code {
          background: none;
          padding: 0;
        }
        .tiptap-editor .tiptap mark {
          background: rgba(34, 211, 238, 0.2);
          border-radius: 2px;
        }
        .tiptap-editor .tiptap a {
          color: #22D3EE;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .tiptap-editor .tiptap blockquote {
          border-left: 3px solid #1E2A30;
          padding-left: 12px;
          color: #8A8A8A;
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}
