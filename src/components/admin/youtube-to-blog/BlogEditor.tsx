import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import type { BlogPost } from '../../../lib/youtube-to-blog/schemas';
import { MetadataPanel } from './MetadataPanel';
import { DoctorProfilePanel } from './DoctorProfilePanel';
import { ImageGallery } from './ImageGallery';
import { ApprovalButtons } from './ApprovalButtons';

interface BlogEditorProps {
  postId: string;
}

export default function BlogEditor({ postId }: BlogEditorProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activePanel, setActivePanel] = useState<'editor' | 'metadata' | 'doctor' | 'images'>('editor');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Youtube.configure({ width: 640, height: 360 }),
      Placeholder.configure({ placeholder: 'Start writing your blog post...' }),
      CharacterCount,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] p-6',
      },
    },
  });

  // Fetch post data
  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/blog/posts/${postId}`);
        if (!res.ok) throw new Error('Failed to fetch post');
        const data = await res.json();
        setPost(data.post);
        if (editor && data.post?.content) {
          editor.commands.setContent(data.post.content);
        }
      } catch (err) {
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [postId, editor]);

  // Save post
  const handleSave = useCallback(async () => {
    if (!editor || !post) return;
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const content = editor.getHTML();
      const res = await fetch(`/api/blog/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Save failed');
      }

      const data = await res.json();
      setPost(data.post);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [editor, post, postId]);

  // Keyboard shortcut: Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading post...</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-medium">Post not found</p>
          <a href="/admin/youtube-to-blog" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const wordCount = editor?.storage.characterCount.words() || 0;
  const charCount = editor?.storage.characterCount.characters() || 0;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/admin/youtube-to-blog" className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 truncate max-w-md">{post.title}</h1>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{wordCount} words</span>
                  <span>{charCount} chars</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    post.status === 'published' ? 'bg-green-100 text-green-700' :
                    post.status === 'review' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {post.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {error && <span className="text-xs text-red-600">{error}</span>}
              {saved && <span className="text-xs text-green-600">Saved!</span>}

              <ApprovalButtons post={post} onUpdate={setPost} />

              <a
                href={`/admin/youtube-to-blog/${postId}/preview`}
                target="_blank"
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Preview
              </a>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Panel Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1">
            {[
              { key: 'editor' as const, label: 'Content' },
              { key: 'metadata' as const, label: 'SEO & Metadata' },
              { key: 'doctor' as const, label: 'Doctor Profile' },
              { key: 'images' as const, label: 'Images' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActivePanel(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activePanel === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {activePanel === 'editor' && editor && (
          <div className="max-w-4xl mx-auto">
            {/* Toolbar */}
            <EditorToolbar editor={editor} />

            {/* Editor */}
            <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 min-h-[500px]">
              <EditorContent editor={editor} />
            </div>

            {/* YouTube Embed */}
            {post.youtube_embed_url && (
              <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Source Video</h3>
                <div className="aspect-video max-w-lg">
                  <iframe
                    src={post.youtube_embed_url}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                    title="Source YouTube video"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activePanel === 'metadata' && (
          <MetadataPanel post={post} onUpdate={setPost} />
        )}

        {activePanel === 'doctor' && (
          <DoctorProfilePanel post={post} onUpdate={setPost} editor={editor} />
        )}

        {activePanel === 'images' && (
          <ImageGallery post={post} onUpdate={setPost} />
        )}
      </div>
    </div>
  );
}

// Toolbar component
function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const tools = [
    {
      icon: 'B',
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
      className: 'font-bold',
    },
    {
      icon: 'I',
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
      className: 'italic',
    },
    { type: 'divider' as const },
    {
      icon: 'H2',
      title: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: 'H3',
      title: 'Heading 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive('heading', { level: 3 }),
    },
    { type: 'divider' as const },
    {
      icon: 'UL',
      title: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
    },
    {
      icon: 'OL',
      title: 'Ordered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive('orderedList'),
    },
    { type: 'divider' as const },
    {
      icon: '"',
      title: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive('blockquote'),
    },
    {
      icon: '---',
      title: 'Horizontal Rule',
      action: () => editor.chain().focus().setHorizontalRule().run(),
      active: false,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-t-xl px-3 py-2 flex items-center gap-1 flex-wrap">
      {tools.map((tool, i) => {
        if ('type' in tool && tool.type === 'divider') {
          return <div key={i} className="w-px h-6 bg-slate-200 mx-1" />;
        }
        const t = tool as { icon: string; title: string; action: () => void; active: boolean; className?: string };
        return (
          <button
            key={i}
            onClick={t.action}
            title={t.title}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              t.active
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100'
            } ${t.className || ''}`}
          >
            {t.icon}
          </button>
        );
      })}
    </div>
  );
}
