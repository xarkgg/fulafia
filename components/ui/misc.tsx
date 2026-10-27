import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

export function Avatar({ name, src, size = 36, className }: { name: string; src?: string; size?: number; className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-navy-soft font-semibold text-navy ring-1 ring-border",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads are data URLs
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}

export function Progress({
  value,
  max = 100,
  label,
  className,
  tone = "gold",
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
  tone?: "gold" | "success" | "warning" | "danger";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bar = { gold: "bg-gold", success: "bg-success", warning: "bg-warning", danger: "bg-danger" }[tone];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gold-strong">{eyebrow}</div>}
        <h1 className="text-[22px] font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted">{label}</p>
        {icon && <span className="text-subtle [&_svg]:size-4">{icon}</span>}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-ink tabular sm:text-2xl">{value}</p>
      {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
    </div>
  );
}

export function Logo({ className, variant = "full" }: { className?: string; variant?: "full" | "crest" }) {
  if (variant === "crest") {
    return <Image src="/crest.png" alt="FULafia crest" width={36} height={36} className={className} priority />;
  }
  return (
    <span className={cn("relative block", className)}>
      <Image
        src="/fulafia-logo-black.png"
        alt="Federal University of Lafia"
        width={786}
        height={260}
        className="h-full w-auto dark:hidden"
        priority
      />
      <Image
        src="/fulafia-logo-white.png"
        alt="Federal University of Lafia"
        width={785}
        height={260}
        className="hidden h-full w-auto dark:block"
        priority
      />
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-border", className)} />;
}
