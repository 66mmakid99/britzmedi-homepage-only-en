// GitHub API integration for publishing blog posts

interface GitHubFileCommit {
  path: string;
  content: string; // base64 encoded
  message: string;
}

/**
 * Create or update a file via GitHub API
 */
export async function commitFileToGitHub(
  token: string,
  repo: string,
  filePath: string,
  content: string,
  commitMessage: string
): Promise<{ sha: string; html_url: string }> {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  // Check if file exists (to get sha for updates)
  let existingSha: string | undefined;
  try {
    const checkRes = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'BRITZMEDI-Blog-Publisher',
      },
    });
    if (checkRes.ok) {
      const data = await checkRes.json();
      existingSha = data.sha;
    }
  } catch {
    // File doesn't exist, will create
  }

  // Create/update file
  const body: Record<string, string> = {
    message: commitMessage,
    content: btoa(unescape(encodeURIComponent(content))), // UTF-8 safe base64
    branch: 'main',
  };

  if (existingSha) {
    body.sha = existingSha;
  }

  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'BRITZMEDI-Blog-Publisher',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    sha: data.commit.sha,
    html_url: data.content.html_url,
  };
}

/**
 * Delete a file via GitHub API
 */
export async function deleteFileFromGitHub(
  token: string,
  repo: string,
  filePath: string,
  commitMessage: string
): Promise<void> {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  // Get current sha
  const checkRes = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'BRITZMEDI-Blog-Publisher',
    },
  });

  if (!checkRes.ok) {
    throw new Error('File not found on GitHub');
  }

  const data = await checkRes.json();

  const res = await fetch(apiUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'BRITZMEDI-Blog-Publisher',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMessage,
      sha: data.sha,
      branch: 'main',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub delete error (${res.status}): ${errText}`);
  }
}

/**
 * Build blog post JSON for GitHub storage
 */
export function buildBlogPostJson(post: {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  meta_description: string;
  keywords: string[];
  tags: string[];
  category: string;
  featured_image: string | null;
  youtube_embed_url: string | null;
  youtube_url: string | null;
  doctor_name: string | null;
  doctor_title: string | null;
  doctor_credentials: string | null;
  doctor_image: string | null;
  doctor_bio: string | null;
  published_at: string;
  schema_json_ld: string | null;
}): string {
  return JSON.stringify({
    title: post.title,
    slug: post.slug,
    status: 'published',
    content: post.content,
    excerpt: post.excerpt,
    metaDescription: post.meta_description,
    keywords: post.keywords,
    tags: post.tags,
    category: post.category,
    featuredImage: post.featured_image,
    youtubeEmbedUrl: post.youtube_embed_url,
    youtubeUrl: post.youtube_url,
    author: 'BRITZMEDI Team',
    publishedAt: post.published_at,
    updatedAt: new Date().toISOString(),
    doctor: post.doctor_name ? {
      name: post.doctor_name,
      title: post.doctor_title,
      credentials: post.doctor_credentials,
      image: post.doctor_image,
      bio: post.doctor_bio,
    } : null,
    schemaJsonLd: post.schema_json_ld ? JSON.parse(post.schema_json_ld) : null,
  }, null, 2);
}
