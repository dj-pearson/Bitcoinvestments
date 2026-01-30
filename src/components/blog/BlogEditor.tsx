/**
 * BlogEditor Component
 * TipTap-based WYSIWYG editor for blog posts
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect } from 'react';
import { BlogToolbar } from './BlogToolbar';

const lowlight = createLowlight(common);

interface BlogEditorProps {
  content: string;
  contentJson?: object | null;
  onChange: (content: string, json: object) => void;
  placeholder?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
}

export function BlogEditor({
  content,
  contentJson,
  onChange,
  placeholder = 'Start writing your blog post...',
  autoFocus = false,
  readOnly = false,
}: BlogEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'blog-image rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-orange-400 hover:text-orange-300 underline',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'blog-video rounded-lg overflow-hidden',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-slate-900 rounded-lg p-4 overflow-x-auto',
        },
      }),
    ],
    content: contentJson || content,
    editable: !readOnly,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      onChange(html, json);
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && contentJson) {
      const currentJson = JSON.stringify(editor.getJSON());
      const newJson = JSON.stringify(contentJson);
      if (currentJson !== newJson) {
        editor.commands.setContent(contentJson);
      }
    }
  }, [editor, contentJson]);

  const addImage = useCallback((url: string) => {
    if (editor && url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addYoutubeVideo = useCallback((url: string) => {
    if (editor && url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  const setLink = useCallback((url: string) => {
    if (editor) {
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      } else {
        editor.chain().focus().unsetLink().run();
      }
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="animate-pulse bg-slate-800 rounded-xl h-96" />
    );
  }

  const wordCount = editor.storage.characterCount.words();
  const characterCount = editor.storage.characterCount.characters();

  return (
    <div className="blog-editor">
      {!readOnly && (
        <BlogToolbar
          editor={editor}
          onAddImage={addImage}
          onAddVideo={addYoutubeVideo}
          onSetLink={setLink}
        />
      )}

      <div className={`
        bg-slate-800/50 border border-white/10 rounded-b-xl
        ${readOnly ? 'rounded-t-xl' : ''}
      `}>
        <EditorContent
          editor={editor}
          className="prose prose-invert prose-orange max-w-none p-6 min-h-[400px] focus:outline-none
            prose-headings:text-white prose-headings:font-bold
            prose-h1:text-3xl prose-h1:mb-4
            prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6
            prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
            prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-code:text-orange-300 prose-code:bg-slate-900 prose-code:px-1 prose-code:rounded
            prose-pre:bg-slate-900 prose-pre:p-4 prose-pre:rounded-lg
            prose-ul:list-disc prose-ul:pl-6 prose-ul:text-slate-300
            prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-slate-300
            prose-li:mb-1
            prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-400
            prose-img:rounded-lg prose-img:mx-auto
          "
        />

        {!readOnly && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <span>{wordCount} words</span>
              <span>{characterCount} characters</span>
              <span>~{Math.ceil(wordCount / 200)} min read</span>
            </div>
            <div className="text-xs">
              Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Ctrl+S</kbd> to save
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogEditor;
