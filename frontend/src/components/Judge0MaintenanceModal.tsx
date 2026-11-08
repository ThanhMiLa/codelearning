import React from 'react';
import { Wrench, X } from 'lucide-react';

interface Judge0MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string | null;
  codeToCopy?: string;
}

export const Judge0MaintenanceModal: React.FC<Judge0MaintenanceModalProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-code-bg/80 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <div
            role="dialog" aria-modal="true" aria-labelledby="judge-maintenance-title"
            className="relative w-full max-w-sm overflow-hidden rounded-sm p-6 border-code-border bg-code-panel/80 backdrop-blur-md text-center border"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-3.5 top-3.5 rounded-sm p-1 text-code-muted hover:bg-code-elevated hover:text-code-text transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Wrench Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm bg-code-warning-surface text-code-warning mb-4 mt-2">
              <Wrench className="h-6 w-6" />
            </div>

            {/* Title */}
            <h3 id="judge-maintenance-title" className="text-lg font-medium text-code-text">
              System Maintenance
            </h3>

            {/* Message */}
            <p className="mt-2 text-xs text-code-muted leading-relaxed px-2">
              The online grading system is currently undergoing maintenance. Code submission and test execution are temporarily unavailable. Please try again later.
            </p>

            {/* Got it action button */}
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-sm bg-code-accent px-4 py-2 text-xs font-medium text-code-bg hover:bg-code-accent-hover transition-all cursor-pointer "
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
