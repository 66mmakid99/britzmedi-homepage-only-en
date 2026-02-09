import type { PostToSocialInput, SocialChannel, SocialAccount, ChannelPosterEnv } from './types';
import { generateContent } from './content-generator';
import { getChannelPoster } from './channels';

export async function triggerAutoPost(
  input: PostToSocialInput,
  env: { db: D1Database } & ChannelPosterEnv,
): Promise<void> {
  const { db } = env;

  const accounts = await db.prepare(
    'SELECT * FROM social_accounts WHERE enabled = 1 AND auto_post = 1'
  ).all<SocialAccount>();

  const enabledAccounts = accounts.results || [];

  if (enabledAccounts.length === 0) {
    console.log('[Social:AutoPost] No enabled auto-post accounts, skipping');
    return;
  }

  for (const account of enabledAccounts) {
    const channel = account.channel as SocialChannel;
    const content = generateContent(channel, input);
    const now = new Date().toISOString();

    const insertResult = await db.prepare(`
      INSERT INTO social_posts (post_id, channel, content, status, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `).bind(input.postId, channel, content, now, now).run();

    const socialPostId = insertResult.meta.last_row_id;

    try {
      const poster = getChannelPoster(channel);
      const result = await poster(content, env);

      if (result.success) {
        await db.prepare(`
          UPDATE social_posts SET status = 'posted', published_at = ?, external_id = ?, updated_at = ?
          WHERE id = ?
        `).bind(now, result.externalId || null, now, socialPostId).run();
        console.log(`[Social:AutoPost] Posted to ${channel}: ${result.externalId}`);
      } else {
        await db.prepare(`
          UPDATE social_posts SET status = 'failed', error_message = ?, updated_at = ?
          WHERE id = ?
        `).bind(result.error || 'Unknown error', now, socialPostId).run();
        console.error(`[Social:AutoPost] Failed ${channel}: ${result.error}`);
      }
    } catch (error: any) {
      await db.prepare(`
        UPDATE social_posts SET status = 'failed', error_message = ?, updated_at = ?
        WHERE id = ?
      `).bind(error?.message || 'Exception during posting', now, socialPostId).run();
      console.error(`[Social:AutoPost] Exception ${channel}:`, error);
    }
  }
}
