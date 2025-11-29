"use client";

import { useState } from "react";
import { Bell, Menu, X } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { signout } from "@/app/login/actions";
import Link from "next/link";

interface Profile {
  full_name: string | null;
  role: string | null;
  email: string | null;
}

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavCluster {
  label: string;
  items: NavItem[];
}

interface PetHeaderActionsProps {
  user: User | null;
  profile: Profile | null;
  navClusters?: NavCluster[];
}

export function PetHeaderActions({
  user,
  profile,
  navClusters,
}: PetHeaderActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signout();
    setIsMenuOpen(false);
  };

  const userName = profile?.full_name || user?.email || "Guest";
  const userRole = profile?.role || "Member";
  // Generate initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const initials = getInitials(userName);

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        <button className="relative p-3 text-paw-text hover:text-paw-primary transition-colors rounded-full hover:bg-paw-soft">
          <Bell size={26} strokeWidth={2.5} />
          <span className="absolute top-3 right-3 w-3 h-3 bg-paw-primary rounded-full border-2 border-white animate-pulse"></span>
        </button>

        {user ? (
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-orange-100">
            <div className="w-11 h-11 rounded-full bg-paw-soft flex items-center justify-center border-2 border-white shadow-sm overflow-hidden ring-2 ring-transparent hover:ring-paw-primary/50 transition-all cursor-pointer group relative">
              {/* Placeholder for avatar or initials */}
              <span className="text-paw-primary font-bold text-lg">
                {initials}
              </span>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-orange-100">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full bg-paw-primary text-white font-bold hover:bg-paw-dark transition-colors"
            >
              Login
            </Link>
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden p-2 text-paw-dark hover:text-paw-primary bg-paw-soft/50 hover:bg-paw-soft rounded-2xl transition-all"
        >
          <Menu size={32} strokeWidth={2.5} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-paw-dark/20 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          <div className="absolute inset-y-0 right-0 w-full max-w-[85vw] bg-white shadow-2xl p-6 flex flex-col rounded-l-[2rem]">
            <div className="flex justify-between items-center mb-8">
              <span className="text-3xl font-display font-bold text-paw-dark">
                Menu
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-3 bg-paw-soft rounded-full text-paw-primary hover:bg-orange-100 transition-colors"
              >
                <X size={28} strokeWidth={2.5} />
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-4 mb-8 p-5 bg-paw-soft border border-orange-100 rounded-3xl">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                  <span className="text-paw-primary font-bold text-xl">
                    {initials}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-paw-dark text-xl">{userName}</p>
                  <p className="text-xs text-white font-bold bg-paw-secondary px-3 py-1 rounded-full inline-block mt-1 shadow-sm capitalize">
                    {userRole}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <Link
                  href="/login"
                  className="w-full block text-center bg-paw-primary text-white font-bold py-4 rounded-3xl shadow-lg shadow-paw-primary/30 active:scale-95 transition-transform text-lg"
                >
                  Login / Sign Up
                </Link>
              </div>
            )}

            <nav className="flex flex-col space-y-3 flex-1 overflow-y-auto">
              {(navClusters
                ? navClusters.flatMap((c) => c.items)
                : [
                    { label: "Home", href: "/" },
                    { label: "Book Vet", href: "/book" },
                    { label: "Pharmacy", href: "/dashboard?tab=prescriptions" },
                    { label: "My Pets", href: "/pet-profile" },
                    { label: "History", href: "/history" },
                  ]
              ).map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-6 py-4 rounded-3xl text-paw-text hover:text-white hover:bg-paw-primary font-bold text-xl transition-all flex justify-between items-center group active:scale-95"
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </span>
                  <span className="text-orange-200 group-hover:text-white/80 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </Link>
              ))}
            </nav>

            {user && (
              <button
                onClick={handleSignOut}
                className="w-full mt-6 bg-paw-dark text-white font-bold py-5 rounded-3xl shadow-xl shadow-paw-dark/20 active:scale-95 transition-transform text-lg"
              >
                Log Out
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
