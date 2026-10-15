import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle2,
  X,
  Shield,
  Layers,
  Calendar,
  Kanban,
  Loader2,
  FolderOpen,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface UploadedFileInfo {
  name: string;
  size: string;
  type: string;
  rawSize: number;
}

export const UploadContractPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<UploadedFileInfo | null>({
    name: 'Stripe_Enterprise_Master_Services_Agreement_2025.pdf',
    size: '3.4 MB',
    type: 'application/pdf',
    rawSize: 3400000
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB max

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (selectedFile: File) => {
    setErrorMessage(null);

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File exceeds 15 MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB).`);
      showToast('File too large: max size is 15 MB', 'error');
      return;
    }

    const validExtensions = ['.pdf', '.docx', '.pptx', '.txt', '.png', '.jpg', '.jpeg'];
    const hasValidExt = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMessage('Unsupported format. Accepted: PDF, DOCX, PPTX, TXT, PNG, JPG.');
      showToast('Unsupported file type', 'error');
      return;
    }

    const sizeFormatted =
      selectedFile.size > 1024 * 1024
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(selectedFile.size / 1024).toFixed(0)} KB`;

    setFile({
      name: selectedFile.name,
      size: sizeFormatted,
      type: selectedFile.type,
      rawSize: selectedFile.size
    });

    showToast(`Loaded ${selectedFile.name}`, 'success');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    setIsAnalyzing(true);
    showToast('Extracting contractual obligations & deadlines...', 'info');

    setTimeout(() => {
      setIsAnalyzing(false);
      navigate('/contracts/ctr_stripe_msa/analysis');
    }, 1200);
  };

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-5 sm:space-y-6 w-full min-w-0">
      {/* Header */}
      <div>
        <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[var(--color-primary-text)] uppercase mb-1">
          CONTRACTS / UPLOAD NEW
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight truncate">
          Upload Contract
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 break-words">
          Upload your agreement to extract key obligations, deadlines, and suggested workflows.
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 min-w-0">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Dashed Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 sm:p-8 md:p-12 text-center flex flex-col items-center justify-center transition-colors ${
            isDragging
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
              : 'border-[var(--color-border-hover)] bg-[var(--color-bg-card-subtle)] hover:border-[var(--color-primary)]'
          }`}
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary-text)] flex items-center justify-center mb-3 sm:mb-4 shrink-0">
            <Upload className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          </div>

          <h3 className="text-xs sm:text-sm md:text-base font-bold text-[var(--color-text-main)] max-w-sm">
            Drag & drop your contract here, or browse files
          </h3>
          <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] mt-1 max-w-md break-words">
            Supports PDF, DOCX, PPTX, TXT, and PNG/JPG document scans up to 15 MB
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 sm:mt-5 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors shadow-xs min-h-[44px]"
          >
            <FolderOpen className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
            <span>Choose File</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 text-xs text-[var(--color-danger-text)] bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] rounded-lg">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="break-words">{errorMessage}</span>
          </div>
        )}

        {/* Selected File Row */}
        {file && (
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--color-text-main)] truncate">
                  {file.name}
                  <span className="text-[var(--color-text-subtle)] font-normal ml-1.5">({file.size})</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[var(--color-success-text)] font-medium mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>READY FOR EXTRACTION</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setErrorMessage(null);
              }}
              className="p-2 rounded-md text-[var(--color-text-subtle)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Remove file"
              aria-label="Remove file"
            >
              <X className="w-4 h-4 shrink-0" />
            </button>
          </div>
        )}

        {/* Three Feature Tiles: 1 col on mobile, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 sm:p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-main)]">
              <Layers className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <span>Extraction</span>
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1 truncate">
              Obligations & SLAs
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-main)] truncate">
                <Calendar className="w-4 h-4 text-[var(--color-info)] shrink-0" />
                <span className="truncate">Milestones</span>
              </div>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[var(--color-neutral-chip-bg)] text-[var(--color-neutral-chip-text)] font-semibold shrink-0">
                Planned
              </span>
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1 truncate">
              Deadline reminders
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-main)] truncate">
                <Kanban className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                <span className="truncate">Workflows</span>
              </div>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[var(--color-neutral-chip-bg)] text-[var(--color-neutral-chip-text)] font-semibold shrink-0">
                Planned
              </span>
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1 truncate">
              Task board
            </div>
          </div>
        </div>

        {/* Analyze Contract CTA */}
        <div className="space-y-2">
          <button
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className={`w-full py-3 px-4 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs min-h-[44px] ${
              !file || isAnalyzing
                ? 'opacity-50 cursor-not-allowed bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:scale-[0.99]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Analyzing contract document...</span>
              </>
            ) : (
              <span>Analyze Contract →</span>
            )}
          </button>
          <p className="text-[11px] text-center text-[var(--color-text-muted)]">
            Analysis time depends on contract length.
          </p>
        </div>
      </div>

      {/* Security note card */}
      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] flex items-start gap-3">
        <Shield className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed break-words">
          <strong className="text-[var(--color-text-main)]">Enterprise data policy:</strong> Contracts you upload are used only to analyse this agreement. Review all AI output before acting.
        </p>
      </div>
    </div>
  );
};
