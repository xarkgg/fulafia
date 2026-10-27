import type { ReactNode } from "react";
import { CircleAlert, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4", className)} aria-hidden />;
}

/** A card-shaped placeholder that mirrors common page layouts. */
export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-5", className)} aria-hidden>
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3.5", i % 3 === 2 ? "w-2/3" : i % 2 ? "w-5/6" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <div className="grid gap-4 sm:grid-cols-3">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} className="hidden sm:block" />
      </div>
      <SkeletonCard lines={6} />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      {icon && (
        <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-surface-2 text-subtle [&_svg]:size-6">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "We couldn't load this right now",
  message = "Check your connection and try again. Your data is safe.",
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-2xl border border-border bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-danger-soft text-danger">
        <CircleAlert className="size-6" aria-hidden />
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry} icon={<RefreshCw className="size-4" />}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Notice({
  tone = "info",
  icon,
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "success" | "gold" | "danger";
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
    gold: "bg-gold-soft text-gold-strong",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <div className={cn("flex gap-3 rounded-xl p-3.5 text-sm", tones[tone], className)}>
      {icon && <span className="mt-0.5 shrink-0 [&_svg]:size-4">{icon}</span>}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("text-ink/80", title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  );
}
