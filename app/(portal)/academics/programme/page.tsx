import type { Metadata } from "next";
import { ProgrammeView } from "./programme-view";

export const metadata: Metadata = { title: "Choice of programme" };

export default function Page() {
  return <ProgrammeView />;
}
