import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', error, label, helperText, id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-deep">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error && inputId
              ? `${inputId}-error`
              : helperText && inputId
                ? `${inputId}-helper`
                : undefined
          }
          className={`flex h-11 w-full rounded-[4px] border bg-card px-3.5 py-2 text-sm text-deep transition-colors placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? 'border-flag-red focus-visible:ring-flag-red' : 'border-border hover:border-mid'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={inputId ? `${inputId}-error` : undefined} className="text-xs font-medium text-flag-red" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={inputId ? `${inputId}-helper` : undefined} className="text-xs text-mid">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, label, helperText, id, disabled, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-deep">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error && textareaId
              ? `${textareaId}-error`
              : helperText && textareaId
                ? `${textareaId}-helper`
                : undefined
          }
          className={`flex min-h-24 w-full rounded-[4px] border bg-card px-3.5 py-2.5 text-sm text-deep transition-colors placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? 'border-flag-red focus-visible:ring-flag-red' : 'border-border hover:border-mid'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={textareaId ? `${textareaId}-error` : undefined} className="text-xs font-medium text-flag-red" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={textareaId ? `${textareaId}-helper` : undefined} className="text-xs text-mid">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
