import {
  BadgeCheck,
  BookOpenCheck,
  FileText,
  GraduationCap,
  House,
  IdCard,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  MonitorPlay,
  ReceiptText,
  Route,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; description?: string };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  { label: "Overview", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Academics",
    items: [
      { href: "/academics/registration", label: "Course registration", icon: BookOpenCheck, description: "Add, drop and submit courses" },
      { href: "/academics/results", label: "Results", icon: GraduationCap, description: "GPA, CGPA and grades" },
      { href: "/academics/programme", label: "Choice of programme", icon: Route, description: "Programme details and transfer" },
      { href: "/academics/e-learning", label: "E-learning", icon: MonitorPlay, description: "LMS registration" },
    ],
  },
  {
    label: "Payments",
    items: [
      { href: "/fees", label: "Fees", icon: ReceiptText, description: "School fee, standalone and dues" },
      { href: "/wallet", label: "Wallet", icon: Wallet, description: "Balance and transactions" },
      { href: "/self-service", label: "Self service", icon: BadgeCheck, description: "Verify payments, registration status" },
    ],
  },
  {
    label: "Records",
    items: [
      { href: "/biodata", label: "Bio data", icon: IdCard, description: "Personal, health and next of kin" },
      { href: "/documents", label: "Documents", icon: FileText, description: "Letters, forms and receipts" },
    ],
  },
  {
    label: "Help",
    items: [
      { href: "/support", label: "Support", icon: LifeBuoy, description: "Tickets and help" },
      { href: "/account", label: "Account", icon: UserRound, description: "Profile and security" },
    ],
  },
];

export const ALL_ITEMS = NAV.flatMap((g) => g.items);

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function titleFor(pathname: string): string {
  if (pathname.startsWith("/support/new")) return "New ticket";
  return ALL_ITEMS.find((i) => isActive(pathname, i.href))?.label ?? "FULafia Portal";
}

export type TabDef = { label: string; href: string; icon: LucideIcon; match: string[] };

export const BOTTOM_TABS: TabDef[] = [
  { label: "Home", href: "/dashboard", icon: House, match: ["/dashboard"] },
  { label: "Academics", href: "/academics/registration", icon: GraduationCap, match: ["/academics"] },
  { label: "Payments", href: "/fees", icon: ReceiptText, match: ["/fees", "/wallet", "/self-service"] },
  { label: "Support", href: "/support", icon: LifeBuoy, match: ["/support"] },
];

export const MORE_TAB = { label: "More", icon: LayoutGrid, match: ["/biodata", "/documents", "/account"] };

/** Pages shown in the mobile "More" sheet. */
export const MORE_ITEMS: NavItem[] = [
  ALL_ITEMS.find((i) => i.href === "/biodata")!,
  ALL_ITEMS.find((i) => i.href === "/documents")!,
  ALL_ITEMS.find((i) => i.href === "/wallet")!,
  ALL_ITEMS.find((i) => i.href === "/self-service")!,
  ALL_ITEMS.find((i) => i.href === "/academics/e-learning")!,
  ALL_ITEMS.find((i) => i.href === "/account")!,
];

export const SECTIONS: Record<"academics" | "payments", NavItem[]> = {
  academics: NAV[1]!.items,
  payments: NAV[2]!.items,
};
