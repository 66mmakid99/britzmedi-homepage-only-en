// YouTubePipelineProgress — 6-step vertical progress indicator for YouTube-to-Blog pipeline

interface StepState {
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

interface Props {
  steps: Record<string, StepState>;
  overallProgress: number;
}

const STEPS = [
  { key: 'extract', label: 'Extract Transcript', desc: 'Fetching YouTube transcript' },
  { key: 'translate', label: 'Translate', desc: 'Translating to English' },
  { key: 'generate', label: 'Generate Article', desc: 'AI writing blog post' },
  { key: 'research', label: 'Research', desc: 'Finding expert sources' },
  { key: 'image', label: 'Generate Images', desc: 'Creating featured & content images' },
  { key: 'finalize', label: 'Finalize', desc: 'Completing blog post' },
] as const;

function StepIcon({ status }: { status: StepState['status'] }) {
  if (status === 'completed') {
    return (
      <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === 'running') {
    return (
      <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  // pending
  return (
    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-slate-400" />
    </div>
  );
}

export function YouTubePipelineProgress({ steps, overallProgress }: Props) {
  return (
    <div className="space-y-4">
      {/* Overall progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-600">Overall Progress</span>
          <span className="text-xs font-semibold text-slate-700">{Math.round(overallProgress)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="space-y-1">
        {STEPS.map((step, i) => {
          const state = steps[step.key] || { status: 'pending' as const };
          const isLast = i === STEPS.length - 1;

          return (
            <div key={step.key} className="flex items-start gap-3">
              {/* Icon + connector line */}
              <div className="flex flex-col items-center">
                <StepIcon status={state.status} />
                {!isLast && (
                  <div className={`w-0.5 h-6 mt-0.5 ${
                    state.status === 'completed' ? 'bg-green-300' : 'bg-slate-200'
                  }`} />
                )}
              </div>

              {/* Label + description */}
              <div className="pt-0.5 min-w-0">
                <p className={`text-sm font-medium leading-tight ${
                  state.status === 'running' ? 'text-yellow-700' :
                  state.status === 'completed' ? 'text-green-700' :
                  state.status === 'failed' ? 'text-red-700' :
                  'text-slate-500'
                }`}>
                  {step.label}
                </p>
                {state.status === 'running' && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{step.desc}</p>
                )}
                {state.status === 'failed' && state.error && (
                  <p className="text-[11px] text-red-500 mt-0.5 line-clamp-2">{state.error}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
