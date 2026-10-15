import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] p-8 space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-danger-bg)] text-[var(--color-danger)] flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-danger-text)]">
            ERROR 403: ACCESS RESTRICTED
          </div>
          <h1 className="text-xl font-extrabold text-[var(--color-text-main)] tracking-tight">
            Administrative Privilege Required
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Your current account (<span className="font-semibold text-[var(--color-text-main)]">{user?.email || 'Guest'}</span>) has role <span className="font-semibold">{user?.role || 'Guest'}</span>. Only authorized administrators (aspging@gmail.com, gameszoom325@gmail.com, Ayushdps2020@gmail.com) can access the governance portal.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/overview')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Overview</span>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};
