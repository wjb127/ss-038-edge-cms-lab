"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, ImagePlus, Italic, LinkIcon, List, ListOrdered } from "lucide-react";
import { useEffect, useState } from "react";
import type { MediaItem } from "@/lib/types";

export function Editor({ initialHtml, initialJson, media }: { initialHtml: string; initialJson: string; media: MediaItem[] }) {
  const [html, setHtml] = useState(initialHtml);
  const [json, setJson] = useState(initialJson || "{}");
  const editor = useEditor({
    extensions: [StarterKit, Image, Link.configure({ openOnClick: false })],
    content: initialHtml || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor: activeEditor }) => {
      setHtml(activeEditor.getHTML());
      setJson(JSON.stringify(activeEditor.getJSON()));
    }
  });

  useEffect(() => {
    if (!editor) return;
    setHtml(editor.getHTML());
    setJson(JSON.stringify(editor.getJSON()));
  }, [editor]);

  const addLink = () => {
    const href = window.prompt("URL");
    if (href) editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  return (
    <div className="grid gap-3">
      <input type="hidden" name="content_html" value={html} />
      <input type="hidden" name="content_json" value={json} />
      <div className="flex flex-wrap gap-2">
        <button className="btn" type="button" aria-label="Bold" onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </button>
        <button className="btn" type="button" aria-label="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </button>
        <button className="btn" type="button" aria-label="Heading" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={16} />
        </button>
        <button className="btn" type="button" aria-label="Bullet list" onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </button>
        <button className="btn" type="button" aria-label="Ordered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </button>
        <button className="btn" type="button" aria-label="Link" onClick={addLink}>
          <LinkIcon size={16} />
        </button>
        <select
          className="input"
          style={{ maxWidth: 260 }}
          aria-label="Insert image"
          onChange={(event) => {
            const value = event.target.value;
            if (value) {
              const image = JSON.parse(value) as { src: string; alt: string };
              editor?.chain().focus().setImage({ src: image.src, alt: image.alt }).run();
            }
            event.target.value = "";
          }}
        >
          <option value="">Insert image</option>
          {media.map((item) => (
            <option key={item.id} value={JSON.stringify({ src: item.url_path, alt: item.alt_text })}>
              {item.filename}
            </option>
          ))}
        </select>
        <ImagePlus size={18} aria-hidden="true" />
      </div>
      <div className="panel min-h-[280px] p-4">
        <EditorContent editor={editor} className="prose min-h-[240px]" />
      </div>
    </div>
  );
}
