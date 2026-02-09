import { useState, useEffect, useCallback, useRef } from 'react';
import type { HomepageConfig, TrustBadge, WhyFeature, CompanyStat } from '../../data/homepage.types';
import ImageCropModal from './ImageCropModal';
import { IMAGE_PRESETS, formatBytes, type OptimizeResult } from './imageUtils';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type PreviewMode = 'desktop' | 'tablet' | 'mobile';

const PREVIEW_VIEWPORTS: Record<PreviewMode, { width: number; label: string }> = {
  desktop: { width: 1440, label: 'Desktop' },
  tablet: { width: 768, label: 'Tablet' },
  mobile: { width: 375, label: 'Mobile' },
};

// Known products (from products.ts)
const PRODUCTS = [
  { id: 'torr-rf', name: 'TORR RF', image: '/images/products/torr-rf.webp' },
  { id: 'ulblanc', name: 'ULBLANC', image: '/images/products/ulblanc.webp' },
  { id: 'newchae-shot', name: 'NEWCHAE SHOT', image: '/images/products/newchae-shot.webp' },
];

// ─── Reusable UI Components ─────────────────────────────────

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="font-semibold text-slate-900 text-sm">{title}</span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="p-4 space-y-4 border-t border-slate-200">{children}</div>}
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
  cropPreset?: string; // key from IMAGE_PRESETS
  uploadTarget?: string; // 'hero' | 'product'
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
      onUploaded(data.url);
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
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
          ) : currentUrl ? (
            <div className="space-y-2">
              {mediaType === 'video' ? (
                <div className="text-xs text-slate-500 truncate">{currentUrl}</div>
              ) : (
                <img
                  src={currentUrl}
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [showPreview, setShowPreview] = useState(true);
  const [previewScale, setPreviewScale] = useState(0.5);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Load config on mount
  useEffect(() => {
    fetch('/api/admin/homepage')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load homepage config:', err);
        setLoading(false);
      });

    // Initialize product images
    const imgs: Record<string, string> = {};
    PRODUCTS.forEach((p) => { imgs[p.id] = p.image; });
    setProductImages(imgs);
  }, []);

  // Calculate preview scale based on container width
  useEffect(() => {
    if (!showPreview) return;
    const container = previewContainerRef.current;
    if (!container) return;

    const updateScale = () => {
      const cw = container.clientWidth - 32;
      const vw = PREVIEW_VIEWPORTS[previewMode].width;
      setPreviewScale(Math.min(cw / vw, 1));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [showPreview, previewMode]);

  // Helper to update nested config
  const update = useCallback(
    <K extends keyof HomepageConfig>(section: K, partial: Partial<HomepageConfig[K]>) => {
      setConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [section]: { ...prev[section], ...partial },
        };
      });
      setSaveStatus('idle');
    },
    []
  );

  // Save handler
  const handleSave = async () => {
    if (!config) return;
    setSaveStatus('saving');

    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }

      setSaveStatus('saved');
      setTimeout(() => {
        iframeRef.current?.contentWindow?.location.reload();
      }, 500);
    } catch (err: any) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      alert(`Save failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        Failed to load homepage configuration.
      </div>
    );
  }

  const iframeW = PREVIEW_VIEWPORTS[previewMode].width;
  const iframeH = Math.max(iframeW * 2.5, 2000);
  const frameW = previewMode === 'mobile' ? iframeW * previewScale + 24 : iframeW * previewScale;

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left: Editor Panel */}
      <div className={`${showPreview ? 'w-[480px]' : 'flex-1'} shrink-0 border-r border-slate-200 flex flex-col bg-white`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900 text-sm">Homepage Editor</h2>
          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-600">Save failed</span>
            )}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-1.5 rounded-lg transition-colors ${showPreview ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100'}`}
              title={showPreview ? 'Hide Preview' : 'Show Preview'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showPreview ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
            </button>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Scrollable sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* ── Hero Section ── */}
          <Section title="Hero Section" defaultOpen>
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
              <FileUpload
                label="Hero Model Image (PNG/WebP, max 5MB)"
                accept="image/webp,image/jpeg,image/png"
                mediaType="image"
                currentUrl={config.hero.heroImage || ''}
                onUploaded={(url) => update('hero', { heroImage: url })}
                cropPreset="hero"
              />
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

            <TextField
              label="Badge Text"
              value={config.hero.badge}
              onChange={(v) => update('hero', { badge: v })}
            />
            <TextField
              label="Headline"
              value={config.hero.headline}
              onChange={(v) => update('hero', { headline: v })}
            />
            <TextField
              label="Highlight Text"
              value={config.hero.highlightText}
              onChange={(v) => update('hero', { highlightText: v })}
            />
            <TextField
              label="Subheadline"
              value={config.hero.subheadline}
              onChange={(v) => update('hero', { subheadline: v })}
            />
            <TextField
              label="Description"
              value={config.hero.description}
              onChange={(v) => update('hero', { description: v })}
              multiline
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Primary CTA Text"
                value={config.hero.primaryCTA.text}
                onChange={(v) =>
                  update('hero', { primaryCTA: { ...config.hero.primaryCTA, text: v } })
                }
              />
              <TextField
                label="Primary CTA Link"
                value={config.hero.primaryCTA.href}
                onChange={(v) =>
                  update('hero', { primaryCTA: { ...config.hero.primaryCTA, href: v } })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Secondary CTA Text"
                value={config.hero.secondaryCTA.text}
                onChange={(v) =>
                  update('hero', { secondaryCTA: { ...config.hero.secondaryCTA, text: v } })
                }
              />
              <TextField
                label="Secondary CTA Link"
                value={config.hero.secondaryCTA.href}
                onChange={(v) =>
                  update('hero', { secondaryCTA: { ...config.hero.secondaryCTA, href: v } })
                }
              />
            </div>
          </Section>

          {/* ── Trust Badges ── */}
          <Section title="Trust Badges (FDA, ISO, GMP, Patents)">
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
          <Section title="Featured Products">
            <TextField
              label="Section Label"
              value={config.featuredProducts.label}
              onChange={(v) => update('featuredProducts', { label: v })}
            />
            <TextField
              label="Section Title"
              value={config.featuredProducts.title}
              onChange={(v) => update('featuredProducts', { title: v })}
            />
            <TextField
              label="Section Description"
              value={config.featuredProducts.description}
              onChange={(v) => update('featuredProducts', { description: v })}
              multiline
            />
            <NumberField
              label="Display Count"
              value={config.featuredProducts.displayCount}
              onChange={(v) => update('featuredProducts', { displayCount: v })}
              min={1}
              max={6}
            />

            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-600">Product Images</div>
              {PRODUCTS.map((product) => (
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
          </Section>

          {/* ── Why BRITZMEDI ── */}
          <Section title="Why BRITZMEDI">
            <TextField
              label="Section Label"
              value={config.whyBritzMedi.label}
              onChange={(v) => update('whyBritzMedi', { label: v })}
            />
            <TextField
              label="Section Title (use \\n for line breaks)"
              value={config.whyBritzMedi.title}
              onChange={(v) => update('whyBritzMedi', { title: v })}
              multiline
            />

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
              <TextField
                label="Stats Title"
                value={config.whyBritzMedi.statsTitle}
                onChange={(v) => update('whyBritzMedi', { statsTitle: v })}
              />
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
                <TextField
                  label="Learn More Text"
                  value={config.whyBritzMedi.learnMoreText}
                  onChange={(v) => update('whyBritzMedi', { learnMoreText: v })}
                />
                <TextField
                  label="Learn More Link"
                  value={config.whyBritzMedi.learnMoreHref}
                  onChange={(v) => update('whyBritzMedi', { learnMoreHref: v })}
                />
              </div>
            </div>
          </Section>

          {/* ── Core Technologies ── */}
          <Section title="Core Technologies">
            <TextField
              label="Section Label"
              value={config.coreTechnologies.label}
              onChange={(v) => update('coreTechnologies', { label: v })}
            />
            <TextField
              label="Section Title"
              value={config.coreTechnologies.title}
              onChange={(v) => update('coreTechnologies', { title: v })}
            />
            <TextField
              label="Section Description"
              value={config.coreTechnologies.description}
              onChange={(v) => update('coreTechnologies', { description: v })}
              multiline
            />
            <p className="text-xs text-slate-400">
              Individual technology data is managed in company.ts.
            </p>
          </Section>

          {/* ── CTA Section ── */}
          <Section title="CTA Section (Ready to Partner)">
            <TextField
              label="Title"
              value={config.cta.title}
              onChange={(v) => update('cta', { title: v })}
            />
            <TextField
              label="Description"
              value={config.cta.description}
              onChange={(v) => update('cta', { description: v })}
              multiline
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Primary CTA Text"
                value={config.cta.primaryCTA.text}
                onChange={(v) =>
                  update('cta', { primaryCTA: { ...config.cta.primaryCTA, text: v } })
                }
              />
              <TextField
                label="Primary CTA Link"
                value={config.cta.primaryCTA.href}
                onChange={(v) =>
                  update('cta', { primaryCTA: { ...config.cta.primaryCTA, href: v } })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Secondary CTA Text"
                value={config.cta.secondaryCTA.text}
                onChange={(v) =>
                  update('cta', { secondaryCTA: { ...config.cta.secondaryCTA, text: v } })
                }
              />
              <TextField
                label="Secondary CTA Link"
                value={config.cta.secondaryCTA.href}
                onChange={(v) =>
                  update('cta', { secondaryCTA: { ...config.cta.secondaryCTA, href: v } })
                }
              />
            </div>
          </Section>
        </div>
      </div>

      {/* Right: Preview Panel */}
      {showPreview && (
        <div className="flex-1 bg-slate-100 flex flex-col min-w-0">
          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-slate-500 mr-2">Preview</span>
              {(['desktop', 'tablet', 'mobile'] as PreviewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPreviewMode(mode)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                    previewMode === mode
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                  title={`${PREVIEW_VIEWPORTS[mode].label} (${PREVIEW_VIEWPORTS[mode].width}px)`}
                >
                  {mode === 'desktop' && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  {mode === 'tablet' && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  {mode === 'mobile' && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  {PREVIEW_VIEWPORTS[mode].label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{Math.round(previewScale * 100)}%</span>
              <button
                onClick={() => iframeRef.current?.contentWindow?.location.reload()}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Preview viewport */}
          <div ref={previewContainerRef} className="flex-1 overflow-auto p-4">
            <div className="mx-auto" style={{ width: frameW }}>
              <div className={previewMode === 'mobile' ? 'bg-slate-800 rounded-[2.5rem] p-3 shadow-2xl' : ''}>
                {previewMode === 'mobile' && (
                  <div className="flex justify-center py-1.5">
                    <div className="w-16 h-3.5 bg-slate-900 rounded-full" />
                  </div>
                )}
                <div
                  className={`overflow-hidden ${
                    previewMode === 'mobile'
                      ? 'rounded-[1.5rem]'
                      : 'rounded-lg shadow-lg border border-slate-300'
                  }`}
                  style={{ height: iframeH * previewScale }}
                >
                  <iframe
                    ref={iframeRef}
                    src="/"
                    title="Homepage Preview"
                    className="bg-white"
                    style={{
                      width: iframeW,
                      height: iframeH,
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top left',
                      border: 'none',
                    }}
                  />
                </div>
                {previewMode === 'mobile' && (
                  <div className="flex justify-center py-1.5">
                    <div className="w-10 h-1 bg-slate-600 rounded-full" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
