import { useState, useRef, useEffect } from 'react';

interface Resource {
  id: string;
  title: string;
  driveUrl: string;
}

interface Props {
  resources: Resource[];
}

const personalEmailDomains = [
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.co.jp',
  'hotmail.com', 'hotmail.co.uk',
  'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'aol.com', 'zoho.com', 'mail.com',
  'gmx.com', 'gmx.net',
  'yandex.com', 'yandex.ru',
  'qq.com', '163.com', '126.com',
  'naver.com', 'hanmail.net', 'daum.net',
];

function validateBusinessEmail(email: string): { valid: boolean; message?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }
  const domain = email.split('@')[1]?.toLowerCase();
  if (personalEmailDomains.includes(domain)) {
    return { valid: false, message: 'Please use your business email address.' };
  }
  return { valid: true };
}

export default function ResourceGateModal({ resources }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const resourceMap = useRef(new Map(resources.map(r => [r.id, r])));

  useEffect(() => {
    const handleClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-gate-resource-id]') as HTMLElement;
      if (!btn) return;
      const resourceId = btn.getAttribute('data-gate-resource-id');
      if (!resourceId) return;
      e.preventDefault();
      const resource = resourceMap.current.get(resourceId);
      if (resource) {
        setSelectedResource(resource);
        setError('');
        setIsOpen(true);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    const emailResult = validateBusinessEmail(email.trim());
    if (!emailResult.valid) {
      setError(emailResult.message || 'Invalid email.');
      return;
    }

    if (!company.trim() || company.trim().length < 2) {
      setError('Please enter your company name.');
      return;
    }

    if (!selectedResource) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/resource-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim(),
          resource_id: selectedResource.id,
          resource_title: selectedResource.title,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
        setIsOpen(false);
        setName('');
        setEmail('');
        setCompany('');
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError('');
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-black/50"
      onClose={handleClose}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Download Resource</h3>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {selectedResource && (
          <p className="text-sm text-slate-600 mb-6 pb-4 border-b border-slate-100">
            {selectedResource.title}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="gate-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="gate-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900 placeholder-slate-400 transition-shadow text-sm"
            />
          </div>

          <div>
            <label htmlFor="gate-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Business Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="gate-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900 placeholder-slate-400 transition-shadow text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">Please use your company email address</p>
          </div>

          <div>
            <label htmlFor="gate-company" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="gate-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your Company Name"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-slate-900 placeholder-slate-400 transition-shadow text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Now
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
