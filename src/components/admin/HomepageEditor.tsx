import { useState, useEffect, useCallback, useRef } from 'react';
import type { HomepageConfig } from '../../data/homepage.types';
import ImageCropModal from './ImageCropModal';
import { IMAGE_PRESETS, formatBytes, type OptimizeResult } from './imageUtils';
import HomepagePreview from './HomepagePreview';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const PRODUCTS = [
  { id: 'torr-rf', name: 'TORR RF', image: '/images/products/torr-rf.webp' },
  { id: 'ulblanc', name: 'ULBLANC', image: '/images/products/ulblanc.webp' },
  { id: 'newchae-shot', name: 'NEWCHAE SHOT', image: '/images/products/newchae-shot.webp' },
  { id: 'lumino-wave', name: 'LUMINO WAVE', image: '' },
];

// ─── Reusable UI Components ─────────────────────────────────

function Section({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="font-semibold text-slate-900 text-sm">{title}</span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-4 space-y-4 border-t border-slate-200">{children}</div>}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-vertical"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}: {value}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── File Upload with Crop Support ──────────────────────────

interface FileUploadProps {
  label: string;
  accept: string;
  mediaType: 'image' | 'video' | 'poster';
  currentUrl: string;
  onUploaded: (url: string) => void;
  cropPreset?: string;
  uploadTarget?: string;
  productId?: string;
}

function FileUpload({
  label,
  accept,
  mediaType,
  currentUrl,
  onUploaded,
  cropPreset,
  uploadTarget = 'hero',
  productId,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [optimizeInfo, setOptimizeInfo] = useState<string | null>(null);
  const [blobPreview, setBlobPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const preset = cropPreset ? IMAGE_PRESETS[cropPreset] : null;

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', mediaType);
    formData.append('target', uploadTarget);
    if (productId) formData.append('productId', productId);

    try {
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 100);

      const res = await fetch('/api/admin/homepage/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok) {
        const err = await res.json();
        alert(`Upload failed: ${err.error}`);
        return;
      }

      const data = await res.json();
      // Add cache-busting param so browser shows new image, not cached
      onUploaded(`${data.url}?t=${Date.now()}`);
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      // Keep blobPreview — the server URL still serves the old cached image
      // until the GitHub commit triggers a rebuild. The blob preview is the
      // only way to show the cropped image immediately in the editor.
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileSelected = (file: File) => {
    if (preset && file.type.startsWith('image/')) {
      setPendingFile(file);
      setShowCrop(true);
    } else {
      uploadFile(file);
    }
  };

  const handleCropApply = (result: OptimizeResult) => {
    setShowCrop(false);
    setPendingFile(null);
    setOptimizeInfo(
      `${formatBytes(result.originalSize)} → ${formatBytes(result.optimizedSize)} (${result.width}x${result.height})`
    );
    // Show cropped image immediately via blob URL
    const blobUrl = URL.createObjectURL(result.blob);
    setBlobPreview(blobUrl);
    onUploaded(blobUrl);
    uploadFile(result.file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  };

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
          }`}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <div className="space-y-2">
              <div className="text-sm text-slate-600">Uploading...</div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (blobPreview || currentUrl) ? (
            <div className="space-y-2">
              {mediaType === 'video' ? (
                <div className="text-xs text-slate-500 truncate">{currentUrl}</div>
              ) : (
                <img
                  src={blobPreview || currentUrl}
                  alt="Preview"
                  className="max-h-24 mx-auto rounded object-cover"
                />
              )}
              <div className="text-xs text-slate-400">Click or drag to replace</div>
            </div>
          ) : (
            <div className="space-y-1">
              <svg className="w-8 h-8 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-sm text-slate-600">Click or drag file</div>
              <div className="text-xs text-slate-400">{accept}</div>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelected(file);
              if (inputRef.current) inputRef.current.value = '';
            }}
          />
        </div>
        {optimizeInfo && (
          <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Optimized: {optimizeInfo}
          </div>
        )}
      </div>

      {showCrop && pendingFile && preset && (
        <ImageCropModal
          file={pendingFile}
          aspectRatio={preset.aspect}
          maxWidth={preset.maxWidth}
          maxHeight={preset.maxHeight}
          onApply={handleCropApply}
          onCancel={() => { setShowCrop(false); setPendingFile(null); }}
        />
      )}
    </>
  );
}

// ─── Main Editor Component ──────────────────────────────────

export default function HomepageEditor() {
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [detailImages, setDetailImages] = useState<Record<string, string>>({});
  const [detailStatus, setDetailStatus] = useState<Record<string, 'idle' | 'uploading' | 'applying' | 'done' | 'error'>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('hero');
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    fetch('/api/admin/homepage')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setConfig(data);
        // Load saved product image overrides from config, fallback to defaults
        const imgs: Record<string, string> = {};
        PRODUCTS.forEach((p) => {
          imgs[p.id] = data.featuredProducts?.imageOverrides?.[p.id] || p.image;
        });
        setProductImages(imgs);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load homepage config:', err);
        setLoadError(err.message || 'Failed to load');
        setLoading(false);
      });

    // Fetch product detail images
    fetch('/api/admin/products/images')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.products) {
          const imgs: Record<string, string> = {};
          for (const p of data.products) {
            if (p.mainImageUrl) imgs[p.id] = p.mainImageUrl;
          }
          setDetailImages(imgs);
        }
      })
      .catch((err) => console.error('Failed to load product detail images:', err));
  }, []);


  const update = useCallback(
    <K extends keyof HomepageConfig>(section: K, partial: Partial<HomepageConfig[K]>) => {
      setConfig((prev) => {
        if (!prev) return prev;
        return { ...prev, [section]: { ...prev[section], ...partial } };
      });
      setSaveStatus('idle');
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleSave = async () => {
    if (!config) return;
    setSaveStatus('saving');

    try {
      // Merge product image overrides into config so they persist to KV + GitHub
      const configToSave = {
        ...config,
        featuredProducts: {
          ...config.featuredProducts,
          imageOverrides: {
            ...config.featuredProducts.imageOverrides,
            ...Object.fromEntries(
              Object.entries(productImages)
                .filter(([, url]) => !url.startsWith('blob:')) // skip transient blob URLs
            ),
          },
        },
      };

      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }

      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } catch (err: any) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      alert(`Save failed: ${err.message}`);
    }
  };

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>
          Failed to Load Configuration
        </h3>
        <p style={{ fontSize: 14, color: '#64748b', maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
          Could not load homepage configuration. Please check your connection and try again.
        </p>
        {loadError && (
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
            Error: {loadError}
          </p>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: 16, padding: '8px 20px', fontSize: 14, fontWeight: 500, color: '#fff', background: '#2563eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Top Bar ── */}
      <div style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, margin: 0 }}>Homepage Editor</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {hasUnsavedChanges && (
            <span style={{ fontSize: 12, color: '#d97706', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, background: '#f59e0b', borderRadius: '50%' }} />
              Unsaved changes
            </span>
          )}
          {lastSavedAt && !hasUnsavedChanges && (
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Saved at {formatTime(lastSavedAt)}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            style={{ padding: '6px 16px', fontSize: 14, fontWeight: 500, color: '#fff', background: saveStatus === 'saving' ? '#93c5fd' : '#2563eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save'}
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none' }}
          >
            Back to Site ↗
          </a>
        </div>
      </div>

      {/* ── Main: Editor + Preview ── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left: Editor Panel */}
        <div style={{ width: 400, flexShrink: 0, overflowY: 'auto', background: '#fff', borderRight: '1px solid #e2e8f0', padding: 16 }} className="space-y-3">

          {/* ── Hero Section ── */}
          <Section title="Hero Section" isOpen={openSection === 'hero'} onToggle={() => toggleSection('hero')}>
            <SelectField
              label="Background Type"
              value={config.hero.backgroundType}
              onChange={(v) => update('hero', { backgroundType: v })}
              options={[
                { value: 'split', label: 'Model Image (Full-bleed)' },
                { value: 'image', label: 'Background Image' },
                { value: 'video', label: 'Video (MP4)' },
                { value: 'gradient', label: 'Gradient' },
              ]}
            />

            {config.hero.backgroundType === 'split' && (
              <>
                <FileUpload
                  label="Hero Image or Video (WebP/JPG/PNG/MP4, max 10MB)"
                  accept="image/webp,image/jpeg,image/png,video/mp4"
                  mediaType={config.hero.heroImage?.split('?')[0]?.endsWith('.mp4') ? 'video' : 'image'}
                  currentUrl={config.hero.heroImage || ''}
                  onUploaded={(url) => update('hero', { heroImage: url })}
                  cropPreset="hero"
                />
                {config.hero.heroImage?.split('?')[0]?.endsWith('.mp4') && (
                  <FileUpload
                    label="Video Poster Image (shown while loading)"
                    accept="image/webp,image/jpeg,image/png"
                    mediaType="poster"
                    currentUrl={config.hero.backgroundVideoPoster || ''}
                    onUploaded={(url) => update('hero', { backgroundVideoPoster: url })}
                    cropPreset="hero"
                  />
                )}
              </>
            )}

            {config.hero.backgroundType === 'image' && (
              <FileUpload
                label="Background Image (WebP/JPG/PNG, max 5MB)"
                accept="image/webp,image/jpeg,image/png"
                mediaType="image"
                currentUrl={config.hero.backgroundImage}
                onUploaded={(url) => update('hero', { backgroundImage: url })}
                cropPreset="hero"
              />
            )}

            {config.hero.backgroundType === 'video' && (
              <>
                <FileUpload
                  label="Background Video (MP4, max 50MB)"
                  accept="video/mp4"
                  mediaType="video"
                  currentUrl={config.hero.backgroundVideo}
                  onUploaded={(url) => update('hero', { backgroundVideo: url })}
                />
                <FileUpload
                  label="Video Poster Image (optional)"
                  accept="image/webp,image/jpeg,image/png"
                  mediaType="poster"
                  currentUrl={config.hero.backgroundVideoPoster}
                  onUploaded={(url) => update('hero', { backgroundVideoPoster: url })}
                  cropPreset="hero"
                />
              </>
            )}

            {config.hero.backgroundType !== 'gradient' && config.hero.backgroundType !== 'split' && (
              <>
                <NumberField
                  label="Overlay Opacity"
                  value={config.hero.overlayOpacity}
                  onChange={(v) => update('hero', { overlayOpacity: v })}
                />
                <SelectField
                  label="Overlay Color"
                  value={config.hero.overlayColor}
                  onChange={(v) => update('hero', { overlayColor: v })}
                  options={[
                    { value: 'dark', label: 'Dark' },
                    { value: 'light', label: 'Light' },
                    { value: 'primary', label: 'Primary' },
                  ]}
                />
              </>
            )}

            <TextField label="Badge Text" value={config.hero.badge} onChange={(v) => update('hero', { badge: v })} />
            <TextField label="Headline" value={config.hero.headline} onChange={(v) => update('hero', { headline: v })} />
            <TextField label="Highlight Text" value={config.hero.highlightText} onChange={(v) => update('hero', { highlightText: v })} />
            <TextField label="Subheadline" value={config.hero.subheadline} onChange={(v) => update('hero', { subheadline: v })} />
            <TextField label="Description" value={config.hero.description} onChange={(v) => update('hero', { description: v })} multiline />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Primary CTA Text"
                value={config.hero.primaryCTA.text}
                onChange={(v) => update('hero', { primaryCTA: { ...config.hero.primaryCTA, text: v } })}
              />
              <TextField
                label="Primary CTA Link"
                value={config.hero.primaryCTA.href}
                onChange={(v) => update('hero', { primaryCTA: { ...config.hero.primaryCTA, href: v } })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Secondary CTA Text"
                value={config.hero.secondaryCTA.text}
                onChange={(v) => update('hero', { secondaryCTA: { ...config.hero.secondaryCTA, text: v } })}
              />
              <TextField
                label="Secondary CTA Link"
                value={config.hero.secondaryCTA.href}
                onChange={(v) => update('hero', { secondaryCTA: { ...config.hero.secondaryCTA, href: v } })}
              />
            </div>
          </Section>

          {/* ── Trust Badges ── */}
          <Section title="Trust Badges (FDA, ISO, GMP, Patents)" isOpen={openSection === 'badges'} onToggle={() => toggleSection('badges')}>
            {config.trustBadges.badges.map((badge, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
                <div className="text-xs font-medium text-slate-500">Badge {i + 1}</div>
                <div className="grid grid-cols-3 gap-2">
                  <TextField
                    label="Label"
                    value={badge.label}
                    onChange={(v) => {
                      const badges = [...config.trustBadges.badges];
                      badges[i] = { ...badges[i], label: v };
                      update('trustBadges', { badges });
                    }}
                  />
                  <TextField
                    label="Title"
                    value={badge.title}
                    onChange={(v) => {
                      const badges = [...config.trustBadges.badges];
                      badges[i] = { ...badges[i], title: v };
                      update('trustBadges', { badges });
                    }}
                  />
                  <TextField
                    label="Subtitle"
                    value={badge.subtitle}
                    onChange={(v) => {
                      const badges = [...config.trustBadges.badges];
                      badges[i] = { ...badges[i], subtitle: v };
                      update('trustBadges', { badges });
                    }}
                  />
                </div>
              </div>
            ))}
          </Section>

          {/* ── Featured Products ── */}
          <Section title="Featured Products" isOpen={openSection === 'products'} onToggle={() => toggleSection('products')}>
            <TextField label="Section Label" value={config.featuredProducts.label} onChange={(v) => update('featuredProducts', { label: v })} />
            <TextField label="Section Title" value={config.featuredProducts.title} onChange={(v) => update('featuredProducts', { title: v })} />
            <TextField label="Section Description" value={config.featuredProducts.description} onChange={(v) => update('featuredProducts', { description: v })} multiline />
            <NumberField
              label="Display Count"
              value={config.featuredProducts.displayCount}
              onChange={(v) => update('featuredProducts', { displayCount: v })}
              min={1}
              max={6}
            />
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-600">Product Images</div>
              {PRODUCTS.filter((p) => p.image).map((product) => (
                <div key={product.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <div className="text-xs font-medium text-slate-700">{product.name}</div>
                  <FileUpload
                    label={`${product.name} Image (4:3, auto-optimized to WebP)`}
                    accept="image/webp,image/jpeg,image/png"
                    mediaType="image"
                    currentUrl={productImages[product.id] || product.image}
                    onUploaded={(url) => {
                      setProductImages((prev) => ({ ...prev, [product.id]: url }));
                    }}
                    cropPreset="product-thumb"
                    uploadTarget="product"
                    productId={product.id}
                  />
                </div>
              ))}
            </div>

            {/* ── Product Detail Images (Product Pages) ── */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-600">Product Detail Images (Product Pages)</div>
              <p className="text-xs text-slate-400">
                Main images shown on each product detail page. Upload applies immediately via GitHub commit (separate from Save).
              </p>
              {PRODUCTS.map((product) => {
                const status = detailStatus[product.id] || 'idle';
                const isComingSoon = product.id === 'lumino-wave';

                if (isComingSoon) {
                  return (
                    <div key={product.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                      <div className="text-xs font-medium text-slate-700">{product.name}</div>
                      <span className="text-xs text-slate-400 italic">Coming Soon</span>
                    </div>
                  );
                }

                return (
                  <div key={product.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-slate-700">{product.name}</div>
                      {status === 'done' && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Applied
                        </span>
                      )}
                      {status === 'applying' && (
                        <span className="text-xs text-blue-600">Applying to GitHub...</span>
                      )}
                      {status === 'error' && (
                        <span className="text-xs text-red-600">Failed</span>
                      )}
                    </div>
                    <FileUpload
                      label={`${product.name} Detail (4:3, 1200x900, auto-optimized)`}
                      accept="image/webp,image/jpeg,image/png"
                      mediaType="image"
                      currentUrl={detailImages[product.id] || ''}
                      onUploaded={async (url) => {
                        // Skip blob URLs from crop preview — wait for the actual upload
                        if (url.startsWith('blob:')) return;

                        setDetailStatus((prev) => ({ ...prev, [product.id]: 'applying' }));

                        try {
                          const res = await fetch('/api/admin/products/images', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ productId: product.id, imageUrl: url }),
                          });

                          if (!res.ok) {
                            const err = await res.json();
                            throw new Error(err.error || 'Failed');
                          }

                          setDetailImages((prev) => ({ ...prev, [product.id]: `${url}?t=${Date.now()}` }));
                          setDetailStatus((prev) => ({ ...prev, [product.id]: 'done' }));
                          setTimeout(() => {
                            setDetailStatus((prev) => ({ ...prev, [product.id]: 'idle' }));
                          }, 5000);
                        } catch (err: any) {
                          console.error(`[Detail Image] ${product.id} update failed:`, err);
                          setDetailStatus((prev) => ({ ...prev, [product.id]: 'error' }));
                        }
                      }}
                      cropPreset="product-detail"
                      uploadTarget="product"
                      productId={product.id}
                    />
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── Why BRITZMEDI ── */}
          <Section title="Why BRITZMEDI" isOpen={openSection === 'why'} onToggle={() => toggleSection('why')}>
            <TextField label="Section Label" value={config.whyBritzMedi.label} onChange={(v) => update('whyBritzMedi', { label: v })} />
            <TextField label="Section Title (use \\n for line breaks)" value={config.whyBritzMedi.title} onChange={(v) => update('whyBritzMedi', { title: v })} multiline />

            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-600">Features</div>
              {config.whyBritzMedi.features.map((feat, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <div className="text-xs font-medium text-slate-500">Feature {i + 1}</div>
                  <TextField
                    label="Title"
                    value={feat.title}
                    onChange={(v) => {
                      const features = [...config.whyBritzMedi.features];
                      features[i] = { ...features[i], title: v };
                      update('whyBritzMedi', { features });
                    }}
                  />
                  <TextField
                    label="Description"
                    value={feat.description}
                    onChange={(v) => {
                      const features = [...config.whyBritzMedi.features];
                      features[i] = { ...features[i], description: v };
                      update('whyBritzMedi', { features });
                    }}
                    multiline
                  />
                  <TextField
                    label="Icon Path (SVG d attribute)"
                    value={feat.iconPath}
                    onChange={(v) => {
                      const features = [...config.whyBritzMedi.features];
                      features[i] = { ...features[i], iconPath: v };
                      update('whyBritzMedi', { features });
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-600">Company Stats</div>
              <TextField label="Stats Title" value={config.whyBritzMedi.statsTitle} onChange={(v) => update('whyBritzMedi', { statsTitle: v })} />
              {config.whyBritzMedi.stats.map((stat, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-2">
                    <TextField
                      label="Label"
                      value={stat.label}
                      onChange={(v) => {
                        const stats = [...config.whyBritzMedi.stats];
                        stats[i] = { ...stats[i], label: v };
                        update('whyBritzMedi', { stats });
                      }}
                    />
                    <TextField
                      label="Value"
                      value={stat.value}
                      onChange={(v) => {
                        const stats = [...config.whyBritzMedi.stats];
                        stats[i] = { ...stats[i], value: v };
                        update('whyBritzMedi', { stats });
                      }}
                    />
                    <SelectField
                      label="Type"
                      value={stat.type}
                      onChange={(v) => {
                        const stats = [...config.whyBritzMedi.stats];
                        stats[i] = { ...stats[i], type: v };
                        update('whyBritzMedi', { stats });
                      }}
                      options={[
                        { value: 'number', label: 'Number' },
                        { value: 'badge', label: 'Badge' },
                      ]}
                    />
                  </div>
                  {stat.type === 'badge' && (
                    <div className="mt-2">
                      <TextField
                        label="Badge Text"
                        value={stat.badgeText || ''}
                        onChange={(v) => {
                          const stats = [...config.whyBritzMedi.stats];
                          stats[i] = { ...stats[i], badgeText: v };
                          update('whyBritzMedi', { stats });
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Learn More Text" value={config.whyBritzMedi.learnMoreText} onChange={(v) => update('whyBritzMedi', { learnMoreText: v })} />
                <TextField label="Learn More Link" value={config.whyBritzMedi.learnMoreHref} onChange={(v) => update('whyBritzMedi', { learnMoreHref: v })} />
              </div>
            </div>
          </Section>

          {/* ── Core Technologies ── */}
          <Section title="Core Technologies" isOpen={openSection === 'tech'} onToggle={() => toggleSection('tech')}>
            <TextField label="Section Label" value={config.coreTechnologies.label} onChange={(v) => update('coreTechnologies', { label: v })} />
            <TextField label="Section Title" value={config.coreTechnologies.title} onChange={(v) => update('coreTechnologies', { title: v })} />
            <TextField label="Section Description" value={config.coreTechnologies.description} onChange={(v) => update('coreTechnologies', { description: v })} multiline />
            <p className="text-xs text-slate-400">
              Individual technology data is managed in company.ts.
            </p>
          </Section>

          {/* ── CTA Section ── */}
          <Section title="CTA Section (Ready to Partner)" isOpen={openSection === 'cta'} onToggle={() => toggleSection('cta')}>
            <TextField label="Title" value={config.cta.title} onChange={(v) => update('cta', { title: v })} />
            <TextField label="Description" value={config.cta.description} onChange={(v) => update('cta', { description: v })} multiline />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Primary CTA Text"
                value={config.cta.primaryCTA.text}
                onChange={(v) => update('cta', { primaryCTA: { ...config.cta.primaryCTA, text: v } })}
              />
              <TextField
                label="Primary CTA Link"
                value={config.cta.primaryCTA.href}
                onChange={(v) => update('cta', { primaryCTA: { ...config.cta.primaryCTA, href: v } })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Secondary CTA Text"
                value={config.cta.secondaryCTA.text}
                onChange={(v) => update('cta', { secondaryCTA: { ...config.cta.secondaryCTA, text: v } })}
              />
              <TextField
                label="Secondary CTA Link"
                value={config.cta.secondaryCTA.href}
                onChange={(v) => update('cta', { secondaryCTA: { ...config.cta.secondaryCTA, href: v } })}
              />
            </div>
          </Section>

          {/* Footer */}
          {lastSavedAt && (
            <div className="text-center text-xs text-slate-400 pt-2 pb-4">
              Last saved at {formatTime(lastSavedAt)}
            </div>
          )}
        </div>

        {/* Right: Live Preview Panel */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          background: '#f1f5f9',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Viewport Switcher */}
          <div style={{
            flexShrink: 0,
            padding: '8px 16px',
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{ fontSize: 12, color: '#94a3b8', marginRight: 8 }}>Preview</span>
            {([
              { key: 'mobile' as const, label: 'Mobile', width: 375, icon: '\u{1F4F1}' },
              { key: 'tablet' as const, label: 'Tablet', width: 768, icon: '\u{1F4F1}' },
              { key: 'desktop' as const, label: 'Desktop', width: '100%', icon: '\u{1F5A5}\uFE0F' },
            ]).map((vp) => (
              <button
                key={vp.key}
                onClick={() => setViewport(vp.key)}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: viewport === vp.key ? 600 : 400,
                  color: viewport === vp.key ? '#2563eb' : '#64748b',
                  background: viewport === vp.key ? '#eff6ff' : 'transparent',
                  border: viewport === vp.key ? '1px solid #bfdbfe' : '1px solid transparent',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {vp.icon} {vp.label} {typeof vp.width === 'number' ? `(${vp.width}px)` : ''}
              </button>
            ))}
          </div>

          {/* Preview Container */}
          <div style={{ flex: 1, padding: 16, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: viewport === 'mobile' ? 375 : viewport === 'tablet' ? 768 : '100%',
              maxWidth: '100%',
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              border: '1px solid #cbd5e1',
              overflow: 'hidden',
              transition: 'width 0.3s ease',
            }}>
              <HomepagePreview config={config} productImages={productImages} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {showToast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#16a34a', color: '#fff', padding: '12px 16px', borderRadius: 8, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, zIndex: 50 }}>
          Saved! Deployment will start automatically.
        </div>
      )}
    </div>
  );
}
