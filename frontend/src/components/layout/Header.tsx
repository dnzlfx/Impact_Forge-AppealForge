import React, { useEffect, useState } from 'react';
import { Badge, Button } from '../ui';
import { checkHealth } from '../../lib/api';

export interface HeaderProps {
  onNewAppeal?: () => void;
  isProcessing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onNewAppeal, isProcessing = false }) => {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let isMounted = true;

    const ping = async () => {
      try {
        await checkHealth();
        if (isMounted) setHealthStatus('online');
      } catch {
        if (isMounted) setHealthStatus('offline');
      }
    };

    ping();
    const interval = setInterval(ping, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-6">
          <a
            href="/"
            className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[4px]"
            aria-label="AppealForge — Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-deep text-white shadow-sm transition-transform duration-150 group-hover:scale-105">
              <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                  d="M9 15.5 13.5 20l4.5-5-4.5-5-4.5 5.5Z"
                  className="stroke-accent"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <path d="M17 19.5h6" className="stroke-white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-semibold tracking-tight text-deep leading-none">
                AppealForge
              </span>
              <span className="font-sans text-[11px] text-muted leading-tight mt-0.5">
                Clinical Insurance Appeals AI
              </span>
            </div>
          </a>

          <div className="hidden items-center border-l border-border pl-6 md:flex">
            {healthStatus === 'checking' && (
              <Badge variant="outline" className="animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                <span>Checking API</span>
              </Badge>
            )}
            {healthStatus === 'online' && (
              <Badge variant="success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span>API Online</span>
              </Badge>
            )}
            {healthStatus === 'offline' && (
              <Badge variant="warning">
                <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                <span>Demo Mock Active</span>
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onNewAppeal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewAppeal}
              disabled={isProcessing}
              leftIcon={
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              New Appeal
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
