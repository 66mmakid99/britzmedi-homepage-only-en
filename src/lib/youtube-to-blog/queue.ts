// Queue management utilities for blog generation jobs

import type { BlogJob, JobStatus, StepName } from './schemas';
import { STEP_PROGRESS } from './schemas';

/**
 * Validate that required tables exist in the database.
 * Throws a clear error if blog_jobs table is missing.
 */
export async function validateTables(db: D1Database): Promise<void> {
  const result = await db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='blog_jobs'"
  ).first<{ name: string }>();

  if (!result) {
    throw new Error(
      'blog_jobs table not found in D1 database. ' +
      'Run migration 0010_full_schema.sql: ' +
      'wrangler d1 execute britzmedi-leads --remote --file migrations/0010_full_schema.sql'
    );
  }
}

// Allowed columns for dynamic updates (prevents SQL injection)
const ALLOWED_EXTRA_COLUMNS = new Set([
  'transcript_text', 'transcript_lang', 'translated_text',
  'video_title', 'channel_name', 'channel_id',
  'blog_post_id', 'error_message', 'current_step',
]);

/**
 * Update job status and progress in the database
 */
export async function updateJobStatus(
  db: D1Database,
  jobId: string,
  status: JobStatus,
  progress: number,
  extra?: Record<string, string | number | null>
): Promise<void> {
  const setClauses = [
    'status = ?',
    'progress = ?',
    "updated_at = datetime('now')",
  ];
  const values: (string | number | null)[] = [status, progress];

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (!ALLOWED_EXTRA_COLUMNS.has(key)) continue;
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  }

  // Add started_at on first active status
  if (['extracting'].includes(status)) {
    setClauses.push("started_at = datetime('now')");
  }

  // Add completed_at when done
  if (status === 'completed') {
    setClauses.push("completed_at = datetime('now')");
  }

  values.push(jobId);
  await db.prepare(
    `UPDATE blog_jobs SET ${setClauses.join(', ')} WHERE id = ?`
  ).bind(...values).run();
}

/**
 * Mark a job as failed with an error message
 */
export async function failJob(db: D1Database, jobId: string, error: string): Promise<void> {
  await updateJobStatus(db, jobId, 'failed', -1, { error_message: error });
}

/**
 * Get job from database
 */
export async function getJob(db: D1Database, jobId: string): Promise<BlogJob | null> {
  return await db.prepare('SELECT * FROM blog_jobs WHERE id = ?').bind(jobId).first<BlogJob>();
}

/**
 * Validate that a step can be executed (correct order)
 */
export function validateStepOrder(job: BlogJob, step: StepName): string | null {
  const stepOrder: StepName[] = ['extract', 'translate', 'generate', 'research', 'image', 'finalize'];
  const currentIndex = stepOrder.indexOf(step);

  if (currentIndex === -1) {
    return `Unknown step: ${step}`;
  }

  // First step can always run on pending jobs
  if (step === 'extract' && (job.status === 'pending' || job.status === 'failed')) {
    return null;
  }

  // Check if previous steps completed
  if (step === 'translate' && !job.transcript_text) {
    return 'Extract step must complete first';
  }

  if (step === 'generate' && !job.translated_text && !job.transcript_text) {
    return 'Transcript must be extracted and translated first';
  }

  if (step === 'research' && !job.blog_post_id) {
    return 'Blog post must be generated first';
  }

  if (step === 'image' && !job.blog_post_id) {
    return 'Blog post must be generated first';
  }

  if (step === 'finalize' && !job.blog_post_id) {
    return 'Blog post must be generated first';
  }

  return null;
}
