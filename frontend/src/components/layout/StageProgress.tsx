import React from 'react';
import type { Stage } from '../../lib/types';

export interface StageProgressProps {
  currentStage: Stage;
}

interface StepItem {
  id: number;
  label: string;
  stageKey: Stage;
  description: string;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    label: 'Upload Documents',
    stageKey: 'idle',
    description: 'Denial letter & records',
  },
  {
    id: 2,
    label: 'AI Synthesis & Extraction',
    stageKey: 'processing',
    description: 'Codes & CMS RAG Search',
  },
  {
    id: 3,
    label: 'Review & Audit',
    stageKey: 'review',
    description: 'Verified clinical draft',
  },
];

export const StageProgress: React.FC<StageProgressProps> = ({ currentStage }) => {
  const getStageIndex = (stage: Stage): number => {
    switch (stage) {
      case 'idle':
      case 'uploading':
        return 0;
      case 'processing':
        return 1;
      case 'review':
        return 2;
      case 'error':
        return 0;
      default:
        return 0;
    }
  };

  const activeIndex = getStageIndex(currentStage);

  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <li
              key={step.id}
              className={`relative flex items-center gap-3 rounded-[6px] border p-3 transition-colors duration-150 ${
                isCurrent
                  ? 'border-accent bg-card shadow-sm ring-1 ring-accent/20'
                  : isCompleted
                  ? 'border-border bg-card/60'
                  : 'border-border/60 bg-transparent opacity-60'
              }`}
              {...(isCurrent ? { 'aria-current': 'step' } : {})}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold font-mono ${
                  isCompleted
                    ? 'bg-success text-white'
                    : isCurrent
                    ? 'bg-accent text-white'
                    : 'border border-border bg-card text-muted'
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <span
                  className={`text-xs font-semibold leading-tight truncate ${
                    isCurrent ? 'text-deep' : isCompleted ? 'text-mid' : 'text-muted'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[11px] text-muted leading-tight truncate">
                  {step.description}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
