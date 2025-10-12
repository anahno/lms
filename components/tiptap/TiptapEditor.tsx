// فایل: components/tiptap/TiptapEditor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TiptapToolbar } from "./TiptapToolbar";

// ۱. وارد کردن افزونه‌های جدید
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  characterLimit?: number;
}

export function TiptapEditor({ value, onChange, characterLimit = 5000 }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      // ۲. اضافه کردن افزونه‌ها به لیست
      StarterKit.configure({
        // StarterKit شامل Blockquote, CodeBlock, HorizontalRule, Heading, Bold, Italic, Strike, Lists است
        // می‌توانید گزینه‌های آن‌ها را اینجا سفارشی کنید
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-slate-800 text-white p-4 rounded-md my-4',
          },
        },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: 'اینجا بنویسید...' }),
      CharacterCount.configure({ limit: characterLimit }),
      Highlight,
      Subscript,
      Superscript,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rounded-md border min-h-[250px] border-input bg-background p-3 prose dark:prose-invert",
      },
    },
    onUpdate({ editor }) {
      if (editor.getHTML() === value) return;
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="flex flex-col justify-stretch gap-2">
      <TiptapToolbar editor={editor} />
      <EditorContent editor={editor} />
      {/* نمایش تعداد کاراکترها */}
      <div className="text-xs text-muted-foreground text-right">
        {editor?.storage.characterCount.characters()}/{characterLimit} کاراکتر
      </div>
    </div>
  );
}