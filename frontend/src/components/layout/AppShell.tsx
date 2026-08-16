import React from 'react';
import { Header } from './Header';

export interface AppShellProps {
  children: React.ReactNode;
  onNewAppeal?: () => void;
  isProcessing?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onNewAppeal,
  isProcessing = false,
}) => {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-deep antialiased selection:bg-accent-subtle selection:text-accent">
      <Header onNewAppeal={onNewAppeal} isProcessing={isProcessing} />

      <main className="flex flex-1 flex-col justify-start">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <footer className="mt-auto border-t border-border bg-card/50 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:px-6 lg:px-8 sm:text-left">
          <p className="font-mono text-[11px] text-muted">
            Impact Forge Hackathon · AppealForge · Clinical citations must be verified against official CMS guidelines.
          </p>
          <div className="flex items-center gap-4 font-mono text-[11px] text-muted">
            <span>HIPAA-Ready Processing</span>
            <span>•</span>
            <span>Deterministic RAG</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
