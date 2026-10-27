"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import {
  getBioData,
  getCourseRegistration,
  getFee,
  getResults,
  getStudent,
  hasSession,
} from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatDate, formatDateTime, formatNaira } from "@/lib/format";
import { SITE } from "@/lib/config";
import type { BioData, Fee, Invoice, Semester, Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/states";

type DocType = "admission-letter" | "application-summary" | "screening-invoice" | "course-form" | "bio-data" | "fee";

const TITLES: Record<DocType, string> = {
  "admission-letter": "Admission Letter",
  "application-summary": "Application Summary",
  "screening-invoice": "Screening Fee Invoice",
  "course-form": "Course Registration Form",
  "bio-data": "Student Bio Data",
  fee: "Payment Receipt",
};

export function PrintView() {
  const router = useRouter();
  const params = useSearchParams();
  const type = (params.get("type") ?? "admission-letter") as DocType;
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!hasSession()) router.replace("/login");
    else setAllowed(true);
  }, [router]);

  const q = useAsync(async () => {
    const student = await getStudent();
    switch (type) {
      case "fee": {
        const r = await getFee({ feeId: params.get("fee") ?? undefined, invoiceId: params.get("invoice") ?? undefined });
        return { student, body: <FeeDoc student={student} fee={r.fee} invoice={r.invoice} />, title: r.fee.status === "paid" ? "Payment Receipt" : "Invoice" };
      }
      case "course-form": {
        const session = params.get("session") ?? student.currentSession;
        const semester = (params.get("semester") ?? student.currentSemester) as Semester;
        const reg = await getCourseRegistration(session, semester);
        let courses = reg.available.filter((c) => reg.registered.includes(c.code)).map((c) => ({ code: c.code, title: c.title, units: c.units, type: c.type as string }));
        let level = student.level;
        let status = reg.status === "approved" ? "Approved" : reg.status === "submitted" ? "Submitted, awaiting approval" : "Draft (not submitted)";
        if (courses.length === 0) {
          // Past semesters: rebuild the form from the published result.
          const res = await getResults();
          const sem = res.semesters.find((s) => s.session === session && s.semester === semester);
          if (sem) {
            courses = sem.courses.map((c) => ({ code: c.code, title: c.title, units: c.units, type: "—" }));
            status = "Approved";
            level = sem.level;
          }
        }
        return { student, title: "Course Registration Form", body: <CourseFormDoc student={{ ...student, level }} session={session} semester={semester} courses={courses} status={status} /> };
      }
      case "bio-data": {
        const bio = await getBioData();
        return { student, title: "Student Bio Data", body: <BioDoc student={student} bio={bio} /> };
      }
      case "application-summary":
        return { student, title: TITLES[type], body: <ApplicationDoc student={student} /> };
      case "screening-invoice":
        return { student, title: TITLES[type], body: <ScreeningDoc student={student} /> };
      default:
        return { student, title: TITLES["admission-letter"], body: <AdmissionDoc student={student} /> };
    }
  }, [type, params.toString()]);

  useEffect(() => {
    if (q.data) document.title = `${q.data.title} · ${q.data.student.matricNo}`;
    if (q.data && params.get("autoprint") === "1") {
      const t = window.setTimeout(() => window.print(), 600);
      return () => window.clearTimeout(t);
    }
  }, [q.data, params]);

  if (!allowed) return null;

  return (
    <div className="min-h-dvh bg-surface-3 print:bg-white">
      <div className="no-print sticky top-0 z-10 border-b border-border bg-surface/90 pt-safe backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[860px] items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/documents"))}
            icon={<ArrowLeft className="size-4" />}
          >
            Back
          </Button>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{q.data?.title ?? "Preparing document…"}</p>
          <Button size="sm" onClick={() => window.print()} disabled={!q.data} icon={<Printer className="size-4" />}>
            <span className="hidden sm:inline">Print / Save as PDF</span>
            <span className="sm:hidden">Save PDF</span>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-[860px] px-3 py-4 sm:px-6 sm:py-8 print:p-0">
        {q.error ? (
          <ErrorState title="This document couldn't be prepared" message={q.error.message} onRetry={q.reload} />
        ) : !q.data ? (
          <Paper>
            <div className="space-y-4" role="status" aria-label="Loading document">
              <Skeleton className="h-14 w-60" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-40 w-full" />
            </div>
          </Paper>
        ) : (
          <Paper>{q.data.body}</Paper>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Building blocks (always light, print-safe)                          */
/* ------------------------------------------------------------------ */

function Paper({ children }: { children: ReactNode }) {
  return (
    <article className="overflow-x-auto rounded-lg bg-white p-5 text-[13px] leading-relaxed text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_30px_rgba(0,0,0,0.06)] sm:p-10 print:overflow-visible print:rounded-none print:p-0 print:shadow-none">
      <div className="min-w-[300px]">{children}</div>
    </article>
  );
}

function Letterhead({ office, refNo }: { office: string; refNo?: string }) {
  return (
    <header className="mb-6 border-b-2 border-[#b8860b] pb-4">
      <div className="flex items-center gap-4">
        <Image src="/crest.png" alt="" width={64} height={64} className="size-12 sm:size-16" />
        <div className="min-w-0">
          <p className="text-base font-bold uppercase tracking-wide text-[#0b1f3a] sm:text-xl">{SITE.name}</p>
          <p className="text-[11px] text-[#4b5563] sm:text-xs">P.M.B. 146, Lafia, Nasarawa State, Nigeria · {SITE.website.replace("https://", "")}</p>
          <p className="mt-0.5 text-[11px] font-semibold italic text-[#8c6508] sm:text-xs">{SITE.tagline}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#0b1f3a]">
        <span>{office}</span>
        {refNo && <span className="font-mono normal-case tracking-normal text-[#4b5563]">Ref: {refNo}</span>}
      </div>
    </header>
  );
}

function DocTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-5 text-center text-sm font-bold uppercase tracking-[0.14em] text-[#0b1f3a] sm:text-base">{children}</h1>;
}

function KV({ rows, cols = 2 }: { rows: [string, ReactNode][]; cols?: 1 | 2 }) {
  return (
    <dl className={cols === 2 ? "grid grid-cols-1 gap-x-8 sm:grid-cols-2" : "grid grid-cols-1"}>
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-3 border-b border-[#e5e7eb] py-1.5">
          <dt className="w-36 shrink-0 text-[#6b7280]">{k}</dt>
          <dd className="min-w-0 flex-1 font-medium">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 bg-[#f3f4f6] px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0b1f3a]">{title}</h2>
      {children}
    </section>
  );
}

function Table({ head, rows, foot }: { head: string[]; rows: ReactNode[][]; foot?: ReactNode[] }) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b-2 border-[#0b1f3a]">
          {head.map((h, i) => (
            <th key={h} className={`py-1.5 pr-2 text-[11px] font-bold uppercase tracking-wide ${i === head.length - 1 ? "text-right" : ""}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-[#e5e7eb]">
            {r.map((c, j) => (
              <td key={j} className={`py-1.5 pr-2 align-top ${j === r.length - 1 ? "text-right tabular" : ""}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {foot && (
        <tfoot>
          <tr className="border-t-2 border-[#0b1f3a] font-bold">
            {foot.map((c, j) => (
              <td key={j} className={`py-2 pr-2 ${j === foot.length - 1 ? "text-right tabular" : ""}`}>
                {c}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  );
}

function Signatures({ labels }: { labels: string[] }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3">
      {labels.map((l) => (
        <div key={l} className="text-center">
          <div className="mb-1 h-10 border-b border-[#9ca3af]" />
          <p className="text-[11px] text-[#4b5563]">{l}</p>
        </div>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <p className="mt-8 border-t border-[#e5e7eb] pt-3 text-center text-[10px] text-[#9ca3af]">
      Generated from the FULafia Student Portal on {formatDateTime(new Date().toISOString())}. Verify at my.fulafia.edu.ng.
    </p>
  );
}

const fullName = (s: Student) => `${s.lastName.toUpperCase()}, ${s.firstName} ${s.otherName ?? ""}`.trim();

function StudentBlock({ s }: { s: Student }) {
  return (
    <KV
      rows={[
        ["Name", fullName(s)],
        ["Matric number", s.matricNo],
        ["Programme", s.programme],
        ["Department", s.department],
        ["Faculty", s.faculty],
        ["Level", String(s.level)],
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Documents                                                            */
/* ------------------------------------------------------------------ */

function AdmissionDoc({ student: s }: { student: Student }) {
  return (
    <>
      <Letterhead office="Office of the Registrar · Admissions" refNo={`FUL/REG/ADM/2024/${s.matricNo.slice(-4)}`} />
      <p className="mb-4 text-right">7 October 2024</p>
      <p className="mb-4">
        <strong>{fullName(s)}</strong>
        <br />
        JAMB Reg. No: {s.jambRegNo}
      </p>
      <DocTitle>Provisional Offer of Admission, 2024/2025 Session</DocTitle>
      <div className="space-y-3">
        <p>
          I am pleased to inform you that you have been offered provisional admission into the Federal University of Lafia to
          study for a <strong>Bachelor of Science (B.Sc.) degree in Computer Science</strong>, in the {s.faculty}, Department of{" "}
          {s.department}, for the 2024/2025 academic session.
        </p>
        <p>The programme runs for four (4) academic sessions through UTME entry. This offer is subject to the following conditions:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Presentation of the originals of your credentials for screening at the point of registration.</li>
          <li>Payment of the acceptance fee and other prescribed charges within the stipulated period.</li>
          <li>Satisfactory medical examination at the University Health Centre.</li>
          <li>The University reserves the right to withdraw this offer if any information you supplied is found to be false.</li>
        </ol>
        <p>Please accept my congratulations on your admission.</p>
      </div>
      <div className="mt-10 w-56">
        <div className="mb-1 h-10 border-b border-[#9ca3af]" />
        <p className="font-semibold">Registrar</p>
        <p className="text-[11px] text-[#6b7280]">For: Vice-Chancellor</p>
      </div>
      <Footer />
    </>
  );
}

function ApplicationDoc({ student: s }: { student: Student }) {
  return (
    <>
      <Letterhead office="Admissions Office · Post-UTME" refNo={`FUL/APP/2024/0${s.matricNo.slice(-4)}`} />
      <DocTitle>Application Summary</DocTitle>
      <Section title="Applicant">
        <KV
          rows={[
            ["Name", fullName(s)],
            ["JAMB Reg. No", s.jambRegNo],
            ["Email", s.personalEmail],
            ["Phone", s.phone],
            ["Entry mode", s.entryMode],
            ["Session", s.admittedSession],
          ]}
        />
      </Section>
      <Section title="Programme choice">
        <KV rows={[["First choice", s.programme], ["Faculty", s.faculty], ["UTME score", "268"], ["Post-UTME score", "71.5"]]} />
      </Section>
      <Section title="UTME subjects">
        <Table head={["Subject", "Score"]} rows={[["Use of English", "64"], ["Mathematics", "72"], ["Physics", "68"], ["Chemistry", "64"]]} foot={["Total", "268"]} />
      </Section>
      <Section title="O'Level results (WAEC, 2023)">
        <Table
          head={["Subject", "Grade"]}
          rows={[["English Language", "B3"], ["Mathematics", "A1"], ["Physics", "B2"], ["Chemistry", "B3"], ["Biology", "C4"], ["Economics", "B3"], ["Civic Education", "A1"]]}
        />
      </Section>
      <Footer />
    </>
  );
}

function ScreeningDoc({ student: s }: { student: Student }) {
  return (
    <>
      <Letterhead office="Bursary Department" refNo="RRR 2904-1178-3320" />
      <DocTitle>Post-UTME Screening Fee Invoice</DocTitle>
      <KV rows={[["Name", fullName(s)], ["JAMB Reg. No", s.jambRegNo], ["Session", "2024/2025"], ["Date", "28 Aug 2024"], ["Channel", "Remita (card)"], ["Status", "PAID"]]} />
      <div className="mt-6">
        <Table head={["Description", "Amount"]} rows={[["Post-UTME screening fee", formatNaira(2000)]]} foot={["Total", formatNaira(2000)]} />
      </div>
      <PaidStamp />
      <Footer />
    </>
  );
}

function PaidStamp({ label = "PAID" }: { label?: string }) {
  return (
    <div className="mt-6 flex justify-end">
      <span className="-rotate-6 rounded-md border-[3px] border-[#15803d] px-4 py-1 text-lg font-black tracking-[0.2em] text-[#15803d]">
        {label}
      </span>
    </div>
  );
}

function FeeDoc({ student: s, fee, invoice }: { student: Student; fee: Fee; invoice: Invoice | null }) {
  const paid = fee.status === "paid";
  return (
    <>
      <Letterhead office="Bursary Department" refNo={invoice ? `${invoice.channel === "Wallet" ? "Wallet ref" : "RRR"} ${invoice.rrr}` : undefined} />
      <DocTitle>{paid ? "Official Payment Receipt" : "Payment Invoice"}</DocTitle>
      <StudentBlock s={s} />
      <div className="mt-4">
        <KV
          rows={[
            ["Fee", `${fee.title}${fee.category === "school" ? "" : ` (${fee.category === "association" ? "Association dues" : "Standalone"})`}`],
            ["Session", fee.session],
            ["Status", paid ? "PAID" : fee.status === "upcoming" ? "NOT YET DUE" : "UNPAID"],
            [paid ? "Paid on" : "Due date", paid && fee.paidAt ? formatDateTime(fee.paidAt) : fee.dueDate ? formatDate(fee.dueDate) : "—"],
            ["Channel", invoice?.channel ?? "—"],
            ["Invoice ID", invoice?.id.toUpperCase() ?? "—"],
          ]}
        />
      </div>
      <div className="mt-6">
        <Table head={["Code", "Description", "Amount"]} rows={fee.items.map((i) => [i.code, i.name, formatNaira(i.amount)])} foot={["", "Total", formatNaira(fee.total)]} />
      </div>
      {paid ? (
        <PaidStamp />
      ) : (
        <p className="mt-6 rounded border border-[#fcd34d] bg-[#fffbeb] p-3 text-[12px]">
          Pay online from the portal (Wallet or Remita), or at any bank branch using a Remita Retrieval Reference generated from the portal.
        </p>
      )}
      <Footer />
    </>
  );
}

function CourseFormDoc({
  student: s,
  session,
  semester,
  courses,
  status,
}: {
  student: Student;
  session: string;
  semester: string;
  courses: { code: string; title: string; units: number; type: string }[];
  status: string;
}) {
  const total = courses.reduce((a, c) => a + c.units, 0);
  return (
    <>
      <Letterhead office="Academic Office · Course Registration" refNo={`${session} · ${semester} Semester`} />
      <DocTitle>Course Registration Form</DocTitle>
      <StudentBlock s={s} />
      <div className="mt-2">
        <KV rows={[["Session", session], ["Semester", semester], ["Status", status], ["Total units", String(total)]]} />
      </div>
      <div className="mt-6">
        {courses.length ? (
          <Table
            head={["#", "Code", "Course title", "Type", "Units"]}
            rows={courses.map((c, i) => [String(i + 1), c.code, c.title, c.type === "gst" ? "GST" : c.type === "—" ? "—" : c.type[0]!.toUpperCase() + c.type.slice(1), String(c.units)])}
            foot={["", "", "Total units", "", String(total)]}
          />
        ) : (
          <p className="rounded border border-[#e5e7eb] p-4 text-center text-[#6b7280]">No courses registered for this semester yet.</p>
        )}
      </div>
      <Signatures labels={["Student", "Level adviser", "Head of Department"]} />
      <Footer />
    </>
  );
}

function BioDoc({ student: s, bio }: { student: Student; bio: BioData }) {
  return (
    <>
      <Letterhead office="Student Affairs · Records" refNo={s.matricNo} />
      <DocTitle>Student Bio Data</DocTitle>
      <Section title="Student">
        <StudentBlock s={s} />
      </Section>
      <Section title="Personal information">
        <KV
          rows={[
            ["Date of birth", formatDate(bio.bio.dateOfBirth, { day: "numeric", month: "long", year: "numeric" })],
            ["Gender", bio.bio.gender],
            ["Place of birth", bio.bio.placeOfBirth],
            ["Marital status", bio.bio.maritalStatus],
            ["Religion", bio.bio.religion],
            ["Tribe", bio.bio.tribe],
            ["Country", bio.bio.country],
            ["State", bio.bio.state],
            ["LGA", bio.bio.lga],
            ["Hometown", bio.bio.hometown],
            ["Contact address", bio.bio.contactAddress],
            ["Home address", bio.bio.homeAddress],
          ]}
        />
      </Section>
      <Section title="Health information">
        <KV
          rows={[
            ["Blood group", bio.health.bloodGroup],
            ["Genotype", bio.health.genotype],
            ["Height", bio.health.height],
            ["Weight", bio.health.weight],
            ["Allergies", bio.health.allergies],
            ["Disabilities", bio.health.disabilities],
            ["Medical conditions", bio.health.medicalConditions],
          ]}
        />
      </Section>
      <Section title="Next of kin">
        <KV
          rows={[
            ["Name", bio.nextOfKin.fullName],
            ["Relationship", bio.nextOfKin.relationship],
            ["Phone", bio.nextOfKin.phone],
            ["Email", bio.nextOfKin.email],
            ["Occupation", bio.nextOfKin.occupation],
            ["Address", bio.nextOfKin.address],
          ]}
        />
      </Section>
      <Section title="Sponsorship">
        <KV
          rows={[
            ["Sponsor type", bio.sponsorship.sponsorType],
            ["Sponsor", bio.sponsorship.sponsorName],
            ["Relationship", bio.sponsorship.relationship],
            ["Phone", bio.sponsorship.phone],
            ["Email", bio.sponsorship.email],
            ["Address", bio.sponsorship.address],
          ]}
        />
      </Section>
      <Signatures labels={["Student's signature", "Date"]} />
      <Footer />
    </>
  );
}
