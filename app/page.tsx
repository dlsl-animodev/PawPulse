import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart,
  Eye,
  Wind,
  SmilePlus,
  Search,
  Pill,
  ClipboardList,
  UserRound,
  CalendarCheck,
  Video,
  PillBottle,
  LayoutDashboard,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";

const SPECIALTIES = [
  { name: "General Medicine", icon: PillBottle },
  { name: "Optometrist", icon: Eye },
  { name: "Pulmonologist", icon: Wind },
  { name: "Dentist", icon: SmilePlus },
  { name: "Cardiologist", icon: Heart },
];

const HOW_IT_WORKS = [
  {
    title: "Choose Your Doctor",
    description:
      "Browse the list of available doctors and select one that matches your medical needs or specialty.",
    icon: UserRound,
  },
  {
    title: "Book Your Appointment",
    description: "Pick your preferred date, time, and consultation type.",
    icon: CalendarCheck,
  },
  {
    title: "Meet your doctor online",
    description:
      "Connect with your doctor and receive your medical evaluation right from your device.",
    icon: Video,
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName = "Guest";
  let role: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    if (profile?.full_name) {
      firstName = profile.full_name.split(" ")[0];
    }
    role = profile?.role || null;
  }

  // Redirect doctors to the dashboard
  if (role === "doctor") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-10">
          {/* Greeting + Search */}
          <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Hello,{" "}
                {firstName
                  ? `${firstName[0].toUpperCase()}${firstName
                      .slice(1)
                      .toLowerCase()}`
                  : ""}
                ! 👋
              </h1>
              <p className="text-slate-500">How are you feeling?</p>
            </div>
            <div className="relative w-full md:w-80">
              <Input
                placeholder="Search doctors, medicines..."
                aria-label="Search"
                className="pl-10 rounded-full border-slate-200"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </section>

          {/* Specialties - centered */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Specialties
              </h2>
              <Link
                href="/book"
                className="text-sm text-blue-600 hover:underline"
              >
                See More
              </Link>
            </div>

            {/* Centered scrollable row with larger icons */}
            <div className="flex gap-6 overflow-x-auto pb-2 justify-center">
              {SPECIALTIES.map((specialty, idx) => (
                <Link
                  key={idx}
                  href="/book"
                  className="flex flex-col items-center gap-2 min-w-24 text-center"
                  aria-label={`Specialty ${specialty.name}`}
                >
                  <div className="h-16 w-16 rounded-full border-2 border-blue-200 bg-white flex items-center justify-center text-blue-600 hover:bg-blue-50 transition">
                    <specialty.icon className="h-7 w-7" />
                  </div>
                  <span className="text-xs text-slate-600">
                    {specialty.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-3xl bg-blue-50 p-6 flex flex-col justify-between min-h-60">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  Not feeling well?
                </h3>
                <p className="text-slate-500 text-sm">
                  Need to talk to a doctor?
                </p>
              </div>
              <Link href="/book">
                <Button className="mt-6 w-full rounded-full bg-blue-600 hover:bg-blue-700">
                  Book consultation now
                </Button>
              </Link>
            </div>

            {/* Right: stacked cards (narrower) */}
            <div className="flex flex-col gap-6">
              <Link
                href="/dashboard"
                className="rounded-2xl border border-slate-200 bg-white p-7 flex items-center gap-4 hover:shadow-md transition"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Dashboard</h4>
                  <p className="text-xs text-slate-500">
                    View your consultations
                  </p>
                </div>
              </Link>
              <div className="rounded-2xl border border-slate-200 bg-white p-7 flex items-center gap-4 hover:shadow-md transition">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Pill className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">
                    Order medicine
                  </h4>
                  <p className="text-xs text-slate-500">Pharmacy Delivery</p>
                </div>
              </div>

              <Link
                href="/history"
                className="rounded-2xl border border-slate-200 bg-white p-7 flex items-center gap-4 hover:shadow-md transition"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">My History</h4>
                  <p className="text-xs text-slate-500">Medical Records</p>
                </div>
              </Link>
            </div>
          </section>

          {/* How it works */}
          <section className="py-8">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-6 text-center hover:shadow-lg transition"
                >
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500">{step.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4">For Patients</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/book" className="hover:text-white">
                    Book Consultation
                  </Link>
                </li>
                <li>
                  <Link href="/book" className="hover:text-white">
                    Specialties
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Hospitals
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Pharmacies
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Medical Insurance
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    HMOs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Services
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Doctors</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/dashboard" className="hover:text-white">
                    Doctor Portal
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">
                For Delivery Drivers
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white">
                    Delivery Portal
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Social Medias</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-blue-600 transition"
                  aria-label="Facebook"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-red-500 transition"
                  aria-label="YouTube"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.615 3.184A2.993 2.993 0 0017.5 2H6.5a2.993 2.993 0 00-2.115.784A2.993 2.993 0 003.5 5v14c0 .828.336 1.578.885 2.116A2.993 2.993 0 006.5 22h11a2.993 2.993 0 002.115-.884A2.993 2.993 0 0020.5 19V5a2.993 2.993 0 00-.885-1.816zM10 15.5v-7l6 3.5-6 3.5z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-sky-500 transition"
                  aria-label="Twitter"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.844" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-blue-700 transition"
                  aria-label="LinkedIn"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
