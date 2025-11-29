"use client";

import { useState } from "react";
import { PawPrint, Bell, Menu, X, User } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-orange-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer group select-none">
              <div className="bg-paw-primary text-white p-2.5 rounded-full shadow-lg shadow-paw-primary/30 transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                <PawPrint size={26} fill="currentColor" />
              </div>
              <span className="text-2xl sm:text-3xl font-display font-bold text-paw-dark tracking-tight">
                Paw<span className="text-paw-primary">Pulse</span>
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-1">
              {["Home", "Book Vet", "Pharmacy", "My Pets", "History"].map(
                (item) => (
                  <a
                    key={item}
                    href="#"
                    className="px-5 py-2.5 rounded-full text-paw-text hover:text-white hover:bg-paw-primary font-bold text-sm transition-all duration-200"
                  >
                    {item}
                  </a>
                )
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="relative p-3 text-paw-text hover:text-paw-primary transition-colors rounded-full hover:bg-paw-soft">
                <Bell size={26} strokeWidth={2.5} />
                <span className="absolute top-3 right-3 w-3 h-3 bg-paw-primary rounded-full border-2 border-white animate-pulse"></span>
              </button>

              <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-orange-100">
                <div className="w-11 h-11 rounded-full bg-paw-soft flex items-center justify-center border-2 border-white shadow-sm overflow-hidden ring-2 ring-transparent hover:ring-paw-primary/50 transition-all cursor-pointer">
                  <img
                    src="https://picsum.photos/100/100"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="md:hidden p-2 text-paw-dark hover:text-paw-primary bg-paw-soft/50 hover:bg-paw-soft rounded-2xl transition-all"
              >
                <Menu size={32} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

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

            <div className="flex items-center gap-4 mb-8 p-5 bg-paw-soft border border-orange-100 rounded-3xl">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                <img
                  src="https://picsum.photos/100/100"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-bold text-paw-dark text-xl">Sarah Jenkins</p>
                <p className="text-xs text-white font-bold bg-paw-secondary px-3 py-1 rounded-full inline-block mt-1 shadow-sm">
                  Premium Member
                </p>
              </div>
            </div>

            <nav className="flex flex-col space-y-3 flex-1 overflow-y-auto">
              {[
                "Home",
                "Book Vet",
                "Pharmacy",
                "My Pets",
                "History",
                "Settings",
              ].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="px-6 py-4 rounded-3xl text-paw-text hover:text-white hover:bg-paw-primary font-bold text-xl transition-all flex justify-between items-center group active:scale-95"
                >
                  {item}
                  <span className="text-orange-200 group-hover:text-white/80 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </a>
              ))}
            </nav>

            <button className="w-full mt-6 bg-paw-dark text-white font-bold py-5 rounded-3xl shadow-xl shadow-paw-dark/20 active:scale-95 transition-transform text-lg">
              Log Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
