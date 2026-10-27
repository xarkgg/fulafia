"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-[10px] border border-border bg-surface text-ink placeholder:text-subtle shadow-card transition-colors hover:border-border-strong focus:border-gold focus:outline-none focus:ring-4 focus:ring-[var(--gold-ring)] disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted aria-[invalid=true]:border-danger";

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-ink">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-subtle">{hint}</span>}
    </label>
  );
}

type FieldWrapProps = { label?: ReactNode; hint?: ReactNode; error?: string; help?: ReactNode; className?: string };

function FieldWrap({
  id,
  label,
  hint,
  error,
  help,
  className,
  children,
}: FieldWrapProps & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} hint={hint}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : help ? (
        <p id={`${id}-help`} className="mt-1.5 text-sm text-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> &
  FieldWrapProps & { leading?: ReactNode; trailing?: ReactNode; inputClassName?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, help, className, leading, trailing, inputClassName, id, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap id={fid} label={label} hint={hint} error={error} help={help} className={className}>
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-subtle">{leading}</span>
        )}
        <input
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-error` : help ? `${fid}-help` : undefined}
          className={cn(control, "h-11 px-3", leading && "pl-10", trailing && "pr-11", inputClassName)}
          {...props}
        />
        {trailing && <span className="absolute inset-y-0 right-1 flex items-center">{trailing}</span>}
      </div>
    </FieldWrap>
  );
});

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> &
  FieldWrapProps & { options: { value: string; label: string }[]; placeholder?: string };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, help, className, options, placeholder, id, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap id={fid} label={label} hint={hint} error={error} help={help} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          className={cn(control, "h-11 appearance-none pl-3 pr-10")}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      </div>
    </FieldWrap>
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrapProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, help, className, id, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldWrap id={fid} label={label} hint={hint} error={error} help={help} className={className}>
      <textarea
        ref={ref}
        id={fid}
        aria-invalid={error ? true : undefined}
        className={cn(control, "min-h-28 px-3 py-2.5 leading-relaxed")}
        {...props}
      />
    </FieldWrap>
  );
});

/** Read-only value display used in view mode (Bio Data, Programme, Account). */
export function ReadField({
  label,
  value,
  locked,
  className,
}: {
  label: string;
  value?: ReactNode;
  locked?: boolean;
  className?: string;
}) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-subtle">
        {label}
        {locked && <Lock className="size-3" aria-label="Locked" />}
      </dt>
      <dd className={cn("mt-1 break-words text-[15px]", empty ? "text-subtle" : "text-ink")}>
        {empty ? "Not provided" : value}
      </dd>
    </div>
  );
}
