// R2 image upload utilities

/**
 * Upload image to R2 bucket
 */
export async function uploadToR2(
  r2: R2Bucket,
  key: string,
  data: ArrayBuffer,
  contentType = 'image/png'
): Promise<string> {
  await r2.put(key, data, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  // Return the public URL (assumes R2 custom domain or public bucket)
  return `/api/blog/images/${key}`;
}

/**
 * Generate a unique image key
 */
export function generateImageKey(postId: string, index: number, ext = 'png'): string {
  const timestamp = Date.now();
  return `blog/${postId}/${timestamp}-${index}.${ext}`;
}

/**
 * Delete image from R2
 */
export async function deleteFromR2(r2: R2Bucket, key: string): Promise<void> {
  await r2.delete(key);
}
