import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Eye,
  Search,
  Pill,
  ClipboardList,
  UserRound,
  CalendarCheck,
  Video,
  PillBottle,
  LayoutDashboard,
  Mail,
  Phone,
  Twitter,
  Instagram,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { Hero } from "@/components/pet/pet-hero";
import { Reminders } from "@/components/pet/pet-reminders";
import { ServiceGrid } from "@/components/pet/pet-service-grid";

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
        <Hero />
        <div className="bg-white rounded-t-[3rem] shadow-xl shadow-orange-100/50 relative z-10 pb-20">
          <Reminders />
          <ServiceGrid />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-paw-dark text-slate-400 py-16 rounded-t-[3rem] -mt-10 relative z-0">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <span className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-2 mb-6">
                Paw<span className="text-paw-primary">Pulse</span>
              </span>
              <p className="text-sm leading-relaxed mb-6 font-medium text-slate-400 max-w-xs">
                Making veterinary care accessible, reliable, and just a little
                bit more fun for everyone.
              </p>
              <div className="flex gap-4">
                <div className="bg-slate-800 p-2 rounded-full hover:bg-paw-primary hover:text-white transition-colors cursor-pointer">
                  <Instagram size={20} />
                </div>
                <div className="bg-slate-800 p-2 rounded-full hover:bg-paw-primary hover:text-white transition-colors cursor-pointer">
                  <Twitter size={20} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-display font-bold mb-6 text-lg">
                Services
              </h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li className="hover:text-paw-primary cursor-pointer transition-colors">
                  Video Consult
                </li>
                <li className="hover:text-paw-primary cursor-pointer transition-colors">
                  Pharmacy
                </li>
                <li className="hover:text-paw-primary cursor-pointer transition-colors">
                  Emergency
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-display font-bold mb-6 text-lg">
                Company
              </h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li className="hover:text-paw-primary cursor-pointer transition-colors">
                  About
                </li>
                <li className="hover:text-paw-primary cursor-pointer transition-colors">
                  Vets
                </li>
                <li className="hover:text-paw-primary cursor-pointer transition-colors">
                  Contact
                </li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h4 className="text-white font-display font-bold mb-6 text-lg">
                Get Help
              </h4>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-paw-primary/20 flex items-center justify-center text-paw-primary">
                    <Phone size={16} fill="currentColor" />
                  </div>
                  <span className="hover:text-white transition-colors cursor-pointer">
                    1-800-PAW-HELP
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-paw-primary/20 flex items-center justify-center text-paw-primary">
                    <Mail size={16} fill="currentColor" />
                  </div>
                  <span className="hover:text-white transition-colors cursor-pointer">
                    help@pawpulse.com
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-slate-800 text-center text-xs font-bold uppercase tracking-widest text-slate-600">
            © 2024 PawPulse Inc. Made with 🦴
          </div>
        </div>
      </footer>
    </div>
  );
}
