"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck, Eye, EyeOff, KeyRound, LockKeyhole, Mail, UserRound } from "lucide-react";
import { login, requestPasswordReset } from "@/lib/api";
import { errorMessage } from "@/lib/use-async";
import { SITE, whatsappLink } from "@/lib/config";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { Notice } from "@/components/ui/states";
import { WhatsAppIcon } from "@/components/icons/whatsapp";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [applicant, setApplicant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [forgotOpen, setForgotOpen] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!username.trim() || !password) {
      setError(applicant ? "Enter your application number and password." : "Enter your username or email and your password.");
      return;
    }
    setLoading(true);
    try {
      const { redirect } = await login({ username, password, applicant });
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : redirect);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div
          role="radiogroup"
          aria-label="Account type"
          className="grid grid-cols-2 gap-1 rounded-xl bg-surface-3/70 p-1"
        >
          {[
            { v: false, label: "Student" },
            { v: true, label: "I'm an applicant" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              role="radio"
              aria-checked={applicant === o.v}
              onClick={() => {
                setApplicant(o.v);
                setError(undefined);
              }}
              className={cn(
                "pressable h-9 rounded-[9px] text-sm font-medium",
                applicant === o.v ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <Input
          label={applicant ? "Application number or email" : "Username or email"}
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          placeholder={applicant ? "e.g. FUL/APP/2026/01842" : "Matric number or email"}
          leading={<UserRound className="size-4" />}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <Input
          label="Password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          enterKeyHint="go"
          placeholder="Your password"
          leading={<LockKeyhole className="size-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="pressable grid size-9 place-items-center rounded-lg text-subtle hover:text-ink"
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="pressable -my-1 rounded-md py-1 text-sm font-medium text-gold-strong hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? "Signing in…" : "Sign in"}
          {!loading && <ArrowRight className="size-4" />}
        </Button>

        <p className="rounded-lg border border-dashed border-border-strong px-3 py-2 text-center text-xs text-muted">
          Demo build: any username and password signs you in as a sample student.
        </p>
      </form>

      <div className="mt-6 space-y-3 border-t border-border pt-6">
        <a
          href={SITE.applicationUrl}
          target="_blank"
          rel="noreferrer"
          className="pressable flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 hover:border-border-strong"
        >
          <span>
            <span className="block text-sm font-semibold text-ink">New to FULafia?</span>
            <span className="block text-sm text-muted">Start your application</span>
          </span>
          <ArrowRight className="size-4 text-gold-strong" />
        </a>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noreferrer"
          className="pressable flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1f9d55] text-[15px] font-medium text-white hover:bg-[#1a8a4a]"
        >
          <WhatsAppIcon className="size-5" />
          Chat with support on WhatsApp
        </a>
      </div>

      <ForgotPassword open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}

function ForgotPassword({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string>();
  const [sentTo, setSentTo] = useState("");

  function close() {
    onClose();
    window.setTimeout(() => {
      setState("idle");
      setError(undefined);
    }, 200);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setState("loading");
    try {
      const r = await requestPasswordReset(email);
      setSentTo(r.sentTo);
      setState("sent");
    } catch (err) {
      setError(errorMessage(err));
      setState("idle");
    }
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={state === "sent" ? "Check your inbox" : "Reset your password"}
      description={state === "sent" ? undefined : "We'll email you a secure link to set a new password."}
      size="sm"
    >
      {state === "sent" ? (
        <div className="space-y-4 pt-2">
          <Notice tone="success" icon={<CircleCheck />} title="Reset link sent">
            We sent a link to <strong>{sentTo}</strong>. It expires in 30 minutes.
          </Notice>
          <p className="text-sm text-muted">
            Didn&apos;t get it? Check spam, or reach support on{" "}
            <a className="font-medium text-gold-strong underline" href={whatsappLink("I can't reset my portal password.")}>
              WhatsApp
            </a>
            .
          </p>
          <Button className="w-full" onClick={close}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 pt-2" noValidate>
          <Input
            label="Email or matric number"
            type="text"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            leading={<Mail className="size-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            placeholder="you@example.com"
          />
          <Button type="submit" className="w-full" loading={state === "loading"} icon={<KeyRound className="size-4" />}>
            Send reset link
          </Button>
          <p className="text-center text-sm text-muted">
            Remembered it?{" "}
            <Link href="/login" onClick={close} className="font-medium text-gold-strong">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </Sheet>
  );
}
