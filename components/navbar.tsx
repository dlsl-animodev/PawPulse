import React from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import {
  HeartPulse,
  LayoutDashboard,
  Notebook,
  NotebookPen,
  Stethoscope,
  Users,
} from "lucide-react";
import UserDropdown from "./user-dropdown";

type NavCluster = {
  label: string;
  items: { href: string; label: string; icon?: React.ReactNode }[];
};

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const role = profile?.role === "doctor" ? "doctor" : user ? "patient" : null;

  const navClusters: NavCluster[] =
    role === "doctor"
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
                href: "/dashboard",
                label: "Dashboard",
                icon: <LayoutDashboard className="h-4 w-4" />,
              },
              {
                href: "/book",
                label: "Find doctors",
                icon: <Stethoscope className="h-4 w-4" />,
              },
            ],
          },
          {
            label: "Health",
            items: [
              {
                href: "/dashboard?tab=prescriptions",
                label: "Prescriptions",
                icon: <Notebook className="h-4 w-4" />,
              },
            ],
          },
        ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
            <HeartPulse className="h-6 w-6" />
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">
            CareLink
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-5">
                {navClusters.map((cluster) => (
                  <div key={cluster.label} className="flex items-center gap-4">
                    {cluster.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}
                    <div className="h-6 w-px bg-slate-200" />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                <UserDropdown
                  userName={profile?.full_name || "Guest User"}
                  isAnonymous={user?.is_anonymous ?? false}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:cursor-pointer"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 px-6 hover:cursor-pointer">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
