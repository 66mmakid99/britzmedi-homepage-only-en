import type { HomepageConfig } from '../../data/homepage.types';

const PRODUCTS = [
  { id: 'torr-rf', name: 'TORR RF', tagline: 'Multi-Wave RF Platform', image: '/images/products/torr-rf.webp' },
  { id: 'ulblanc', name: 'ULBLANC', tagline: 'i-Booster Technology', image: '/images/products/ulblanc.webp' },
  { id: 'newchae-shot', name: 'NEWCHAE SHOT', tagline: 'Needle-Free Meso Solution', image: '/images/products/newchae-shot.webp' },
];

interface PreviewProps {
  config: HomepageConfig;
  productImages?: Record<string, string>;
}

export default function HomepagePreview({ config, productImages }: PreviewProps) {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#0f172a', fontSize: 14, lineHeight: 1.6 }}>
      {/* Hero */}
      <HeroSection config={config} />
      {/* Trust Badges */}
      <BadgesSection config={config} />
      {/* Products */}
      <ProductsSection config={config} productImages={productImages} />
      {/* Why BRITZMEDI */}
      <WhySection config={config} />
      {/* Core Technologies */}
      <TechSection config={config} />
      {/* CTA */}
      <CTASection config={config} />
    </div>
  );
}

function HeroSection({ config }: { config: HomepageConfig }) {
  const hero = config.hero;
  const bgImage = hero.backgroundType === 'split'
    ? (hero.heroImage || '/images/hero-desktop.webp')
    : hero.backgroundImage;

  return (
    <div style={{
      position: 'relative',
      minHeight: 320,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
    }}>
      {/* Background */}
      {hero.backgroundType !== 'gradient' && bgImage && (
        <img
          src={bgImage}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
      )}
      {hero.backgroundType === 'gradient' && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }} />
      )}

      {/* Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: hero.backgroundType === 'gradient'
          ? 'transparent'
          : hero.backgroundType === 'split'
            ? 'linear-gradient(to right, rgb(15 23 42) 0%, rgb(15 23 42 / 0.7) 50%, transparent 100%)'
            : `rgb(15 23 42 / ${hero.overlayOpacity / 100})`,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, padding: '48px 32px', maxWidth: 500 }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 12,
          background: hero.backgroundType === 'gradient' ? '#eff6ff' : 'rgba(255,255,255,0.2)',
          color: hero.backgroundType === 'gradient' ? '#2563eb' : '#fff',
          border: `1px solid ${hero.backgroundType === 'gradient' ? '#bfdbfe' : 'rgba(255,255,255,0.3)'}`,
        }}>
          {hero.badge}
        </div>

        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1.2,
          marginBottom: 12,
          color: hero.backgroundType === 'gradient' ? '#0f172a' : '#fff',
        }}>
          {hero.headline}<br />
          <span style={{ color: hero.backgroundType === 'gradient' ? '#2563eb' : '#60a5fa' }}>
            {hero.highlightText}
          </span><br />
          {hero.subheadline}
        </h1>

        <p style={{
          fontSize: 13,
          marginBottom: 20,
          color: hero.backgroundType === 'gradient' ? '#64748b' : '#cbd5e1',
          maxWidth: 400,
        }}>
          {hero.description}
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: '#2563eb',
            color: '#fff',
          }}>
            {hero.primaryCTA.text} →
          </span>
          <span style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.3)',
            color: hero.backgroundType === 'gradient' ? '#334155' : '#fff',
            background: hero.backgroundType === 'gradient' ? '#fff' : 'rgba(255,255,255,0.1)',
          }}>
            {hero.secondaryCTA.text}
          </span>
        </div>
      </div>
    </div>
  );
}

function BadgesSection({ config }: { config: HomepageConfig }) {
  return (
    <div style={{ padding: '24px 32px', background: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, textAlign: 'center' }}>
        {config.trustBadges.badges.map((badge, i) => (
          <div key={i}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              marginBottom: 6,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>{badge.label}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{badge.title}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{badge.subtitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsSection({ config, productImages }: { config: HomepageConfig; productImages?: Record<string, string> }) {
  const displayProducts = PRODUCTS.slice(0, config.featuredProducts.displayCount);
  return (
    <div style={{ padding: '24px 32px', background: '#f8fafc' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          {config.featuredProducts.label}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          {config.featuredProducts.title}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', maxWidth: 400 }}>
          {config.featuredProducts.description}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(displayProducts.length, 3)}, 1fr)`, gap: 12 }}>
        {displayProducts.map((product) => (
          <div key={product.id} style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}>
            <div style={{ aspectRatio: '4/3', background: '#f1f5f9', overflow: 'hidden' }}>
              <img
                src={productImages?.[product.id] || product.image}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{product.name}</div>
              <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 500 }}>{product.tagline}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhySection({ config }: { config: HomepageConfig }) {
  const why = config.whyBritzMedi;
  return (
    <div style={{ padding: '24px 32px', background: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            {why.label}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8, whiteSpace: 'pre-line' }}>
            {why.title}
          </div>
          {why.description && (
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{why.description}</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {why.features.map((feat, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  flexShrink: 0,
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={feat.iconPath} />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{feat.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{feat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{why.statsTitle}</div>
          {why.stats.map((stat, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: i < why.stats.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{stat.label}</span>
              {stat.type === 'badge' ? (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#15803d',
                  background: '#f0fdf4',
                  padding: '2px 8px',
                  borderRadius: 12,
                  border: '1px solid #bbf7d0',
                }}>
                  {stat.badgeText || stat.value}
                </span>
              ) : (
                <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{stat.value}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TechSection({ config }: { config: HomepageConfig }) {
  return (
    <div style={{ padding: '24px 32px', background: '#f8fafc', textAlign: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {config.coreTechnologies.label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
        {config.coreTechnologies.title}
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16, maxWidth: 400, margin: '0 auto 16px' }}>
        {config.coreTechnologies.description}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {['Multi-Wave RF', 'Ultrasound', 'Needle-Free'].map((name, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, textAlign: 'left' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Proprietary technology</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CTASection({ config }: { config: HomepageConfig }) {
  return (
    <div style={{
      padding: '32px',
      background: 'linear-gradient(135deg, #2563eb, #1d4ed8, #1e40af)',
      textAlign: 'center',
    }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
        {config.cta.title}
      </h2>
      <p style={{ fontSize: 13, color: '#bfdbfe', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
        {config.cta.description}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <span style={{
          padding: '10px 20px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          background: '#fff',
          color: '#1d4ed8',
        }}>
          {config.cta.primaryCTA.text} →
        </span>
        <span style={{
          padding: '10px 20px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          border: '2px solid rgba(255,255,255,0.2)',
          color: '#fff',
        }}>
          {config.cta.secondaryCTA.text}
        </span>
      </div>
    </div>
  );
}
