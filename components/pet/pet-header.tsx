import { createClient } from "@/utils/supabase/server";
import {
  PawPrint,
  LayoutDashboard,
  Users,
  NotebookPen,
  Notebook,
  Stethoscope,
  History,
  Pill,
  Home,
  Dog,
} from "lucide-react";
import { PetHeaderActions } from "./pet-header-actions";
import Link from "next/link";

type NavCluster = {
  label: string;
  items: { href: string; label: string; icon?: React.ReactNode }[];
};

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, role, email")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const role =
    profile?.role === "veterinarian"
      ? "veterinarian"
      : user
      ? "pet_owner"
      : null;

  const navClusters: NavCluster[] =
    role === "veterinarian"
      ? [
          {
            label: "Practice",
            items: [
              {
                href: "/dashboard",
                label: "Today's schedule",
                icon: <LayoutDashboard className="h-4 w-4" />,
              },
              {
                href: "/dashboard?view=queue",
                label: "Patient queue",
                icon: <Users className="h-4 w-4" />,
              },
            ],
          },
          {
            label: "Care tools",
            items: [
              {
                href: "/book",
                label: "Book follow-up",
                icon: <NotebookPen className="h-4 w-4" />,
              },
              {
                href: "/dashboard?view=notes",
                label: "Notes & Rx",
                icon: <Notebook className="h-4 w-4" />,
              },
            ],
          },
        ]
      : [
          {
            label: "Care",
            items: [
              {
                href: "/",
                label: "Home",
                icon: <Home className="h-4 w-4" />,
              },
              {
                href: "/book",
                label: "Book Vet",
                icon: <Stethoscope className="h-4 w-4" />,
              },
              {
                href: "/pet-profile",
                label: "My Pets",
                icon: <Dog className="h-4 w-4" />,
              },
            ],
          },
          {
            label: "Health",
            items: [
              {
                href: "/dashboard?tab=prescriptions",
                label: "Pharmacy",
                icon: <Pill className="h-4 w-4" />,
              },
              {
                href: "/history",
                label: "History",
                icon: <History className="h-4 w-4" />,
              },
            ],
          },
        ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-orange-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 sm:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 cursor-pointer group select-none"
          >
            <div className="bg-paw-primary text-white p-2.5 rounded-full shadow-lg shadow-paw-primary/30 transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
              <PawPrint size={26} fill="currentColor" />
            </div>
            <span className="text-2xl sm:text-3xl font-display font-bold text-paw-dark tracking-tight">
              Paw<span className="text-paw-primary">Pulse</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4">
            {user &&
              navClusters.map((cluster) => (
                <div key={cluster.label} className="flex items-center gap-1">
                  {cluster.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-paw-text hover:text-white hover:bg-paw-primary font-bold text-sm transition-all duration-200"
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
          </nav>

          {/* Actions */}
          <PetHeaderActions
            user={user}
            profile={profile}
            navClusters={navClusters}
          />
        </div>
      </div>
    </header>
  );
}
