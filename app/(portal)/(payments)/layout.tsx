import { SectionNav } from "@/components/shell/section-nav";

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SectionNav section="payments" label="Payments sections" />
      {children}
    </>
  );
}
