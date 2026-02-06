import { useState } from 'react';

const CATEGORIES = [
  { id: 'medical-devices', label: 'Medical Devices' },
  { id: 'aesthetics', label: 'Aesthetics' },
  { id: 'company-news', label: 'Company News' },
  { id: 'industry-insights', label: 'Industry Insights' },
];

interface SubscribeFormProps {
  language?: string;
  compact?: boolean;
}

export default function SubscribeForm({ language = 'en', compact = false }: SubscribeFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const toggleCategory = (id: string) => {
    setCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribers/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, language, categories }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
        setName('');
        setCategories([]);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
        <svg className="w-10 h-10 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-green-800 font-medium">{message}</p>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
        {status === 'error' && (
          <p className="text-red-600 text-xs mt-1">{message}</p>
        )}
      </form>
    );
  }

  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-1">Stay Updated</h3>
      <p className="text-sm text-slate-500 mb-4">
        Get notified when we publish new articles on medical aesthetics technology.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address *"
            required
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name (optional)"
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-2">Interests (optional):</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  categories.includes(cat.id)
                    ? 'bg-primary-100 border-primary-300 text-primary-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {status === 'error' && (
          <p className="text-red-600 text-sm">{message}</p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe to Updates'}
        </button>

        <p className="text-xs text-slate-400 text-center">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </form>
    </div>
  );
}
