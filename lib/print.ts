import type { PortalDocument, Semester, SessionId } from "./types";

/** URLs for the printable document views at /print. They open in a new tab and offer "Save as PDF". */
export const printHref = {
  fee: (feeId: string) => `/print?type=fee&fee=${encodeURIComponent(feeId)}`,
  invoice: (invoiceId: string) => `/print?type=fee&invoice=${encodeURIComponent(invoiceId)}`,
  courseForm: (session: SessionId, semester: Semester) =>
    `/print?type=course-form&session=${encodeURIComponent(session)}&semester=${semester}`,
  bioData: () => `/print?type=bio-data`,
  simple: (type: "admission-letter" | "application-summary" | "screening-invoice") => `/print?type=${type}`,
};

export function documentHref(doc: PortalDocument): string {
  switch (doc.kind) {
    case "fee-receipt":
      return doc.invoiceId ? printHref.invoice(doc.invoiceId) : "#";
    case "course-form":
      return printHref.courseForm(doc.session ?? "", doc.title.includes("Second") ? "Second" : "First");
    case "bio-data":
      return printHref.bioData();
    default:
      return printHref.simple(doc.kind);
  }
}
