// Static blog manifest - prerendered at build time
// Provides metadata for all file-based and static blog posts

const dynamicPostModules = import.meta.glob('../../content/blog/*.json', { eager: true });

const filePosts = Object.values(dynamicPostModules).map((mod: any) => {
  const data = mod.default || mod;
  return {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt || data.metaDescription || '',
    category: data.category || 'medical-devices',
    tags: data.tags || [],
    status: data.status || 'published',
    featured_image: data.featuredImage || null,
    published_at: data.publishedAt || null,
    updated_at: data.updatedAt || data.publishedAt || null,
    author: data.author || 'BRITZMEDI Team',
    doctor_name: data.doctor?.name || null,
    source: 'file' as const,
  };
});

const staticPosts = [
  {
    slug: 'korean-beauty-device-market',
    title: 'Korean Aesthetic Device Market: Why Global Distributors Are Partnering with Korean Manufacturers',
    excerpt: 'Market data, regulatory landscape, and partnership opportunities in the Korean aesthetic device industry.',
    category: 'industry-news',
    tags: ['Korean Medical Devices', 'K-Beauty', 'Distribution Partnership'],
    status: 'published',
    featured_image: '/images/blog/korean-market.jpg',
    published_at: '2025-10-20',
    updated_at: '2026-01-20',
    author: 'BRITZMEDI Team',
    doctor_name: null,
    source: 'static' as const,
  },
];

const manifest = [...filePosts, ...staticPosts];

export async function GET() {
  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/json' },
  });
}
