/**
 * Data layer for the FULafia student portal.
 *
 * Every screen reads and writes through the typed functions in this file, never
 * through fetch() directly. Today they run against an in-browser mock database
 * (lib/mock). To connect the real portal backend:
 *
 *   1. Set NEXT_PUBLIC_API_BASE_URL (e.g. https://api.my.fulafia.edu.ng/v1).
 *   2. Make the backend serve the endpoint listed next to each function,
 *      returning the shapes in lib/types.ts (JSON, cookie or bearer auth).
 *
 * Nothing in the UI needs to change.
 */
import { gpa, gradeFor, classOfDegree } from "./grading";
import { commit, db, resetDb, type MockInvoice, type StoredRegistration } from "./mock/db";
import type {
  BioData,
  BioSection,
  CourseRegistration,
  CurrentTerm,
  Dashboard,
  Elearning,
  Fee,
  FeeCategory,
  Invoice,
  NewTicket,
  PaymentMethod,
  PaymentResult,
  PortalDocument,
  ProfileUpdate,
  Programme,
  ResultsSummary,
  SemesterChecklist,
  SemesterResult,
  Semester,
  SessionId,
  Student,
  Ticket,
  VerificationResult,
  Wallet,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
export const LIVE = BASE_URL.length > 0;

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/* ------------------------------------------------------------------ */
/* Transport                                                            */
/* ------------------------------------------------------------------ */

async function http<T>(method: "GET" | "POST" | "PUT" | "PATCH", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {}
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Simulates network latency and returns a detached copy, like a real response. */
async function mock<T>(fn: () => T, latency = 280 + Math.random() * 320): Promise<T> {
  await wait(latency);
  return JSON.parse(JSON.stringify(fn())) as T;
}

const nowIso = () => new Date().toISOString();
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const rand = (n: number) => Math.floor(Math.random() * n);

/* ------------------------------------------------------------------ */
/* Auth                                                     POST /auth/* */
/* ------------------------------------------------------------------ */

const SESSION_KEY = "fulafia.session";

export async function login(input: { username: string; password: string; applicant: boolean }): Promise<{ redirect: string }> {
  if (LIVE) return http("POST", "/auth/login", input);
  return mock(() => {
    if (!input.username.trim() || !input.password) throw new ApiError("Enter your username and password.");
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ at: nowIso(), applicant: input.applicant }));
    return { redirect: "/dashboard" };
  }, 650);
}

export async function logout(): Promise<void> {
  if (LIVE) return http("POST", "/auth/logout");
  window.localStorage.removeItem(SESSION_KEY);
}

export function hasSession(): boolean {
  if (LIVE) return true; // the real backend enforces auth via cookie and 401s
  try {
    return !!window.localStorage.getItem(SESSION_KEY);
  } catch {
    return false;
  }
}

export async function requestPasswordReset(email: string): Promise<{ sentTo: string }> {
  if (LIVE) return http("POST", "/auth/forgot-password", { email });
  return mock(() => {
    if (!email.trim()) throw new ApiError("Enter the email or matric number on your record.");
    return { sentTo: email.includes("@") ? email : "the email on your record" };
  }, 800);
}

/* ------------------------------------------------------------------ */
/* Student + term                                       GET /students/me */
/* ------------------------------------------------------------------ */

export async function getStudent(): Promise<Student> {
  if (LIVE) return http("GET", "/students/me");
  return mock(() => db().student);
}

export async function getTerm(): Promise<{ current: CurrentTerm; sessions: SessionId[] }> {
  if (LIVE) return http("GET", "/sessions");
  return mock(() => ({ current: db().term, sessions: db().sessions }), 120);
}

export async function updateProfile(patch: ProfileUpdate): Promise<Student> {
  if (LIVE) return http("PATCH", "/students/me", patch);
  return mock(() => {
    if (patch.phone !== undefined && patch.phone.replace(/\D/g, "").length < 10) throw new ApiError("Enter a valid phone number.");
    commit((d) => {
      d.student = { ...d.student, ...patch };
      if (patch.contactAddress) d.biodata.bio.contactAddress = patch.contactAddress;
    });
    return db().student;
  }, 600);
}

export async function changePassword(input: { current: string; next: string }): Promise<void> {
  if (LIVE) return http("POST", "/auth/change-password", input);
  return mock(() => {
    // Demo: any current password is accepted, except an empty one.
    if (!input.current) throw new ApiError("Enter your current password.");
    if (input.next.length < 8) throw new ApiError("New password must be at least 8 characters.");
    commit((d) => {
      d.password = input.next;
    });
  }, 800);
}

/* ------------------------------------------------------------------ */
/* Bio data                                   GET/PUT /students/me/biodata */
/* ------------------------------------------------------------------ */

export async function getBioData(): Promise<BioData> {
  if (LIVE) return http("GET", "/students/me/biodata");
  return mock(() => db().biodata);
}

export async function updateBioData<S extends BioSection>(section: S, values: BioData[S]): Promise<BioData> {
  if (LIVE) return http("PUT", `/students/me/biodata/${section}`, values);
  return mock(() => {
    commit((d) => {
      const next = { ...values } as BioData[S];
      // Date of birth is locked: only the registry can change it.
      if (section === "bio") (next as BioData["bio"]).dateOfBirth = d.biodata.bio.dateOfBirth;
      d.biodata[section] = next;
      if (section === "bio") d.student.contactAddress = (next as BioData["bio"]).contactAddress;
    });
    return db().biodata;
  }, 650);
}

/* ------------------------------------------------------------------ */
/* Fees, invoices, payments                                  /fees, /invoices */
/* ------------------------------------------------------------------ */

export async function getFees(params: { session: SessionId; category: FeeCategory }): Promise<Fee[]> {
  if (LIVE) return http("GET", `/fees?session=${encodeURIComponent(params.session)}&category=${params.category}`);
  return mock(() =>
    db()
      .fees.filter((f) => f.session === params.session && f.category === params.category)
      .sort((a, b) => (a.semester ?? "").localeCompare(b.semester ?? "")),
  );
}

export async function getInvoices(params?: { session?: SessionId; status?: Invoice["status"] }): Promise<Invoice[]> {
  if (LIVE) {
    const q = new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][]);
    return http("GET", `/invoices?${q}`);
  }
  return mock(() =>
    db()
      .invoices.filter((i) => (!params?.session || i.session === params.session) && (!params?.status || i.status === params.status))
      .map(stripMock)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

export async function getFee(params: { feeId?: string; invoiceId?: string }): Promise<{ fee: Fee; invoice: Invoice | null }> {
  if (LIVE) {
    return params.invoiceId ? http("GET", `/invoices/${params.invoiceId}/fee`) : http("GET", `/fees/${params.feeId}`);
  }
  return mock(() => {
    const d = db();
    const inv = params.invoiceId ? d.invoices.find((i) => i.id === params.invoiceId) : undefined;
    const fee = d.fees.find((f) => f.id === (inv?.feeId ?? params.feeId));
    if (!fee) throw new ApiError("Fee record not found.", 404);
    const invoice = inv ?? d.invoices.find((i) => i.id === fee.invoiceId) ?? d.invoices.find((i) => i.feeId === fee.id) ?? null;
    return { fee, invoice: invoice ? stripMock(invoice) : null };
  }, 200);
}

function stripMock(i: MockInvoice): Invoice {
  const { verifyOutcome: _ignored, ...rest } = i;
  return rest;
}

export async function payFee(feeId: string, method: PaymentMethod): Promise<PaymentResult> {
  if (LIVE) return http("POST", `/fees/${feeId}/pay`, { method });
  return mock(() => {
    const d = db();
    const fee = d.fees.find((f) => f.id === feeId);
    if (!fee) throw new ApiError("This fee no longer exists.", 404);
    if (fee.status === "paid") throw new ApiError("This fee has already been paid.");
    if (fee.status === "upcoming") throw new ApiError("This fee is not open for payment yet.");
    const balance = walletBalance();
    if (method === "wallet" && balance < fee.total) {
      throw new ApiError("Your wallet balance is too low for this payment. Pay with Remita instead.");
    }
    const paidAt = nowIso();
    const stamp = paidAt.slice(2, 10).replace(/-/g, "");
    const invoice: MockInvoice = {
      id: `inv_${Date.now()}`,
      rrr: method === "wallet" ? `WAL-${stamp}-${1000 + rand(9000)}` : `2911-${1000 + rand(9000)}-${1000 + rand(9000)}`,
      feeId: fee.id,
      title: fee.title,
      session: fee.session,
      amount: fee.total,
      status: "paid",
      channel: method === "wallet" ? "Wallet" : "Remita (card)",
      createdAt: paidAt,
      paidAt,
    };
    commit((db) => {
      const f = db.fees.find((x) => x.id === feeId)!;
      // An existing pending invoice for this fee is superseded.
      db.invoices = db.invoices.filter((i) => !(i.feeId === feeId && i.status !== "paid"));
      db.invoices.push(invoice);
      f.status = "paid";
      f.amountPaid = f.total;
      f.paidAt = paidAt;
      f.invoiceId = invoice.id;
      if (method === "wallet") {
        const label = f.category === "school" ? `${f.session} ${f.semester}` : f.session;
        f.items.forEach((item, n) =>
          db.transactions.unshift({
            id: `txn_${Date.now()}_${n}`,
            type: "debit",
            amount: item.amount,
            description: f.category === "school" && item.code === "SCH" ? `School fee ${label} Semester` : item.name,
            category: `${f.title.split(" — ")[0]} ${f.session}`,
            date: paidAt,
            reference: `${invoice.rrr}-${String(n + 1).padStart(2, "0")}`,
          }),
        );
      }
      db.documents.unshift({
        id: `doc_receipt_${invoice.id}`,
        kind: "fee-receipt",
        title: `Receipt — ${f.title.replace(" — ", " ")} ${f.session}`,
        description: `Paid ${fmt(f.total)} via ${invoice.channel}.`,
        session: f.session,
        issuedAt: paidAt.slice(0, 10),
        status: "available",
        group: "Payments",
        invoiceId: invoice.id,
      });
    });
    return { invoice: stripMock(invoice), fee: db().fees.find((f) => f.id === feeId)!, walletBalance: walletBalance() };
  }, 1300);
}

const fmt = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

export async function verifyPayment(invoiceId: string): Promise<VerificationResult> {
  if (LIVE) return http("POST", `/invoices/${invoiceId}/verify`);
  return mock(() => {
    const inv = db().invoices.find((i) => i.id === invoiceId);
    if (!inv) throw new ApiError("Invoice not found.", 404);
    if (inv.status === "paid") {
      return { outcome: "success", invoice: stripMock(inv), message: "This payment was already confirmed." } as VerificationResult;
    }
    const outcome = inv.verifyOutcome ?? "pending";
    if (outcome === "success") {
      const paidAt = nowIso();
      commit((d) => {
        const i = d.invoices.find((x) => x.id === invoiceId)!;
        i.status = "paid";
        i.paidAt = paidAt;
        const f = d.fees.find((x) => x.id === i.feeId);
        if (f) {
          f.status = "paid";
          f.amountPaid = f.total;
          f.paidAt = paidAt;
          f.invoiceId = i.id;
        }
        d.documents.unshift({
          id: `doc_receipt_${i.id}`,
          kind: "fee-receipt",
          title: `Receipt — ${i.title} ${i.session}`,
          description: `Paid ${fmt(i.amount)} via ${i.channel}.`,
          session: i.session,
          issuedAt: paidAt.slice(0, 10),
          status: "available",
          group: "Payments",
          invoiceId: i.id,
        });
      });
      const fresh = db().invoices.find((i) => i.id === invoiceId)!;
      return { outcome, invoice: stripMock(fresh), message: "Remita confirmed this payment. Your fee record and receipt have been updated." };
    }
    if (outcome === "not_found") {
      return {
        outcome,
        invoice: stripMock(inv),
        message:
          "Remita has no settled payment for this RRR yet. Bank branch payments can take up to 72 hours. If it has been longer, open a support ticket with your teller attached.",
      };
    }
    return { outcome: "pending", invoice: stripMock(inv), message: "The payment is still processing. Check again in a few minutes." };
  }, 1800);
}

/* ------------------------------------------------------------------ */
/* Wallet                                                       GET /wallet */
/* ------------------------------------------------------------------ */

function walletBalance(): number {
  const t = db().transactions;
  return sum(t.filter((x) => x.type === "credit").map((x) => x.amount)) - sum(t.filter((x) => x.type === "debit").map((x) => x.amount));
}

export async function getWallet(): Promise<Wallet> {
  if (LIVE) return http("GET", "/wallet");
  return mock(() => {
    const t = [...db().transactions].sort((a, b) => b.date.localeCompare(a.date));
    const totalCredit = sum(t.filter((x) => x.type === "credit").map((x) => x.amount));
    const totalDebit = sum(t.filter((x) => x.type === "debit").map((x) => x.amount));
    return { balance: totalCredit - totalDebit, totalCredit, totalDebit, transactions: t };
  });
}

/* ------------------------------------------------------------------ */
/* Courses + registration                      /registrations/:session/:sem */
/* ------------------------------------------------------------------ */

function feesPaidFor(session: SessionId, semester: Semester) {
  return db().fees.some((f) => f.category === "school" && f.session === session && f.semester === semester && f.status === "paid");
}

function findReg(session: SessionId, semester: Semester): StoredRegistration {
  return (
    db().registrations.find((r) => r.session === session && r.semester === semester) ?? {
      session,
      semester,
      status: "not_started",
      registered: [],
      submittedAt: null,
    }
  );
}

export async function getCourseRegistration(session: SessionId, semester: Semester): Promise<CourseRegistration> {
  const path = `/registrations/${encodeURIComponent(session)}/${semester}`;
  if (LIVE) return http("GET", path);
  return mock(() => {
    const d = db();
    const reg = findReg(session, semester);
    return {
      ...reg,
      minUnits: d.courseCatalogue.minUnits,
      maxUnits: d.courseCatalogue.maxUnits,
      available: d.courseCatalogue.courses.filter((c) => c.semester === semester),
      feesPaid: feesPaidFor(session, semester),
    };
  });
}

export async function saveCourseRegistration(
  session: SessionId,
  semester: Semester,
  codes: string[],
  submit: boolean,
): Promise<CourseRegistration> {
  const path = `/registrations/${encodeURIComponent(session)}/${semester}`;
  if (LIVE) return http("PUT", path, { courses: codes, submit });
  const d = db();
  const units = sum(d.courseCatalogue.courses.filter((c) => codes.includes(c.code)).map((c) => c.units));
  await wait(submit ? 1100 : 500);
  if (units > d.courseCatalogue.maxUnits) throw new ApiError(`You can register at most ${d.courseCatalogue.maxUnits} units.`);
  if (submit) {
    if (!feesPaidFor(session, semester)) throw new ApiError("Pay your school fee for this semester before submitting.");
    if (units < d.courseCatalogue.minUnits) throw new ApiError(`Register at least ${d.courseCatalogue.minUnits} units before submitting.`);
  }
  commit((db) => {
    const at = nowIso();
    const existing = db.registrations.find((r) => r.session === session && r.semester === semester);
    const next: StoredRegistration = {
      session,
      semester,
      registered: codes,
      status: submit ? "submitted" : "draft",
      submittedAt: submit ? at : null,
    };
    if (existing) Object.assign(existing, next);
    else db.registrations.push(next);
    if (submit) {
      const doc = db.documents.find((x) => x.kind === "course-form" && x.session === session && x.title.includes(semester));
      if (doc) {
        doc.status = "available";
        doc.issuedAt = at.slice(0, 10);
        doc.description = "Submitted course registration, awaiting adviser approval.";
        delete doc.lockedReason;
      } else {
        db.documents.unshift({
          id: `doc_courseform_${Date.now()}`,
          kind: "course-form",
          title: `Course Form — ${session} ${semester} Semester`,
          description: "Submitted course registration, awaiting adviser approval.",
          session,
          issuedAt: at.slice(0, 10),
          status: "available",
          group: "Academic",
        });
      }
    }
  });
  return getCourseRegistration(session, semester);
}

/* ------------------------------------------------------------------ */
/* Results                                                     GET /results */
/* ------------------------------------------------------------------ */

function computeResults(): ResultsSummary {
  const semesters: SemesterResult[] = db()
    .results.map((r) => {
      const courses = r.courses.map((c) => ({ ...c, ...gradeFor(c.score) }));
      return { ...r, courses, totalUnits: sum(courses.map((c) => c.units)), gpa: gpa(courses) };
    })
    .reverse();
  const all = semesters.flatMap((s) => s.courses);
  const cgpa = gpa(all);
  return {
    cgpa,
    totalUnits: sum(all.filter((c) => c.point > 0).map((c) => c.units)),
    classOfDegree: classOfDegree(cgpa),
    semesters,
  };
}

export async function getResults(): Promise<ResultsSummary> {
  if (LIVE) return http("GET", "/results");
  return mock(computeResults);
}

/* ------------------------------------------------------------------ */
/* Programme, e-learning                                                   */
/* ------------------------------------------------------------------ */

export async function getProgramme(): Promise<Programme> {
  if (LIVE) return http("GET", "/programme");
  return mock(() => db().programme);
}

export async function applyForTransfer(input: { programme: string; reason: string }): Promise<{ reference: string }> {
  if (LIVE) return http("POST", "/programme/transfer", input);
  await wait(1100);
  const d = db();
  const feePaid = d.fees.some((f) => f.id.startsWith("fee_cop") && f.status === "paid");
  if (!feePaid) throw new ApiError("Pay the ₦10,000.00 programme transfer fee (Fees → Standalone) before applying.");
  if (!input.programme) throw new ApiError("Choose the programme you want to transfer to.");
  if (input.reason.trim().length < 20) throw new ApiError("Tell us briefly why you want to transfer (at least 20 characters).");
  return { reference: `PT-${new Date().getFullYear()}-${1000 + rand(9000)}` };
}

export async function getElearning(): Promise<Elearning> {
  if (LIVE) return http("GET", "/elearning");
  return mock(() => {
    const d = db();
    const { session, semester } = d.term;
    const reg = findReg(session, semester);
    return {
      ...d.elearning,
      session,
      semester,
      feePaid: feesPaidFor(session, semester),
      courses: d.courseCatalogue.courses.filter((c) => reg.registered.includes(c.code)),
    };
  });
}

export async function registerElearning(): Promise<Elearning> {
  if (LIVE) return http("POST", "/elearning/register");
  await wait(1200);
  const d = db();
  if (!feesPaidFor(d.term.session, d.term.semester)) {
    throw new ApiError("The E-Learning Service charge is part of your school fee. Pay it first.");
  }
  commit((db) => {
    db.elearning.registered = true;
    db.elearning.username = db.student.matricNo.replace(/\//g, "").toLowerCase();
  });
  return getElearning();
}

/* ------------------------------------------------------------------ */
/* Documents                                                 GET /documents */
/* ------------------------------------------------------------------ */

export async function getDocuments(): Promise<PortalDocument[]> {
  if (LIVE) return http("GET", "/documents");
  return mock(() => db().documents);
}

export async function getDocument(id: string): Promise<{ document: PortalDocument; invoice: Invoice | null; fee: Fee | null }> {
  if (LIVE) return http("GET", `/documents/${id}`);
  return mock(() => {
    const d = db();
    const document = d.documents.find((x) => x.id === id);
    if (!document) throw new ApiError("Document not found.", 404);
    const inv = document.invoiceId ? d.invoices.find((i) => i.id === document.invoiceId) : undefined;
    const fee = inv ? (d.fees.find((f) => f.id === inv.feeId) ?? null) : null;
    return { document, invoice: inv ? stripMock(inv) : null, fee };
  }, 200);
}

/* ------------------------------------------------------------------ */
/* Self service: semester registration checklist                           */
/* ------------------------------------------------------------------ */

export async function getSemesterChecklist(): Promise<SemesterChecklist> {
  if (LIVE) return http("GET", "/self-service/checklist");
  return mock(() => {
    const d = db();
    const { session, semester } = d.term;
    const reg = findReg(session, semester);
    const bio = d.biodata;
    const bioComplete = [bio.bio.lga, bio.bio.homeAddress, bio.nextOfKin.phone, bio.health.genotype].every(Boolean);
    return {
      session,
      semester,
      steps: [
        { id: "biodata", label: "Bio data complete", description: "Personal, health, next of kin and sponsorship records.", done: bioComplete, href: "/biodata", action: "Review bio data" },
        { id: "fees", label: "School fee paid", description: `${session} ${semester} Semester school fee.`, done: feesPaidFor(session, semester), href: "/fees", action: "Pay school fee" },
        { id: "courses", label: "Courses registered", description: "Submit your course registration for adviser approval.", done: reg.status === "submitted" || reg.status === "approved", href: "/academics/registration", action: "Register courses" },
        { id: "elearning", label: "E-learning activated", description: "Access lecture materials and online CBT on the LMS.", done: d.elearning.registered, href: "/academics/e-learning", action: "Activate e-learning" },
      ],
    };
  });
}

/* ------------------------------------------------------------------ */
/* Support tickets                                             /tickets */
/* ------------------------------------------------------------------ */

export async function getTickets(): Promise<Ticket[]> {
  if (LIVE) return http("GET", "/tickets");
  return mock(() => [...db().tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

export async function getTicket(id: string): Promise<Ticket> {
  if (LIVE) return http("GET", `/tickets/${id}`);
  return mock(() => {
    const t = db().tickets.find((x) => x.id === id);
    if (!t) throw new ApiError("We couldn't find that ticket.", 404);
    return t;
  });
}

export async function createTicket(input: NewTicket): Promise<Ticket> {
  if (LIVE) return http("POST", "/tickets", input);
  return mock(() => {
    if (input.subject.trim().length < 5) throw new ApiError("Add a short subject (at least 5 characters).");
    if (input.body.trim().length < 15) throw new ApiError("Describe the issue in a little more detail.");
    const at = nowIso();
    const s = db().student;
    const ticket: Ticket = {
      id: `TCK-${24103 + db().tickets.length}`,
      subject: input.subject.trim(),
      category: input.category,
      priority: input.priority,
      status: "open",
      createdAt: at,
      updatedAt: at,
      messages: [{ id: "m1", author: "student", name: `${s.firstName} ${s.lastName}`, body: input.body.trim(), at, attachment: input.attachment }],
    };
    commit((d) => d.tickets.unshift(ticket));
    return ticket;
  }, 900);
}

export async function replyToTicket(id: string, body: string, attachment?: string): Promise<Ticket> {
  if (LIVE) return http("POST", `/tickets/${id}/messages`, { body, attachment });
  return mock(() => {
    if (!body.trim()) throw new ApiError("Write a message first.");
    const s = db().student;
    commit((d) => {
      const t = d.tickets.find((x) => x.id === id);
      if (!t) throw new ApiError("Ticket not found.", 404);
      const at = nowIso();
      t.messages.push({ id: `m${t.messages.length + 1}`, author: "student", name: `${s.firstName} ${s.lastName}`, body: body.trim(), at, attachment });
      t.updatedAt = at;
      if (t.status === "resolved" || t.status === "closed") t.status = "open";
    });
    return db().tickets.find((x) => x.id === id)!;
  }, 600);
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                GET /dashboard */
/* ------------------------------------------------------------------ */

export async function getDashboard(): Promise<Dashboard> {
  if (LIVE) return http("GET", "/dashboard");
  return mock(() => {
    const d = db();
    const { session, semester } = d.term;
    const results = computeResults();
    const reg = findReg(session, semester);
    const regCourses = d.courseCatalogue.courses.filter((c) => reg.registered.includes(c.code));
    const schoolFee = d.fees.find((f) => f.category === "school" && f.session === session && f.semester === semester) ?? null;
    const txns = [...d.transactions].sort((a, b) => b.date.localeCompare(a.date));
    return {
      student: d.student,
      term: d.term,
      cgpa: results.cgpa,
      classOfDegree: results.classOfDegree,
      totalUnitsEarned: results.totalUnits,
      registration: { status: reg.status, courses: regCourses.length, units: sum(regCourses.map((c) => c.units)), maxUnits: d.courseCatalogue.maxUnits },
      payment: {
        status: schoolFee?.status ?? "upcoming",
        outstanding: schoolFee && schoolFee.status !== "paid" ? schoolFee.total - schoolFee.amountPaid : 0,
        paid: schoolFee?.amountPaid ?? 0,
        feeId: schoolFee?.id ?? null,
      },
      wallet: { balance: walletBalance(), recent: txns.slice(0, 5) },
      openTickets: d.tickets.filter((t) => t.status === "open" || t.status === "in_progress").length,
    };
  });
}

/** Demo only: restore the seeded data set. */
export function resetDemoData() {
  if (!LIVE) resetDb();
}
