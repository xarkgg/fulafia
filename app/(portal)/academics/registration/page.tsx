import type { Metadata } from "next";
import { RegistrationView } from "./registration-view";

export const metadata: Metadata = { title: "Course registration" };

export default function Page() {
  return <RegistrationView />;
}
