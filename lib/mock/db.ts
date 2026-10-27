/**
 * In-browser mock database.
 *
 * Seeds from the JSON files in ./data and persists every change to localStorage,
 * so the demo behaves like a real portal (pay a fee → wallet drops, receipt appears,
 * course registration unlocks) and survives a refresh. Not used when
 * NEXT_PUBLIC_API_BASE_URL is set.
 */
import studentSeed from "./data/student.json";
import sessionsSeed from "./data/sessions.json";
import biodataSeed from "./data/biodata.json";
import feesSeed from "./data/fees.json";
import invoicesSeed from "./data/invoices.json";
import walletSeed from "./data/wallet.json";
import coursesSeed from "./data/courses.json";
import resultsSeed from "./data/results.json";
import programmeSeed from "./data/programme.json";
import elearningSeed from "./data/elearning.json";
import documentsSeed from "./data/documents.json";
import ticketsSeed from "./data/tickets.json";
import type {
  BioData,
  Course,
  CurrentTerm,
  Fee,
  Invoice,
  PortalDocument,
  Programme,
  RegistrationStatus,
  Semester,
  SessionId,
  Student,
  Ticket,
  WalletTransaction,
} from "../types";

export type RawResult = {
  session: SessionId;
  semester: Semester;
  level: number;
  publishedAt: string;
  courses: { code: string; title: string; units: number; score: number }[];
};

export type StoredRegistration = {
  session: SessionId;
  semester: Semester;
  status: RegistrationStatus;
  registered: string[];
  submittedAt: string | null;
};

export type MockInvoice = Invoice & { verifyOutcome?: "success" | "pending" | "not_found" };

export type DB = {
  student: Student;
  term: CurrentTerm;
  sessions: SessionId[];
  biodata: BioData;
  fees: Fee[];
  invoices: MockInvoice[];
  transactions: WalletTransaction[];
  courseCatalogue: { minUnits: number; maxUnits: number; courses: Course[] };
  registrations: StoredRegistration[];
  results: RawResult[];
  programme: Programme;
  elearning: { registered: boolean; username: string | null; platform: string; platformUrl: string; feeName: string; feeAmount: number; benefits: string[] };
  documents: PortalDocument[];
  tickets: Ticket[];
  password: string;
};

const KEY = "fulafia.demo.db.v1";

function seed(): DB {
  const clone = <T>(v: unknown) => JSON.parse(JSON.stringify(v)) as T;
  return {
    student: clone(studentSeed),
    term: clone(sessionsSeed.current),
    sessions: clone(sessionsSeed.sessions),
    biodata: clone(biodataSeed),
    fees: clone(feesSeed),
    invoices: clone(invoicesSeed),
    transactions: clone(walletSeed.transactions),
    courseCatalogue: clone({ minUnits: coursesSeed.minUnits, maxUnits: coursesSeed.maxUnits, courses: coursesSeed.courses }),
    registrations: clone(coursesSeed.registrations),
    results: clone(resultsSeed),
    programme: clone(programmeSeed),
    elearning: clone(elearningSeed),
    documents: clone(documentsSeed),
    tickets: clone(ticketsSeed),
    password: "demo",
  };
}

let cache: DB | null = null;

export function db(): DB {
  if (cache) return cache;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        cache = JSON.parse(raw) as DB;
        return cache;
      }
    } catch {
      /* corrupted or blocked storage: fall back to seed */
    }
  }
  cache = seed();
  return cache;
}

export function commit(mutate: (d: DB) => void) {
  const d = db();
  mutate(d);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(d));
    } catch {
      /* storage full (e.g. large photo): keep in memory */
    }
  }
}

export function resetDb() {
  cache = seed();
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}
