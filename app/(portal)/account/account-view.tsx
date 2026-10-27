"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, Eye, EyeOff, KeyRound, Mail, Phone, RotateCcw, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { changePassword, LIVE, resetDemoData, updateProfile } from "@/lib/api";
import { errorMessage } from "@/lib/use-async";
import { cn } from "@/lib/cn";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, ReadField, Textarea } from "@/components/ui/field";
import { Avatar, PageHeader } from "@/components/ui/misc";
import { SkeletonCard } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useStudent } from "@/components/shell/student-context";

export function AccountView() {
  const { student } = useStudent();
  return (
    <>
      <PageHeader title="Account" description="Your profile photo, contact details and password." />
      {!student ? (
        <div className="space-y-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={5} />
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <Profile />
            <Contact />
          </div>
          <div className="space-y-5">
            <Security />
            {!LIVE && <DemoReset />}
          </div>
        </div>
      )}
    </>
  );
}

/** Downscale an uploaded photo to a square JPEG data URL so it stays small in storage. */
async function toAvatarDataUrl(file: File, size = 320): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const s = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Profile() {
  const toast = useToast();
  const { student, setStudent } = useStudent();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  if (!student) return null;
  const name = `${student.firstName} ${student.otherName ? `${student.otherName} ` : ""}${student.lastName}`;

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Choose an image", "Use a JPG or PNG photo.");
    if (f.size > 5 * 1024 * 1024) return toast.error("Photo too large", "Use a photo under 5 MB.");
    setBusy(true);
    try {
      const photoUrl = await toAvatarDataUrl(f);
      setStudent(await updateProfile({ photoUrl }));
      toast.success("Profile photo updated");
    } catch (e) {
      toast.error("Couldn't update photo", errorMessage(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto() {
    setBusy(true);
    try {
      setStudent(await updateProfile({ photoUrl: null }));
      toast.info("Profile photo removed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Profile" icon={<UserRound className="size-4" />} />
      <CardBody>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={`${student.firstName} ${student.lastName}`} src={student.photoUrl ?? undefined} size={84} className={cn(busy && "opacity-60")} />
            <label
              htmlFor="photo"
              className="pressable absolute -bottom-1 -right-1 grid size-9 cursor-pointer place-items-center rounded-full border-2 border-surface bg-[#0b1f3a] text-white shadow-pop dark:bg-gold dark:text-[#0b1424]"
              aria-label="Upload profile photo"
            >
              <Camera className="size-4" />
            </label>
            <input ref={fileRef} id="photo" type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-ink">{name}</p>
            <p className="text-sm text-muted">{student.matricNo}</p>
            {student.photoUrl ? (
              <button type="button" onClick={removePhoto} disabled={busy} className="pressable mt-1 inline-flex items-center gap-1 rounded text-sm font-medium text-danger">
                <Trash2 className="size-3.5" /> Remove photo
              </button>
            ) : (
              <p className="mt-1 text-xs text-subtle">Clear, front-facing photo. JPG or PNG, max 5 MB.</p>
            )}
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
          <ReadField label="Full name" value={name} locked />
          <ReadField label="Matric number" value={student.matricNo} locked />
          <ReadField label="Programme" value={student.programme} />
          <ReadField label="Level" value={`${student.level} Level`} />
          <ReadField label="Portal email" value={student.email} className="col-span-2" locked />
        </dl>
        <p className="mt-4 text-xs text-subtle">Name and matric number changes go through the Academic Office.</p>
      </CardBody>
    </Card>
  );
}

function Contact() {
  const toast = useToast();
  const { student, setStudent } = useStudent();
  const [form, setForm] = useState({ phone: "", altPhone: "", personalEmail: "", contactAddress: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student)
      setForm({ phone: student.phone, altPhone: student.altPhone ?? "", personalEmail: student.personalEmail, contactAddress: student.contactAddress });
  }, [student]);

  if (!student) return null;
  const dirty =
    form.phone !== student.phone ||
    form.altPhone !== (student.altPhone ?? "") ||
    form.personalEmail !== student.personalEmail ||
    form.contactAddress !== student.contactAddress;

  async function save(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid phone number, e.g. +234 803 555 0142.";
    if (form.altPhone && form.altPhone.replace(/\D/g, "").length < 10) next.altPhone = "Enter a valid phone number or leave it empty.";
    if (!/^\S+@\S+\.\S+$/.test(form.personalEmail)) next.personalEmail = "Enter a valid email address.";
    if (form.contactAddress.trim().length < 10) next.contactAddress = "Enter your full contact address.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      setStudent(await updateProfile(form));
      toast.success("Contact details saved");
    } catch (err) {
      toast.error("Couldn't save", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Card>
      <form onSubmit={save} noValidate>
        <CardHeader title="Contact information" description="Where the university reaches you." icon={<Phone className="size-4" />} />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input label="Phone number" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} error={errors.phone} />
          <Input label="Alternative phone" hint="Optional" type="tel" inputMode="tel" value={form.altPhone} onChange={(e) => set("altPhone")(e.target.value)} error={errors.altPhone} />
          <Input
            className="sm:col-span-2"
            label="Personal email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            leading={<Mail className="size-4" />}
            value={form.personalEmail}
            onChange={(e) => set("personalEmail")(e.target.value)}
            error={errors.personalEmail}
          />
          <Textarea className="sm:col-span-2" label="Contact address" rows={2} value={form.contactAddress} onChange={(e) => set("contactAddress")(e.target.value)} error={errors.contactAddress} />
        </CardBody>
        <CardFooter>
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save contact details
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function strength(p: string): { score: number; label: string } {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const score = Math.min(4, s);
  return { score, label: ["Too short", "Weak", "Fair", "Good", "Strong"][score]! };
}

function Security() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [saving, setSaving] = useState(false);
  const st = strength(next);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: typeof errors = {};
    if (!current) err.current = "Enter your current password.";
    if (next.length < 8) err.next = "Use at least 8 characters.";
    else if (next === current) err.next = "Choose a password different from your current one.";
    if (confirm !== next) err.confirm = "Passwords don't match.";
    setErrors(err);
    if (Object.keys(err).length) return;
    setSaving(true);
    try {
      await changePassword({ current, next });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password changed", "Use your new password next time you sign in.");
    } catch (er) {
      setErrors({ current: errorMessage(er) });
    } finally {
      setSaving(false);
    }
  }

  const eye = (
    <button
      type="button"
      onClick={() => setShow((s) => !s)}
      className="pressable grid size-9 place-items-center rounded-lg text-subtle hover:text-ink"
      aria-label={show ? "Hide passwords" : "Show passwords"}
      aria-pressed={show}
    >
      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        <CardHeader title="Security" description="Change your portal password." icon={<ShieldCheck className="size-4" />} />
        <CardBody className="space-y-4">
          <Input label="Current password" type={show ? "text" : "password"} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} trailing={eye} />
          <div>
            <Input label="New password" type={show ? "text" : "password"} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} />
            {next && (
              <div className="mt-2 flex items-center gap-3" aria-live="polite">
                <div className="grid flex-1 grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full",
                        i <= st.score ? (st.score <= 1 ? "bg-danger" : st.score === 2 ? "bg-warning" : "bg-success") : "bg-surface-3",
                      )}
                    />
                  ))}
                </div>
                <span className="w-16 text-right text-xs font-medium text-muted">{st.label}</span>
              </div>
            )}
          </div>
          <Input label="Confirm new password" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
          <p className="text-xs text-subtle">At least 8 characters. Mixing upper and lower case, numbers and symbols makes it stronger.</p>
        </CardBody>
        <CardFooter>
          <Button type="submit" loading={saving} icon={<KeyRound className="size-4" />}>
            Update password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function DemoReset() {
  const toast = useToast();
  const { refresh } = useStudent();
  return (
    <Card className="border-dashed">
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-semibold text-ink">Demo data</p>
          <p className="text-sm text-muted">Payments, registrations and edits are saved in this browser. Reset to start the demo fresh.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RotateCcw className="size-4" />}
          onClick={async () => {
            resetDemoData();
            await refresh();
            toast.success("Demo data reset");
          }}
        >
          Reset demo
        </Button>
      </CardBody>
    </Card>
  );
}
