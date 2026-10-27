/**
 * Domain types for the FULafia student portal.
 * These are the contract between the UI and the data layer (lib/api.ts).
 * A real backend only needs to return these shapes.
 */

export type Semester = "First" | "Second";
export type SessionId = string; // e.g. "2026/2027"

export type CurrentTerm = { session: SessionId; semester: Semester };

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  matricNo: string;
  jambRegNo: string;
  email: string;
  personalEmail: string;
  phone: string;
  altPhone?: string;
  level: number;
  programme: string;
  department: string;
  faculty: string;
  entryMode: string;
  admittedSession: SessionId;
  programmeDuration: number;
  currentSession: SessionId;
  currentSemester: Semester;
  status: "Active" | "Suspended" | "Graduated";
  contactAddress: string;
  photoUrl: string | null;
};

export type BioInfo = {
  country: string;
  state: string;
  lga: string;
  contactAddress: string;
  hometown: string;
  homeAddress: string;
  placeOfBirth: string;
  dateOfBirth: string; // ISO date; locked, changed only by the registry
  tribe: string;
  gender: string;
  religion: string;
  maritalStatus: string;
};

export type HealthInfo = {
  bloodGroup: string;
  genotype: string;
  height: string;
  weight: string;
  allergies: string;
  disabilities: string;
  medicalConditions: string;
  emergencyClinic: string;
};

export type NextOfKin = {
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
  occupation: string;
  address: string;
};

export type Sponsorship = {
  sponsorType: string;
  sponsorName: string;
  phone: string;
  email: string;
  address: string;
  relationship: string;
};

export type BioData = { bio: BioInfo; health: HealthInfo; nextOfKin: NextOfKin; sponsorship: Sponsorship };
export type BioSection = keyof BioData;

export type FeeCategory = "school" | "standalone" | "association";
export type FeeStatus = "paid" | "unpaid" | "upcoming";

export type FeeItem = { code: string; name: string; amount: number };

export type Fee = {
  id: string;
  category: FeeCategory;
  session: SessionId;
  semester: Semester | null;
  title: string;
  items: FeeItem[];
  total: number;
  amountPaid: number;
  status: FeeStatus;
  paidAt: string | null;
  invoiceId: string | null;
  dueDate: string | null;
  optional: boolean;
  note: string | null;
};

export type InvoiceStatus = "paid" | "pending" | "unpaid" | "failed";

export type Invoice = {
  id: string;
  rrr: string; // Remita Retrieval Reference (or wallet reference)
  feeId: string;
  title: string;
  session: SessionId;
  amount: number;
  status: InvoiceStatus;
  channel: string;
  createdAt: string;
  paidAt: string | null;
};

export type PaymentMethod = "wallet" | "remita";

export type PaymentResult = { invoice: Invoice; fee: Fee; walletBalance: number };

export type VerificationResult =
  | { outcome: "success"; invoice: Invoice; message: string }
  | { outcome: "pending"; invoice: Invoice; message: string }
  | { outcome: "not_found"; invoice: Invoice; message: string };

export type WalletTransaction = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  category: string;
  date: string;
  reference: string;
};

export type Wallet = {
  balance: number;
  totalCredit: number;
  totalDebit: number;
  transactions: WalletTransaction[]; // newest first
};

export type CourseType = "core" | "elective" | "gst";

export type Course = {
  code: string;
  title: string;
  units: number;
  type: CourseType;
  semester: Semester;
  level: number;
  lecturer?: string;
};

export type RegistrationStatus = "not_started" | "draft" | "submitted" | "approved";

export type CourseRegistration = {
  session: SessionId;
  semester: Semester;
  status: RegistrationStatus;
  minUnits: number;
  maxUnits: number;
  available: Course[];
  registered: string[]; // course codes
  submittedAt: string | null;
  feesPaid: boolean;
};

export type CourseResult = { code: string; title: string; units: number; score: number; grade: string; point: number };

export type SemesterResult = {
  session: SessionId;
  semester: Semester;
  level: number;
  publishedAt: string;
  courses: CourseResult[];
  totalUnits: number;
  gpa: number;
};

export type ResultsSummary = {
  cgpa: number;
  totalUnits: number;
  classOfDegree: string;
  semesters: SemesterResult[]; // newest first
};

export type Programme = {
  programme: string;
  degree: string;
  faculty: string;
  department: string;
  level: number;
  duration: number;
  admittedSession: SessionId;
  entryMode: string;
  expectedGraduation: SessionId;
  studyMode: string;
  transfer: { open: boolean; window: string; fee: number; requirements: string[]; notes: string[]; feeNotice: string };
};

export type Elearning = {
  platform: string;
  platformUrl: string;
  registered: boolean;
  username: string | null;
  session: SessionId;
  semester: Semester;
  feeName: string;
  feeAmount: number;
  feePaid: boolean;
  courses: Course[];
  benefits: string[];
};

export type DocumentKind =
  | "admission-letter"
  | "application-summary"
  | "screening-invoice"
  | "course-form"
  | "bio-data"
  | "fee-receipt";

export type PortalDocument = {
  id: string;
  kind: DocumentKind;
  title: string;
  description: string;
  session: SessionId | null;
  issuedAt: string | null;
  status: "available" | "locked";
  lockedReason?: string;
  group: "Admission" | "Academic" | "Payments";
  invoiceId?: string;
};

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory =
  | "Payments"
  | "Course registration"
  | "Results"
  | "Bio data"
  | "E-learning"
  | "Accommodation"
  | "Technical issue"
  | "Other";

export type TicketMessage = {
  id: string;
  author: "student" | "staff";
  name: string;
  body: string;
  at: string;
  attachment?: string;
};

export type Ticket = {
  id: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: "low" | "normal" | "high";
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

export type NewTicket = { subject: string; category: TicketCategory; priority: Ticket["priority"]; body: string; attachment?: string };

export type SemesterChecklist = {
  session: SessionId;
  semester: Semester;
  steps: { id: string; label: string; description: string; done: boolean; href: string; action: string }[];
};

export type Dashboard = {
  student: Student;
  term: CurrentTerm;
  cgpa: number;
  classOfDegree: string;
  totalUnitsEarned: number;
  registration: { status: RegistrationStatus; courses: number; units: number; maxUnits: number };
  payment: { status: FeeStatus; outstanding: number; paid: number; feeId: string | null };
  wallet: { balance: number; recent: WalletTransaction[] };
  openTickets: number;
};

export type ProfileUpdate = Partial<Pick<Student, "phone" | "altPhone" | "personalEmail" | "contactAddress" | "photoUrl">>;
