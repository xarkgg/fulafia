import type { Metadata } from "next";
import Image from "next/image";
import { BookOpenCheck, ReceiptText, ShieldCheck, Wallet } from "lucide-react";
import { Logo } from "@/components/ui/misc";
import { SITE } from "@/lib/config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const highlights = [
  { icon: BookOpenCheck, text: "Register courses and print your course form in minutes" },
  { icon: ReceiptText, text: "Pay fees, verify Remita payments and download receipts" },
  { icon: Wallet, text: "Track every naira in your student wallet" },
  { icon: ShieldCheck, text: "Your records, results and documents in one secure place" },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel (desktop) */}
      <section className="relative hidden overflow-hidden bg-[#0b1f3a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full border border-white/5"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 size-[360px] rounded-full border border-[#c9a227]/20"
        />
        <Image src="/fulafia-logo-white.png" alt="Federal University of Lafia" width={785} height={260} className="relative h-11 w-auto self-start" priority />
        <div className="relative max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8b54a]">Student Portal</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
            Everything for your semester, in one calm place.
          </h1>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-[15px] text-white/80">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[#d8b54a]">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/50">
          {SITE.name} · {SITE.tagline}
        </p>
      </section>

      {/* Form */}
      <section className="flex flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8">
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-6">
          <Logo className="mb-8 h-11 lg:hidden" />
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h2>
          <p className="mt-1 text-[15px] text-muted">Sign in to the FULafia student portal.</p>
          <div className="mt-7 animate-rise">
            <LoginForm />
          </div>
        </div>
        <p className="mx-auto mt-4 text-center text-xs text-subtle lg:hidden">{SITE.tagline}</p>
      </section>
    </main>
  );
}
