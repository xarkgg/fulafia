"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Download, HeartPulse, IdCard, Lock, Pencil, Users, Landmark } from "lucide-react";
import { getBioData, updateBioData } from "@/lib/api";
import { errorMessage, useAsync } from "@/lib/use-async";
import { formatDate } from "@/lib/format";
import { printHref } from "@/lib/print";
import { cn } from "@/lib/cn";
import type { BioData, BioSection } from "@/lib/types";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, ReadField, Select, Textarea } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { ErrorState, Notice, SkeletonCard } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

const STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "select" | "textarea" | "tel" | "email" | "locked-date";
  options?: string[];
  full?: boolean;
  autoComplete?: string;
};

const FIELDS: Record<BioSection, FieldDef[]> = {
  bio: [
    { key: "country", label: "Country", type: "select", options: ["Nigeria", "Ghana", "Cameroon", "Niger", "Chad", "Benin", "Other"] },
    { key: "state", label: "State of origin", type: "select", options: STATES },
    { key: "lga", label: "LGA" },
    { key: "hometown", label: "Hometown" },
    { key: "placeOfBirth", label: "Place of birth" },
    { key: "dateOfBirth", label: "Date of birth", type: "locked-date" },
    { key: "gender", label: "Gender", type: "select", options: ["Female", "Male"] },
    { key: "maritalStatus", label: "Marital status", type: "select", options: ["Single", "Married", "Divorced", "Widowed"] },
    { key: "religion", label: "Religion", type: "select", options: ["Christianity", "Islam", "Traditional", "Other", "Prefer not to say"] },
    { key: "tribe", label: "Tribe" },
    { key: "contactAddress", label: "Contact address", type: "textarea", full: true, autoComplete: "street-address" },
    { key: "homeAddress", label: "Home address", type: "textarea", full: true },
  ],
  health: [
    { key: "bloodGroup", label: "Blood group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] },
    { key: "genotype", label: "Genotype", type: "select", options: ["AA", "AS", "AC", "SS", "SC", "Unknown"] },
    { key: "height", label: "Height" },
    { key: "weight", label: "Weight" },
    { key: "allergies", label: "Allergies", full: true },
    { key: "disabilities", label: "Disabilities or special needs", full: true },
    { key: "medicalConditions", label: "Medical conditions", type: "textarea", full: true },
    { key: "emergencyClinic", label: "Preferred clinic", full: true },
  ],
  nextOfKin: [
    { key: "fullName", label: "Full name", autoComplete: "off" },
    { key: "relationship", label: "Relationship", type: "select", options: ["Father", "Mother", "Guardian", "Brother", "Sister", "Spouse", "Uncle", "Aunt", "Other"] },
    { key: "phone", label: "Phone number", type: "tel" },
    { key: "email", label: "Email", type: "email" },
    { key: "occupation", label: "Occupation" },
    { key: "address", label: "Address", type: "textarea", full: true },
  ],
  sponsorship: [
    { key: "sponsorType", label: "Sponsor type", type: "select", options: ["Self", "Parent / Guardian", "Student loan (NELFUND)", "Scholarship", "Employer", "Other"] },
    { key: "sponsorName", label: "Sponsor name" },
    { key: "relationship", label: "Relationship" },
    { key: "phone", label: "Phone number", type: "tel" },
    { key: "email", label: "Email", type: "email" },
    { key: "address", label: "Address", type: "textarea", full: true },
  ],
};

const TABS: { value: BioSection; label: string; icon: typeof IdCard; title: string; description: string }[] = [
  { value: "bio", label: "Bio info", icon: IdCard, title: "Personal information", description: "Your origin, birth and contact details." },
  { value: "health", label: "Health info", icon: HeartPulse, title: "Health information", description: "Shared only with the University Health Centre." },
  { value: "nextOfKin", label: "Next of kin", icon: Users, title: "Next of kin", description: "Who we contact in an emergency." },
  { value: "sponsorship", label: "Sponsorship", icon: Landmark, title: "Sponsorship", description: "Who pays for your studies." },
];

export function BioDataView() {
  const q = useAsync(getBioData);
  const [tab, setTab] = useState<BioSection>("bio");
  const [editing, setEditing] = useState(false);

  const current = TABS.find((t) => t.value === tab)!;

  return (
    <>
      <PageHeader
        title="Bio data"
        description="Keep your records current. The registry uses them for your certificate and transcripts."
        actions={
          <a
            href={`${printHref.bioData()}&autoprint=1`}
            target="_blank"
            rel="noreferrer"
            className="pressable inline-flex h-10 items-center gap-2 rounded-[10px] border border-border bg-surface px-3.5 text-sm font-medium text-ink shadow-card hover:bg-surface-2"
          >
            <Download className="size-4" aria-hidden /> Download PDF
          </a>
        }
      />
      <Tabs<BioSection>
        label="Bio data sections"
        className="mb-4"
        value={tab}
        onChange={(v) => {
          if (editing && !window.confirm("Discard unsaved changes?")) return;
          setEditing(false);
          setTab(v);
        }}
        items={TABS.map((t) => ({ value: t.value, label: t.label, icon: <t.icon className="size-4" /> }))}
      />

      {q.error ? (
        <ErrorState onRetry={q.reload} />
      ) : !q.data ? (
        <SkeletonCard lines={8} />
      ) : (
        <SectionCard
          key={tab}
          section={tab}
          title={current.title}
          description={current.description}
          data={q.data}
          editing={editing}
          setEditing={setEditing}
          onSaved={(d) => q.setData(d)}
        />
      )}
    </>
  );
}

function SectionCard({
  section,
  title,
  description,
  data,
  editing,
  setEditing,
  onSaved,
}: {
  section: BioSection;
  title: string;
  description: string;
  data: BioData;
  editing: boolean;
  setEditing: (v: boolean) => void;
  onSaved: (d: BioData) => void;
}) {
  const toast = useToast();
  const values = data[section] as Record<string, string>;
  const [draft, setDraft] = useState<Record<string, string>>(values);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (editing) setDraft(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      const next = await updateBioData(section, draft as never);
      onSaved(next);
      setEditing(false);
      toast.success("Changes saved", `${title} updated.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const fields = FIELDS[section];

  return (
    <Card className={cn(editing && "ring-2 ring-[var(--gold-ring)]")}>
      <form onSubmit={save} noValidate>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              {title}
              {editing && (
                <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs font-semibold text-gold-strong">Editing</span>
              )}
            </span>
          }
          description={description}
          action={
            !editing && (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)} icon={<Pencil className="size-4" />}>
                Edit
              </Button>
            )
          }
        />
        <CardBody>
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => {
                const v = draft[f.key] ?? "";
                const set = (val: string) => setDraft((d) => ({ ...d, [f.key]: val }));
                const cls = f.full ? "sm:col-span-2" : undefined;
                if (f.type === "locked-date") {
                  return (
                    <Input
                      key={f.key}
                      className={cls}
                      label={f.label}
                      value={formatDate(v, { day: "numeric", month: "long", year: "numeric" })}
                      disabled
                      leading={<Lock className="size-4" />}
                      help={
                        <>
                          Changed only by the registry.{" "}
                          <Link className="font-medium text-gold-strong" href="/support/new?category=Bio%20data&subject=Request%20to%20correct%20date%20of%20birth">
                            Request a correction
                          </Link>
                        </>
                      }
                    />
                  );
                }
                if (f.type === "select") {
                  const opts = f.options!.includes(v) || !v ? f.options! : [v, ...f.options!];
                  return (
                    <Select key={f.key} className={cls} label={f.label} value={v} onChange={(e) => set(e.target.value)} placeholder="Select…" options={opts.map((o) => ({ value: o, label: o }))} />
                  );
                }
                if (f.type === "textarea") {
                  return <Textarea key={f.key} className={cls} label={f.label} value={v} rows={2} onChange={(e) => set(e.target.value)} />;
                }
                return (
                  <Input
                    key={f.key}
                    className={cls}
                    label={f.label}
                    type={f.type === "tel" ? "tel" : f.type === "email" ? "email" : "text"}
                    inputMode={f.type === "tel" ? "tel" : f.type === "email" ? "email" : undefined}
                    autoComplete={f.autoComplete}
                    value={v}
                    onChange={(e) => set(e.target.value)}
                  />
                );
              })}
            </div>
          ) : (
            <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {fields.map((f) => (
                <ReadField
                  key={f.key}
                  className={f.full ? "sm:col-span-2" : undefined}
                  label={f.label}
                  locked={f.type === "locked-date"}
                  value={f.type === "locked-date" ? formatDate(values[f.key]!, { day: "numeric", month: "long", year: "numeric" }) : values[f.key]}
                />
              ))}
            </dl>
          )}
          {error && (
            <Notice tone="danger" className="mt-4" title="Couldn't save">
              {error}
            </Notice>
          )}
        </CardBody>
        {editing && (
          <CardFooter className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] rounded-b-2xl bg-surface/95 backdrop-blur lg:bottom-0">
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
