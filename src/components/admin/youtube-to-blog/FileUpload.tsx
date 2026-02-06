import { useState, useRef, useCallback } from 'react';
import type { BlogJob } from '../../../lib/youtube-to-blog/schemas';
import { ContentTypeSelect } from './ContentTypeSelect';

interface FileUploadProps {
  onJobCreated: (job: BlogJob) => void;
}

const ACCEPTED_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
};

const ACCEPT_STRING = Object.values(ACCEPTED_TYPES).join(',');

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF Document',
  docx: 'Word Document',
  pptx: 'PowerPoint Presentation',
};

export function FileUpload({ onJobCreated }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [tone, setTone] = useState('professional');
  const [wordCount, setWordCount] = useState(1500);
  const [contentType, setContentType] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileType = (f: File): string | null => {
    const ext = f.name.toLowerCase().split('.').pop();
    if (ext === 'pdf' || ext === 'docx' || ext === 'pptx') return ext;
    return null;
  };

  const handleFile = useCallback((f: File) => {
    setError('');
    const fileType = getFileType(f);
    if (!fileType) {
      setError('Unsupported file type. Please upload a PDF, DOCX, or PPTX file.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum 50MB.');
      return;
    }
    setFile(f);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tone', tone);
      formData.append('word_count', wordCount.toString());
      formData.append('content_type', contentType);

      const res = await fetch('/api/blog/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }

      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onJobCreated(data.job);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fileType = file ? getFileType(file) : null;

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Upload Document
      </label>

      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center px-6 py-10 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : file
              ? 'border-green-300 bg-green-50'
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
        />

        {file ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-green-700">
                {FILE_TYPE_LABELS[fileType || ''] || 'Document'}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="text-center">
            <svg className="w-10 h-10 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-slate-700">
              Drop file here or <span className="text-blue-600">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, DOCX, or PPTX (max 50MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content Type Detection */}
      {file && (
        <div className="mt-4">
          <ContentTypeSelect
            fileType={fileType || undefined}
            value={contentType}
            onChange={setContentType}
          />
        </div>
      )}

      {/* Advanced Options */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          Advanced Options
        </button>

        {showOptions && (
          <div className="mt-3 grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="academic">Academic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Word Count ({wordCount})
              </label>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>500</span>
                <span>5000</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !file}
        className="mt-4 w-full px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Uploading...
          </>
        ) : (
          'Upload & Generate Blog Post'
        )}
      </button>
    </form>
  );
}
