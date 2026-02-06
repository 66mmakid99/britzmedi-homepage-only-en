import { useState, useEffect, useCallback } from 'react';
import type { BlogJob, BlogPost } from '../../../lib/youtube-to-blog/schemas';
import { InputTabs } from './InputTabs';
import { ProcessingQueue } from './ProcessingQueue';
import { PublishedPosts } from './PublishedPosts';

type Tab = 'input' | 'queue' | 'posts';

export default function YouTubeToBlogDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('input');
  const [jobs, setJobs] = useState<BlogJob[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [jobsRes, postsRes] = await Promise.all([
        fetch('/api/blog/queue'),
        fetch('/api/blog/posts'),
      ]);
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.jobs || []);
      }
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll for updates every 10 seconds when on queue tab
    const interval = setInterval(() => {
      if (activeTab === 'queue') fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchData, activeTab]);

  const handleJobCreated = (job: BlogJob) => {
    setJobs(prev => [job, ...prev]);
    setActiveTab('queue');
  };

  const handleJobDeleted = (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const activeJobsCount = jobs.filter(j => !['completed', 'failed'].includes(j.status)).length;
  const completedJobsCount = jobs.filter(j => j.status === 'completed').length;
  const publishedPostsCount = posts.filter(p => p.status === 'published').length;

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'input', label: 'New Job' },
    { key: 'queue', label: 'Processing Queue', badge: activeJobsCount },
    { key: 'posts', label: 'Blog Posts', badge: posts.length },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Page Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">YouTube to Blog</h1>
              <p className="text-sm text-slate-500">
                Convert YouTube videos into SEO-optimized blog posts with AI
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <span className="font-semibold">{activeJobsCount}</span>
                <span>Processing</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                <span className="font-semibold">{completedJobsCount}</span>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg">
                <span className="font-semibold">{publishedPostsCount}</span>
                <span>Published</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-slate-500">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'input' && (
              <InputTabs onJobCreated={handleJobCreated} />
            )}
            {activeTab === 'queue' && (
              <ProcessingQueue
                jobs={jobs}
                onRefresh={fetchData}
                onJobDeleted={handleJobDeleted}
              />
            )}
            {activeTab === 'posts' && (
              <PublishedPosts
                posts={posts}
                onRefresh={fetchData}
                onPostDeleted={handlePostDeleted}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
