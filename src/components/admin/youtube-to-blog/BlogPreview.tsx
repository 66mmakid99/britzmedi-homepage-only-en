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

  const tags = post.tags ? JSON.parse(post.tags) : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Preview Header */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <span className="text-sm text-amber-700 font-medium">Preview Mode</span>
          <a
            href={`/admin/youtube-to-blog/${postId}`}
            className="text-sm text-amber-700 hover:text-amber-900"
          >
            Back to Editor
          </a>
        </div>
      </div>

      {/* Uses shared .blog-article styles from global.css */}
      <article className="blog-article">
        {/* Category & Date */}
        <div className="blog-meta">
          <span className="category-badge">{post.category}</span>
          <time>{new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</time>
          {post.channel_name && <span>Source: {post.channel_name}</span>}
        </div>

        {/* Title */}
        <h1>{post.title}</h1>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="blog-featured-image">
            <img
              src={post.featured_image}
              alt={post.title}
            />
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <div className="blog-excerpt-box">
            {post.excerpt}
          </div>
        )}

        {/* Doctor Profile */}
        {post.doctor_name && (
          <div className="blog-doctor-card">
            {post.doctor_image ? (
              <img
                src={post.doctor_image}
                alt={post.doctor_name}
                className="doctor-avatar"
              />
            ) : (
              <div className="doctor-avatar-placeholder">
                {post.doctor_name.charAt(0)}
              </div>
            )}
            <div className="doctor-info">
              <h4>{post.doctor_name}</h4>
              {post.doctor_title && <p className="doctor-title">{post.doctor_title}</p>}
              {post.doctor_credentials && (
                <p className="doctor-credentials">{post.doctor_credentials}</p>
              )}
              {post.doctor_bio && (
                <p className="doctor-bio">{post.doctor_bio}</p>
              )}
            </div>
          </div>
        )}

        {/* Author Bar */}
        <div className="blog-author-bar">
          <div className="author-info">
            <div className="author-avatar">B</div>
            <div>
              <p className="author-name">BRITZMEDI Team</p>
              <p className="author-org">BRITZMEDI Co., Ltd.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* YouTube Embed */}
        {post.youtube_embed_url && (
          <div className="blog-youtube-embed">
            <p className="embed-label">Watch the Full Video</p>
            <div className="embed-wrapper">
              <iframe
                src={post.youtube_embed_url}
                allowFullScreen
                title="Source video"
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="blog-tags">
            {tags.map((tag: string) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
