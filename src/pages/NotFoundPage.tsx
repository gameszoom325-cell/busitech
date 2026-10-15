import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] p-8 space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center mx-auto shadow-xs">
          <FileQuestion className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
            ERROR 404: NOT FOUND
          </div>
          <h1 className="text-xl font-extrabold text-[var(--color-text-main)] tracking-tight">
            Document or Route Not Found
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            The contract section, obligation, or console route you requested does not exist in the active registry.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => navigate('/overview')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
