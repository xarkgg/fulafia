import { SectionNav } from "@/components/shell/section-nav";

export default function AcademicsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SectionNav section="academics" label="Academics sections" />
      {children}
    </>
  );
}
