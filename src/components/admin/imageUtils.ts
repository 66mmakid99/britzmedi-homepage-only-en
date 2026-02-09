// Client-side image optimization using Canvas API

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImagePreset {
  label: string;
  maxWidth: number;
  maxHeight: number;
  aspect?: number; // e.g., 4/3, 16/9
}

export const IMAGE_PRESETS: Record<string, ImagePreset> = {
  'product-thumb': { label: 'Product Card (4:3)', maxWidth: 600, maxHeight: 450, aspect: 4 / 3 },
  'product-detail': { label: 'Product Detail', maxWidth: 1200, maxHeight: 900, aspect: 4 / 3 },
  'hero': { label: 'Hero Background (16:9)', maxWidth: 1920, maxHeight: 1080, aspect: 16 / 9 },
  'blog-thumb': { label: 'Blog Thumbnail (16:9)', maxWidth: 800, maxHeight: 450, aspect: 16 / 9 },
};

export interface OptimizeResult {
  blob: Blob;
  file: File;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export async function cropAndOptimize(
  sourceFile: File,
  crop: CropArea | null,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8,
): Promise<OptimizeResult> {
  const url = URL.createObjectURL(sourceFile);

  try {
    const img = await loadImage(url);

    // Source area (crop or full image)
    const sx = crop ? crop.x : 0;
    const sy = crop ? crop.y : 0;
    const sw = crop ? crop.width : img.naturalWidth;
    const sh = crop ? crop.height : img.naturalHeight;

    // Calculate target dimensions maintaining aspect ratio
    let tw = sw;
    let th = sh;

    if (tw > maxWidth) {
      th = (maxWidth / tw) * th;
      tw = maxWidth;
    }
    if (th > maxHeight) {
      tw = (maxHeight / th) * tw;
      th = maxHeight;
    }

    tw = Math.round(tw);
    th = Math.round(th);

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    // Use high-quality resampling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);

    // Try WebP first, fall back to JPEG
    const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg';
    const ext = supportsWebP ? 'webp' : 'jpg';

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
        mimeType,
        quality,
      );
    });

    const baseName = sourceFile.name.replace(/\.[^.]+$/, '');
    const file = new File([blob], `${baseName}.${ext}`, { type: mimeType });

    return {
      blob,
      file,
      width: tw,
      height: th,
      originalSize: sourceFile.size,
      optimizedSize: blob.size,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
