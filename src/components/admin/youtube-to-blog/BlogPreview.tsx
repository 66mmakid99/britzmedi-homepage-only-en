import { useState, useEffect } from 'react';
import type { BlogPost } from '../../../lib/youtube-to-blog/schemas';

interface BlogPreviewProps {
  postId: string;
}

export default function BlogPreview({ postId }: BlogPreviewProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/blog/posts/${postId}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data.post);
        }
      } catch {
        console.error('Failed to fetch post');
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-slate-500">Loading preview...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-red-600">Post not found</span>
      </div>
    );
  }

  const keywords = post.keywords ? JSON.parse(post.keywords) : [];
  const tags = post.tags ? JSON.parse(post.tags) : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Preview Header */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
        <div className="container mx-auto flex items-center justify-between">
          <span className="text-sm text-amber-700 font-medium">Preview Mode</span>
          <a
            href={`/admin/youtube-to-blog/${postId}`}
            className="text-sm text-amber-700 hover:text-amber-900"
          >
            Back to Editor
          </a>
        </div>
      </div>

      {/* Article */}
      <article className="container mx-auto max-w-3xl px-4 py-12">
        {/* Category */}
        <div className="mb-4">
          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
          <time>{new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</time>
          {post.channel_name && <span>Source: {post.channel_name}</span>}
        </div>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="mt-8">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full rounded-xl object-cover max-h-96"
            />
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-lg text-slate-700 italic">{post.excerpt}</p>
          </div>
        )}

        {/* Doctor Profile */}
        {post.doctor_name && (
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-blue-700">
                  {post.doctor_name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{post.doctor_name}</p>
                {post.doctor_title && <p className="text-sm text-slate-600">{post.doctor_title}</p>}
                {post.doctor_credentials && (
                  <p className="text-xs text-slate-500 mt-1">{post.doctor_credentials}</p>
                )}
                {post.doctor_bio && (
                  <p className="text-sm text-slate-600 mt-2">{post.doctor_bio}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-slate max-w-none mt-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* YouTube Embed */}
        {post.youtube_embed_url && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Watch the Full Video</h3>
            <div className="aspect-video">
              <iframe
                src={post.youtube_embed_url}
                className="w-full h-full rounded-xl"
                allowFullScreen
                title="Source video"
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
