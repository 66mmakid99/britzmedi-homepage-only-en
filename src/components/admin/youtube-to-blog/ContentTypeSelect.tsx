interface ContentTypeSelectProps {
  fileType?: string;
  value: string;
  onChange: (value: string) => void;
}

const CONTENT_TYPES = [
  { value: 'auto', label: 'Auto-detect', desc: 'Automatically detect document type' },
  { value: 'presentation', label: 'Presentation / Slides', desc: 'Conference talks, product demos' },
  { value: 'paper', label: 'Academic / Clinical Paper', desc: 'Research papers, clinical studies' },
  { value: 'whitepaper', label: 'Whitepaper / Report', desc: 'Industry reports, market analysis' },
];

export function ContentTypeSelect({ fileType, value, onChange }: ContentTypeSelectProps) {
  // Auto-detect hint based on file extension
  const autoHint = fileType === 'pptx'
    ? '(will detect as Presentation)'
    : fileType === 'pdf'
      ? '(will analyze content to detect)'
      : '(will analyze content to detect)';

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-2">
        Document Type
      </label>
      <div className="grid grid-cols-2 gap-2">
        {CONTENT_TYPES.map(ct => (
          <button
            key={ct.value}
            type="button"
            onClick={() => onChange(ct.value)}
            className={`p-3 rounded-lg border text-left transition-all ${
              value === ct.value
                ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <span className={`text-xs font-semibold block ${
              value === ct.value ? 'text-blue-700' : 'text-slate-800'
            }`}>
              {ct.label}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {ct.value === 'auto' ? `${ct.desc} ${autoHint}` : ct.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
