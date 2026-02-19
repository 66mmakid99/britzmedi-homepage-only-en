// YouTubeImportModal — 3-phase modal: Input → Processing → Complete
// Orchestrates the 6-step YouTube-to-Blog pipeline, then bridges into Content Hub

import { useState, useCallback, useRef } from 'react';
import { YouTubePipelineProgress } from './YouTubePipelineProgress';

type Phase = 'input' | 'processing' | 'complete';

interface StepState {
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (contentId: number) => void;
}

const STEP_NAMES = ['extract', 'translate', 'generate', 'research', 'image', 'finalize'] as const;
type StepName = typeof STEP_NAMES[number];

const STEP_PROGRESS: Record<StepName, [number, number]> = {
  extract: [5, 20],
  translate: [25, 40],
  generate: [45, 60],
  research: [65, 75],
  image: [80, 95],
  finalize: [95, 100],
};

const YOUTUBE_URL_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?].*)?$/;

function extractYouTubeId(url: string): string | null {
  const match = url.match(YOUTUBE_URL_REGEX);
  return match ? match[1] : null;
}

function getInitialSteps(): Record<string, StepState> {
  const steps: Record<string, StepState> = {};
  for (const name of STEP_NAMES) {
    steps[name] = { status: 'pending' };
  }
  return steps;
}

export function YouTubeImportModal({ isOpen, onClose, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('input');
  const [url, setUrl] = useState('');
  const [tone, setTone] = useState('professional');
  const [wordCount, setWordCount] = useState(1500);
  const [urlError, setUrlError] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const [steps, setSteps] = useState<Record<string, StepState>>(getInitialSteps);
  const [overallProgress, setOverallProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [blogPostId, setBlogPostId] = useState<string | null>(null);
  const [contentId, setContentId] = useState<number | null>(null);
  const [contentSlug, setContentSlug] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [duplicateJobId, setDuplicateJobId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // ─── URL validation ─────────────────────────────────────────

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setUrlError('');
    setThumbnail(null);

    const id = extractYouTubeId(value.trim());
    if (value.trim() && !id) {
      setUrlError('Please enter a valid YouTube URL');
    } else if (id) {
      setThumbnail(`https://img.youtube.com/vi/${id}/mqdefault.jpg`);
    }
  }, []);

  // ─── Run a single step ─────────────────────────────────────

  const runStep = useCallback(async (
    stepName: StepName,
    currentJobId: string,
    signal: AbortSignal,
  ): Promise<any> => {
    setSteps(prev => ({ ...prev, [stepName]: { status: 'running' } }));
    setOverallProgress(STEP_PROGRESS[stepName][0]);

    const endpoint = `/api/blog/queue/${currentJobId}/step/${stepName}`;

    // generate step uses SSE streaming
    if (stepName === 'generate') {
      const res = await fetch(endpoint, { method: 'POST', signal });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(data.error || `Step ${stepName} failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body for generate step');

      const decoder = new TextDecoder();
      let buffer = '';
      let result: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const data = JSON.parse(line.slice(5).trim());
            if (data.type === 'progress' && data.percent) {
              setOverallProgress(Math.min(data.percent, STEP_PROGRESS[stepName][1]));
            }
            if (data.type === 'done') {
              result = data;
            }
            if (data.type === 'error') {
              throw new Error(data.message || 'Generation error');
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Generation error' && !e.message.includes('Generation')) {
              // JSON parse error — ignore partial data
            } else {
              throw e;
            }
          }
        }
      }

      setOverallProgress(STEP_PROGRESS[stepName][1]);
      setSteps(prev => ({ ...prev, [stepName]: { status: 'completed' } }));
      return result;
    }

    // Normal JSON steps
    const res = await fetch(endpoint, { method: 'POST', signal });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data.error || `Step ${stepName} failed (${res.status})`);
    }

    setOverallProgress(STEP_PROGRESS[stepName][1]);
    setSteps(prev => ({ ...prev, [stepName]: { status: 'completed' } }));
    return data;
  }, []);

  // ─── Run full pipeline ─────────────────────────────────────

  const startPipeline = useCallback(async () => {
    const ytId = extractYouTubeId(url.trim());
    if (!ytId) {
      setUrlError('Please enter a valid YouTube URL');
      return;
    }

    setPhase('processing');
    setSteps(getInitialSteps());
    setOverallProgress(0);
    setGlobalError(null);
    setBlogPostId(null);
    setContentId(null);
    setContentSlug(null);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      // 1. Create job
      const queueRes = await fetch('/api/blog/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url: url.trim(),
          tone,
          word_count: wordCount,
        }),
        signal: abort.signal,
      });

      const queueData = await queueRes.json();

      if (!queueRes.ok) {
        // Handle duplicate job — offer to clear and retry
        if (queueRes.status === 409 && queueData.existing_job_id) {
          const err = new Error(`Duplicate job exists (${queueData.existing_status || 'active'}). Clear it to retry.`) as any;
          err.duplicateJobId = queueData.existing_job_id;
          throw err;
        }
        throw new Error(queueData.error || 'Failed to create job');
      }

      const currentJobId = queueData.job?.id;
      if (!currentJobId) throw new Error('No job ID returned');
      setJobId(currentJobId);

      // 2. Run each step sequentially
      let generateResult: any = null;

      for (const stepName of STEP_NAMES) {
        if (abort.signal.aborted) break;
        const result = await runStep(stepName, currentJobId, abort.signal);

        if (stepName === 'generate' && result?.blog_post_id) {
          setBlogPostId(result.blog_post_id);
          generateResult = result;
        }
        if (stepName === 'finalize' && result?.blog_post_id) {
          setBlogPostId(result.blog_post_id);
        }
      }

      // 3. Bridge: import into content_items
      const postId = generateResult?.blog_post_id || blogPostId;
      if (postId) {
        const bridgeRes = await fetch('/api/admin/content-hub/import-youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blog_post_id: postId, job_id: currentJobId }),
          signal: abort.signal,
        });

        const bridgeData = await bridgeRes.json();
        if (bridgeRes.ok && bridgeData.content_id) {
          setContentId(bridgeData.content_id);
          setContentSlug(bridgeData.slug || null);
        }
      }

      setPhase('complete');
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      // Capture duplicate job ID for "Clear & Retry" button
      if (err.duplicateJobId) {
        setDuplicateJobId(err.duplicateJobId);
      }

      // Find the running step and mark it failed
      setSteps(prev => {
        const next = { ...prev };
        for (const name of STEP_NAMES) {
          if (next[name].status === 'running') {
            next[name] = { status: 'failed', error: err.message };
            break;
          }
        }
        return next;
      });
      setGlobalError(err.message || 'Pipeline failed');
    }
  }, [url, tone, wordCount, runStep, blogPostId]);

  // ─── Retry from failed step ─────────────────────────────────

  const retryPipeline = useCallback(async () => {
    if (!jobId) return;

    setGlobalError(null);
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      // Find the failed step and resume from there
      const failedIdx = STEP_NAMES.findIndex(name => steps[name]?.status === 'failed');
      if (failedIdx === -1) return;

      // Reset failed and pending steps
      setSteps(prev => {
        const next = { ...prev };
        for (let i = failedIdx; i < STEP_NAMES.length; i++) {
          next[STEP_NAMES[i]] = { status: 'pending' };
        }
        return next;
      });

      let generateResult: any = null;

      for (let i = failedIdx; i < STEP_NAMES.length; i++) {
        if (abort.signal.aborted) break;
        const stepName = STEP_NAMES[i];
        const result = await runStep(stepName, jobId, abort.signal);

        if (stepName === 'generate' && result?.blog_post_id) {
          setBlogPostId(result.blog_post_id);
          generateResult = result;
        }
        if (stepName === 'finalize' && result?.blog_post_id) {
          setBlogPostId(result.blog_post_id);
        }
      }

      // Bridge
      const postId = generateResult?.blog_post_id || blogPostId;
      if (postId && !contentId) {
        const bridgeRes = await fetch('/api/admin/content-hub/import-youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blog_post_id: postId, job_id: jobId }),
          signal: abort.signal,
        });

        const bridgeData = await bridgeRes.json();
        if (bridgeRes.ok && bridgeData.content_id) {
          setContentId(bridgeData.content_id);
          setContentSlug(bridgeData.slug || null);
        }
      }

      setPhase('complete');
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      setSteps(prev => {
        const next = { ...prev };
        for (const name of STEP_NAMES) {
          if (next[name].status === 'running') {
            next[name] = { status: 'failed', error: err.message };
            break;
          }
        }
        return next;
      });
      setGlobalError(err.message || 'Pipeline retry failed');
    }
  }, [jobId, steps, runStep, blogPostId, contentId]);

  // ─── Clear duplicate job & retry ────────────────────────────

  const clearAndRetry = useCallback(async () => {
    if (!duplicateJobId) return;

    try {
      await fetch(`/api/blog/queue/${duplicateJobId}`, { method: 'DELETE' });
    } catch {
      // Ignore delete errors — proceed to retry anyway
    }

    setDuplicateJobId(null);
    setGlobalError(null);
    setPhase('input');
    // Re-trigger pipeline after a tick so state settles
    setTimeout(() => startPipeline(), 100);
  }, [duplicateJobId, startPipeline]);

  // ─── Reset ──────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    if (phase === 'processing') {
      abortRef.current?.abort();
    }
    setPhase('input');
    setUrl('');
    setTone('professional');
    setWordCount(1500);
    setUrlError('');
    setThumbnail(null);
    setSteps(getInitialSteps());
    setOverallProgress(0);
    setJobId(null);
    setBlogPostId(null);
    setContentId(null);
    setContentSlug(null);
    setGlobalError(null);
    setDuplicateJobId(null);
    onClose();
  }, [phase, onClose]);

  const handleNewStart = useCallback(() => {
    setPhase('input');
    setUrl('');
    setTone('professional');
    setWordCount(1500);
    setUrlError('');
    setThumbnail(null);
    setSteps(getInitialSteps());
    setOverallProgress(0);
    setJobId(null);
    setBlogPostId(null);
    setContentId(null);
    setContentSlug(null);
    setGlobalError(null);
    setDuplicateJobId(null);
  }, []);

  if (!isOpen) return null;

  const canStart = url.trim() && extractYouTubeId(url.trim()) && !urlError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">YouTube to Blog</h2>
              <p className="text-xs text-slate-500">
                {phase === 'input' && 'Paste a YouTube URL to generate a blog article'}
                {phase === 'processing' && 'Generating your blog article...'}
                {phase === 'complete' && 'Article generated successfully!'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* ─── Input Phase ─── */}
          {phase === 'input' && (
            <div className="space-y-5">
              {/* URL input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">YouTube URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={e => handleUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                    urlError ? 'border-red-300' : 'border-slate-200'
                  }`}
                  autoFocus
                />
                {urlError && <p className="text-xs text-red-500 mt-1">{urlError}</p>}
              </div>

              {/* Thumbnail preview */}
              {thumbnail && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={thumbnail}
                    alt="Video thumbnail"
                    className="w-full h-40 object-cover"
                    onError={() => setThumbnail(null)}
                  />
                </div>
              )}

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tone</label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="academic">Academic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Word Count</label>
                  <select
                    value={wordCount}
                    onChange={e => setWordCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value={800}>~800 words</option>
                    <option value={1500}>~1,500 words</option>
                    <option value={2500}>~2,500 words</option>
                    <option value={4000}>~4,000 words</option>
                  </select>
                </div>
              </div>

              {/* Start button */}
              <button
                onClick={startPipeline}
                disabled={!canStart}
                className="w-full py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Start Generating
              </button>
            </div>
          )}

          {/* ─── Processing Phase ─── */}
          {phase === 'processing' && (
            <div className="space-y-5">
              <YouTubePipelineProgress steps={steps} overallProgress={overallProgress} />

              {globalError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                  <p className="text-sm text-red-700">{globalError}</p>
                  <div className="flex gap-2">
                    {duplicateJobId ? (
                      <button
                        onClick={clearAndRetry}
                        className="px-4 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                      >
                        Clear Old Job & Retry
                      </button>
                    ) : (
                      <button
                        onClick={retryPipeline}
                        className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        Retry Failed Step
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!globalError && (
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          )}

          {/* ─── Complete Phase ─── */}
          {phase === 'complete' && (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Article Generated!</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Your YouTube video has been converted to a draft blog article in the Content Hub.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {contentId && (
                  <a
                    href={`/admin/content-hub/edit/${contentId}`}
                    className="block w-full py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors text-center"
                    onClick={() => {
                      onComplete(contentId);
                    }}
                  >
                    Open in Editor
                  </a>
                )}
                <button
                  onClick={() => {
                    if (contentId) onComplete(contentId);
                    handleNewStart();
                  }}
                  className="w-full py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Generate Another
                </button>
                <button
                  onClick={() => {
                    if (contentId) onComplete(contentId);
                    handleClose();
                  }}
                  className="w-full py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
