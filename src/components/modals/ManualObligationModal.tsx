import React, { useState } from 'react';
import { X, CheckSquare } from 'lucide-react';
import { Obligation, ObligationCategory, RiskLevel } from '../../types';
import { MOCK_CONTRACTS } from '../../data/mockData';
import { useToast } from '../../context/ToastContext';

interface ManualObligationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (obligation: Omit<Obligation, 'id'>) => void;
}

export const ManualObligationModal: React.FC<ManualObligationModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [contractId, setContractId] = useState(MOCK_CONTRACTS[0]?.id || '');
  const [clauseRef, setClauseRef] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<ObligationCategory>('Compliance');
  const [risk, setRisk] = useState<RiskLevel>('Medium');
  const [ownerName, setOwnerName] = useState('Alex Chen');
  const [responsibleParty, setResponsibleParty] = useState('Acme Corp (Us)');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!clauseRef.trim()) errs.clauseRef = 'Clause reference is required';
    if (!dueDate) errs.dueDate = 'Due date is required';
    if (!description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedContract = MOCK_CONTRACTS.find(c => c.id === contractId);

    const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    onAdd({
      title: title.trim(),
      clauseRef: clauseRef.trim(),
      description: description.trim(),
      contractId,
      contractName: selectedContract?.name || 'Custom Agreement',
      ownerName,
      ownerAvatar: ownerName.split(' ').map(n => n[0]).join('').toUpperCase(),
      dueDate,
      dueDateFormatted: formattedDate,
      status: 'Pending',
      risk,
      category,
      responsibleParty,
      verificationStatus: 'Verified'
    });

    showToast('Manual obligation created successfully', 'success');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl sm:rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-dropdown)] flex flex-col max-h-[90dvh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--color-border)] shrink-0 min-h-[48px]">
          <div className="flex items-center gap-2 min-w-0">
            <CheckSquare className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
            <h3 className="text-sm font-bold text-[var(--color-text-main)] truncate">Add Manual Obligation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-text-subtle)] hover:text-[var(--color-text-main)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Form Body - Internally scrollable */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
              Task / Obligation Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Deliver Annual SOC2 Type II Audit Report"
              className="w-full px-3 py-2.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] focus:outline-hidden focus:border-[var(--color-primary)] min-h-[44px]"
            />
            {errors.title && <p className="text-[11px] text-[var(--color-danger-text)] mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
                Related Contract
              </label>
              <select
                value={contractId}
                onChange={e => setContractId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] focus:outline-hidden min-h-[44px]"
              >
                {MOCK_CONTRACTS.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
                Clause Reference *
              </label>
              <input
                type="text"
                value={clauseRef}
                onChange={e => setClauseRef(e.target.value)}
                placeholder="e.g. Clause §9.4"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] focus:outline-hidden min-h-[44px]"
              />
              {errors.clauseRef && <p className="text-[11px] text-[var(--color-danger-text)] mt-1">{errors.clauseRef}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ObligationCategory)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] focus:outline-hidden min-h-[44px]"
              >
                <option value="Compliance">Compliance</option>
                <option value="Reporting">Reporting</option>
                <option value="Payment">Payment</option>
                <option value="Delivery">Delivery</option>
                <option value="Inspection">Inspection</option>
                <option value="SLA">SLA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
                Risk Tier
              </label>
              <select
                value={risk}
                onChange={e => setRisk(e.target.value as RiskLevel)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] focus:outline-hidden min-h-[44px]"
              >
                <option value="High">High Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] focus:outline-hidden min-h-[44px]"
              />
              {errors.dueDate && <p className="text-[11px] text-[var(--color-danger-text)] mt-1">{errors.dueDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
                Assignee / Owner
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] focus:outline-hidden min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
                Responsible Party
              </label>
              <select
                value={responsibleParty}
                onChange={e => setResponsibleParty(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] focus:outline-hidden min-h-[44px]"
              >
                <option value="Acme Corp (Us)">Acme Corp (Us)</option>
                <option value="Mutual">Mutual</option>
                <option value="Counterparty (Stripe)">Counterparty (Stripe)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-main)] mb-1">
              Description & Verification Notes *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detail the exact contractual requirement..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-input)] text-[var(--color-text-main)] focus:outline-hidden focus:border-[var(--color-primary)] resize-none"
            />
            {errors.description && (
              <p className="text-[11px] text-[var(--color-danger-text)] mt-1">{errors.description}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)] pb-[var(--safe-bottom)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs min-h-[44px]"
            >
              Save Obligation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
