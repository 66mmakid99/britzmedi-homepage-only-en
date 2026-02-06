// Schema.org JSON-LD templates for blog posts

interface BlogPostData {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  featuredImage: string | null;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  doctor?: {
    name: string;
    title: string;
    credentials: string;
  } | null;
}

/**
 * Generate Article schema for blog post
 */
export function generateArticleSchema(post: BlogPostData): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': post.title,
    'description': post.excerpt,
    'image': post.featuredImage || 'https://britzmedi.com/og-image.jpg',
    'author': {
      '@type': 'Organization',
      'name': post.author || 'BRITZMEDI Team',
      'url': 'https://britzmedi.com',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'BRITZMEDI Co., Ltd.',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://britzmedi.com/images/logos/britzmedi-logo.png',
      },
    },
    'datePublished': post.publishedAt,
    'dateModified': post.updatedAt || post.publishedAt,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://britzmedi.com/blog/${post.slug}`,
    },
    'keywords': post.tags.join(', '),
    'articleSection': post.category,
  };

  // Add medical author if available
  if (post.doctor) {
    schema['author'] = [
      {
        '@type': 'Organization',
        'name': post.author || 'BRITZMEDI Team',
        'url': 'https://britzmedi.com',
      },
      {
        '@type': 'Person',
        'name': post.doctor.name,
        'jobTitle': post.doctor.title,
        'description': post.doctor.credentials,
      },
    ];
  }

  return schema;
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(post: BlogPostData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://britzmedi.com',
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Blog',
        'item': 'https://britzmedi.com/blog',
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': post.title,
        'item': `https://britzmedi.com/blog/${post.slug}`,
      },
    ],
  };
}
