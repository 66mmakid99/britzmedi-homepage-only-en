// Orchestrator — drives a blog_jobs job through the full pipeline to the
// 'review' state without any human interaction, then fires the approval email.
//
// Pipeline (fixed order): extract -> translate -> generate -> research -> image -> finalize
// Each step = POST /api/blog/queue/{jobId}/step/{name} (no body, jobId in URL).
// 'generate' returns an SSE stream that MUST be consumed to completion for the
// blog_post to be created.
//
// All internal fetches use an absolute URL (origin from the cron request) and
// carry 'Authorization: Bearer {CRON_SECRET}', which middleware accepts as
// admin auth for /api/blog/** routes (the static admin_session cookie is only
// accepted in local dev, so it cannot authenticate the production cron).

import type { BlogJob } from './schemas';

const STEP_NAMES = ['extract', 'translate', 'generate', 'research', 'image', 'finalize'] as const;
type StepName = typeof STEP_NAMES[number];

export interface RunJobResult {
  ok: boolean;
  jobId: string;
  blogPostId?: string | null;
  completedSteps: StepName[];
  skippedSteps: StepName[];
  failedStep?: StepName;
  error?: string;
  approvalEmailSent?: boolean;
  approvalEmailError?: string;
}

function authHeaders(env: any): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    // Middleware accepts 'Bearer {CRON_SECRET}' as admin auth on /api/blog/**.
    // The calling cron route has already verified CRON_SECRET is configured.
    'Authorization': `Bearer ${env.CRON_SECRET}`,
  };
}

/**
 * Decide which steps are already satisfied for this job, so we never redo
 * expensive work (generate) or duplicate a blog_post.
 *
 * Heuristics from job columns:
 *  - extract done   => transcript_text present
 *  - translate done => translated_text present
 *  - generate done  => blog_post_id present
 *  - research/image => no reliable column flag; only skipped if job already
 *                      completed (status 'completed'). Otherwise re-run is safe
 *                      (idempotent: they mutate the existing blog_post).
 *  - finalize done  => status === 'completed'
 */
function computeStartIndex(job: BlogJob): number {
  if (job.status === 'completed' && job.blog_post_id) {
    // Everything through finalize already done.
    return STEP_NAMES.length;
  }
  // Resume from the first step whose precondition output is missing.
  if (!job.transcript_text) return 0;            // need extract
  if (!job.translated_text) return 1;            // need translate
  if (!job.blog_post_id) return 2;               // need generate (creates post)
  // Post exists but job not completed → resume at research (idempotent steps).
  return 3;
}

/**
 * Consume the SSE response of the generate step to completion.
 * Returns the 'done' event payload (with blog_post_id) or throws on error.
 */
async function consumeGenerateStream(res: Response): Promise<{ blog_post_id?: string }> {
  const reader = res.body?.getReader();
  if (!reader) {
    // No stream body — try JSON fallback (dev mode returns plain JSON).
    const data = await res.json().catch(() => ({} as any));
    if (data.blog_post_id) return { blog_post_id: data.blog_post_id };
    throw new Error('generate: no response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let result: { blog_post_id?: string } | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      let parsed: any;
      try {
        parsed = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }
      if (parsed.type === 'done') {
        result = { blog_post_id: parsed.blog_post_id };
      }
      if (parsed.type === 'error') {
        throw new Error(parsed.message || 'generate failed');
      }
    }
  }

  if (!result) throw new Error('generate: stream ended without a done event');
  return result;
}

/**
 * Run a single pipeline step via internal fetch.
 * Returns parsed result; throws on failure.
 */
async function runStep(stepName: StepName, jobId: string, env: any, origin: string): Promise<any> {
  const endpoint = `${origin}/api/blog/queue/${jobId}/step/${stepName}`;
  const res = await fetch(endpoint, { method: 'POST', headers: authHeaders(env) });

  if (stepName === 'generate') {
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'generate failed' }));
      throw new Error(data.error || `generate failed (${res.status})`);
    }
    return await consumeGenerateStream(res);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `${stepName} failed (${res.status})`);
  }
  return data;
}

/**
 * Drive a job all the way to 'review' (blog_posts.status='review'),
 * then auto-send the approval email.
 *
 * Never throws — returns a structured result.
 */
export async function runJobToReview(jobId: string, env: any, origin: string): Promise<RunJobResult> {
  const db = env?.DB as D1Database | undefined;
  const completedSteps: StepName[] = [];
  const skippedSteps: StepName[] = [];

  if (!db) {
    return { ok: false, jobId, completedSteps, skippedSteps, error: 'Database not available' };
  }

  let job: BlogJob | null;
  try {
    job = await db.prepare('SELECT * FROM blog_jobs WHERE id = ?').bind(jobId).first<BlogJob>();
  } catch (e: any) {
    return { ok: false, jobId, completedSteps, skippedSteps, error: `Failed to load job: ${e?.message}` };
  }
  if (!job) {
    return { ok: false, jobId, completedSteps, skippedSteps, error: 'Job not found' };
  }
  if (job.status === 'failed') {
    return { ok: false, jobId, completedSteps, skippedSteps, error: 'Job is in failed state; skipping' };
  }

  const startIndex = computeStartIndex(job);
  let blogPostId: string | null = job.blog_post_id;

  for (let i = 0; i < STEP_NAMES.length; i++) {
    const stepName = STEP_NAMES[i];
    if (i < startIndex) {
      skippedSteps.push(stepName);
      continue;
    }
    try {
      const result = await runStep(stepName, jobId, env, origin);
      if (stepName === 'generate' && result?.blog_post_id) {
        blogPostId = result.blog_post_id;
      }
      if (stepName === 'finalize' && result?.blog_post_id) {
        blogPostId = result.blog_post_id;
      }
      completedSteps.push(stepName);
    } catch (e: any) {
      return {
        ok: false,
        jobId,
        blogPostId,
        completedSteps,
        skippedSteps,
        failedStep: stepName,
        error: e?.message || `${stepName} failed`,
      };
    }
  }

  // Finalize succeeded → blog_post is in 'review'. Send approval email.
  let approvalEmailSent = false;
  let approvalEmailError: string | undefined;
  if (blogPostId) {
    try {
      const res = await fetch(`${origin}/api/blog/posts/${blogPostId}/send-approval`, {
        method: 'POST',
        headers: authHeaders(env),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        approvalEmailSent = true;
      } else {
        approvalEmailError = data.error || `send-approval failed (${res.status})`;
      }
    } catch (e: any) {
      approvalEmailError = e?.message || 'send-approval error';
    }
  }

  return {
    ok: true,
    jobId,
    blogPostId,
    completedSteps,
    skippedSteps,
    approvalEmailSent,
    approvalEmailError,
  };
}
