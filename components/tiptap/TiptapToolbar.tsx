// فایل: components/tiptap/TiptapToolbar.tsx
"use client";

import { type Editor } from "@tiptap/react";
import {
  Bold,
  Strikethrough,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Underline,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Code,
  Quote,
  Highlighter,
  Pilcrow,
  Subscript,
  Superscript,
  Minus,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useCallback } from "react";

type Props = {
  editor: Editor | null;
};

export function TiptapToolbar({ editor }: Props) {
  // هوک useCallback به ابتدای کامپوننت منتقل شده تا قوانین هوک‌ها رعایت شود
  const handleLink = useCallback(() => {
    // چون ممکن است editor در لحظه اول null باشد، یک گارد امنیتی اضافه می‌کنیم
    if (!editor) {
      return;
    }

    // اگر متن فعلی یک لینک است، آن را حذف کن
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    // در غیر این صورت، برای اضافه کردن لینک جدید سوال کن
    const url = window.prompt("URL را وارد کنید:");

    // اگر کاربر انصراف داد یا URL خالی بود، کاری نکن
    if (url === null || url === "") {
      return;
    }

    // لینک را اعمال کن
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);


  // شرط return زودتر از موعد، بعد از تمام هوک‌ها قرار می‌گیرد
  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input bg-transparent rounded-md p-1 flex items-center gap-1 flex-wrap">
      {/* Undo/Redo */}
      <Toggle size="sm" onPressedChange={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" onPressedChange={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo className="h-4 w-4" />
      </Toggle>
      
      {/* Paragraph & Headings */}
      <Toggle size="sm" pressed={editor.isActive("paragraph")} onPressedChange={() => editor.chain().focus().setParagraph().run()}>
        <Pilcrow className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("heading", { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" />
      </Toggle>
      
      {/* Font Styles */}
      <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("underline")} onPressedChange={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("highlight")} onPressedChange={() => editor.chain().focus().toggleHighlight().run()}>
        <Highlighter className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("subscript")} onPressedChange={() => editor.chain().focus().toggleSubscript().run()}>
        <Subscript className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("superscript")} onPressedChange={() => editor.chain().focus().toggleSuperscript().run()}>
        <Superscript className="h-4 w-4" />
      </Toggle>
      
      {/* Link */}
      <Toggle size="sm" pressed={editor.isActive("link")} onPressedChange={handleLink}>
        <Link className="h-4 w-4" />
      </Toggle>

      {/* Block Elements */}
      <Toggle size="sm" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("codeBlock")} onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code className="h-4 w-4" />
      </Toggle>

      {/* Text Align */}
      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}>
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}>
        <AlignRight className="h-4 w-4" />
      </Toggle>
      
      {/* Lists */}
      <Toggle size="sm" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Toggle>
    </div>
  );
}