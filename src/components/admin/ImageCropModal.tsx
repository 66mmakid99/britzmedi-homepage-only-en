import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { cropAndOptimize, formatBytes, type CropArea, type OptimizeResult } from './imageUtils';

interface Props {
  file: File;
  aspectRatio?: number;
  maxWidth: number;
  maxHeight: number;
  onApply: (result: OptimizeResult) => void;
  onCancel: () => void;
}

export default function ImageCropModal({
  file,
  aspectRatio,
  maxWidth,
  maxHeight,
  onApply,
  onCancel,
}: Props) {
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    // Set initial crop to center, covering most of the image
    const { naturalWidth, naturalHeight } = img;
    const displayW = img.width;
    const displayH = img.height;

    if (aspectRatio) {
      const imgAspect = naturalWidth / naturalHeight;
      let cropW: number, cropH: number;

      if (imgAspect > aspectRatio) {
        cropH = displayH * 0.9;
        cropW = cropH * aspectRatio;
      } else {
        cropW = displayW * 0.9;
        cropH = cropW / aspectRatio;
      }

      const x = (displayW - cropW) / 2;
      const y = (displayH - cropH) / 2;
      const initialCrop = {
        unit: 'px' as const,
        x,
        y,
        width: cropW,
        height: cropH,
      };

      setCrop(initialCrop);
      // Also set completedCrop so "Apply Crop" works without manual adjustment
      setCompletedCrop({
        unit: 'px',
        x,
        y,
        width: cropW,
        height: cropH,
      });
    }
  }, [aspectRatio]);

  const generatePreview = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const cropArea: CropArea = {
      x: Math.round(completedCrop.x * scaleX),
      y: Math.round(completedCrop.y * scaleY),
      width: Math.round(completedCrop.width * scaleX),
      height: Math.round(completedCrop.height * scaleY),
    };

    try {
      const result = await cropAndOptimize(file, cropArea, 300, 225, 0.7);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(result.blob));
    } catch {
      // Preview generation failed silently
    }
  }, [completedCrop, file, previewUrl]);

  const handleApply = async () => {
    setProcessing(true);
    try {
      const img = imgRef.current;
      let cropArea: CropArea | null = null;

      if (completedCrop && img) {
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;

        cropArea = {
          x: Math.round(completedCrop.x * scaleX),
          y: Math.round(completedCrop.y * scaleY),
          width: Math.round(completedCrop.width * scaleX),
          height: Math.round(completedCrop.height * scaleY),
        };
      }

      const result = await cropAndOptimize(file, cropArea, maxWidth, maxHeight, 0.8);
      onApply(result);
    } catch (err) {
      alert('Image processing failed. Please try again.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleSkipCrop = async () => {
    setProcessing(true);
    try {
      const result = await cropAndOptimize(file, null, maxWidth, maxHeight, 0.8);
      onApply(result);
    } catch (err) {
      alert('Image processing failed.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-slate-900">Crop & Optimize Image</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {file.name} ({formatBytes(file.size)}) → Target: {maxWidth}x{maxHeight}
              {aspectRatio ? ` (${aspectRatio > 1 ? Math.round(aspectRatio * 3) + ':3' : 'free'})` : ''}
            </p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          <div className="flex gap-5">
            {/* Crop area */}
            <div className="flex-1 min-w-0">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => {
                  setCompletedCrop(c);
                  // Debounce preview
                  setTimeout(generatePreview, 200);
                }}
                aspect={aspectRatio}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop source"
                  onLoad={onImageLoad}
                  style={{ maxHeight: '60vh', maxWidth: '100%' }}
                />
              </ReactCrop>
            </div>

            {/* Preview */}
            <div className="w-48 shrink-0">
              <div className="text-xs font-medium text-slate-600 mb-2">Preview</div>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 aspect-[4/3]">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    Adjust crop to preview
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-slate-500 space-y-1">
                <div>Original: {formatBytes(file.size)}</div>
                <div>Target: {maxWidth}x{maxHeight} WebP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            onClick={handleSkipCrop}
            disabled={processing}
            className="text-sm text-slate-600 hover:text-slate-800 disabled:opacity-50"
          >
            Skip Crop (optimize only)
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={processing}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={processing}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
            >
              {processing ? 'Processing...' : 'Apply Crop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
