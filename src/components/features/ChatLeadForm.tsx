// Inline lead-capture card shown inside the chat widget.
//
// Before this existed the bot's only call to action was the literal text "/contact",
// which the widget did not even render as a link. On 2026-08-18 a visitor from
// Ecuador offered his email and phone, was told twice the bot "can't collect or
// forward your contact details", asked "How do I do that?" and left. Six months of
// conversations converted zero leads.
//
// It posts to the existing /api/leads endpoint (source: 'chatbot'), so lead scoring,
// disposable-email rejection, the repeat-inquiry merge, Slack and the admin
// notification all work exactly as they do for the website form.

import { useState } from 'react';

export interface ChatLeadFormProps {
  /** Recent conversation text, attached to the lead so sales has the context. */
  transcript: string;
  /** 'distributor' when the visitor asked about distribution/partnership. */
  inquiryType: 'distributor' | 'product_info';
  onSubmitted: () => void;
  onDismiss: () => void;
}

const PRODUCTS = [
  { value: 'torr-rf', label: 'TORR RF' },
  { value: 'ulblanc', label: 'ULBLANC' },
  { value: 'newchae-shot', label: 'NEWCHAE SHOT' },
  { value: 'lumino-wave', label: 'LUMINO WAVE' },
];

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400';

export default function ChatLeadForm({ transcript, inquiryType, onSubmitted, onDismiss }: ChatLeadFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [company, setCompany] = useState('');
  const [product, setProduct] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim() && email.trim() && country.trim() && !submitting;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'chatbot',
          contact_name: name.trim(),
          email: email.trim(),
          country: country.trim(),
          company_name: company.trim() || undefined,
          interested_products: product ? [product] : [],
          inquiry_type: inquiryType,
          message: transcript.slice(0, 2000),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      onSubmitted();
    } catch {
      setError('Network error. Please try again, or email sh.lee@britzmedi.com.');
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-primary-200 bg-primary-50/70 p-3 space-y-2"
      aria-label="Leave your contact details"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-primary-800">
          Want our team to get back to you?
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 text-primary-400 hover:text-primary-700"
          aria-label="Dismiss contact form"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <input
        className={inputClass}
        placeholder="Your name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
        required
      />
      <input
        className={inputClass}
        type="email"
        placeholder="Business email *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <input
        className={inputClass}
        placeholder="Country *"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        autoComplete="country-name"
        required
      />
      <input
        className={inputClass}
        placeholder="Company (optional)"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        autoComplete="organization"
      />
      <select
        className={inputClass}
        value={product}
        onChange={(e) => setProduct(e.target.value)}
        aria-label="Product of interest"
      >
        <option value="">Product of interest (optional)</option>
        {PRODUCTS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting ? 'Sending…' : 'Send to the BRITZMEDI team'}
      </button>

      <p className="text-[11px] leading-snug text-slate-500">
        We use these details only to answer your enquiry. See our{' '}
        <a href="/privacy" className="underline" target="_blank" rel="noopener noreferrer">privacy policy</a>.
      </p>
    </form>
  );
}
