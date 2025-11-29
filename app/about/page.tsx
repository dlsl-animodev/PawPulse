import { About } from "@/components/about";

export default async function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans w-full max-w-4xl mx-auto">
      <main className="flex-1">
        <About />
      </main>
    </div>
  );
}
