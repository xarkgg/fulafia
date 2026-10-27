import { Logo } from "@/components/ui/misc";

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="text-center">
        <Logo className="mx-auto h-14" />
        <p className="mt-4 text-sm text-muted">Integrity, Innovation, Excellence</p>
      </div>
    </main>
  );
}
