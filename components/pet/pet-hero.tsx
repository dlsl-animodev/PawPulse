import { Video, Calendar, Sparkles, MessageCircle } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <div className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-24">
      {/* Background Decor - Bubbly Orange Shapes */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-paw-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float -translate-x-1/2 -translate-y-1/2"></div>
      <div
        className="absolute top-40 right-0 w-80 h-80 bg-paw-secondary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float translate-x-1/2"
        style={{ animationDelay: "2s" }}
      ></div>
      <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-paw-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse-slow"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left lg:col-span-6 mb-12 lg:mb-0">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white shadow-md shadow-orange-100 border border-orange-50 text-paw-primaryDark text-sm font-bold mb-6 animate-bounce-slow">
              <span className="flex h-3 w-3 rounded-full bg-paw-primary mr-2 animate-pulse"></span>
              Veterinarians online now
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl tracking-tight font-display font-bold text-paw-dark mb-6 leading-[1.1]">
              Expert Care
              <br />
              <span className="text-paw-primary relative inline-block">
                For Best Friends
                <svg
                  className="absolute -bottom-2 left-0 w-full h-4 text-paw-secondary opacity-60"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 15 100 5"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-6 text-xl text-paw-text max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
              Skip the car ride anxiety! Book video consults, get meds
              delivered, and track health history from your couch.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/book"
                className="relative group inline-flex items-center justify-center px-8 py-5 border-b-4 border-orange-700 text-lg font-bold rounded-2xl text-white bg-paw-primary active:border-b-0 active:translate-y-1 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <MessageCircle className="mr-3 h-6 w-6" strokeWidth={3} />
                Talk to a Vet
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-5 border-2 border-orange-100 text-lg font-bold rounded-2xl text-paw-primaryDark bg-white hover:border-paw-primary hover:bg-orange-50 transition-all active:scale-95"
              >
                <Calendar className="mr-3 h-6 w-6" strokeWidth={2.5} />
                Manage Appointments
              </Link>
            </div>
          </div>

          {/* Hero Image / Visuals */}
          <div className="lg:col-span-6 relative w-full max-w-md lg:max-w-full mx-auto">
            <div className="relative aspect-square">
              {/* Decorative Blobs behind image */}
              <div className="absolute top-0 right-0 w-full h-full bg-paw-accent/20 rounded-[4rem] rotate-6 animate-wiggle"></div>
              <div className="absolute bottom-0 left-4 w-full h-full bg-paw-primary/10 rounded-[4rem] -rotate-3"></div>

              {/* Main Image */}
              <div className="absolute inset-4 bg-white rounded-[3.5rem] shadow-2xl shadow-orange-200/50 overflow-hidden transform transition-transform hover:scale-[1.02] duration-500 border-4 border-white">
                <img
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Happy dog getting a high five"
                />

                {/* Overlay Card */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-8 pt-24 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-3xl text-white">
                        Dr. Emily Chen
                      </p>
                      <p className="text-white/90 font-bold text-base flex items-center gap-2 mt-1">
                        <span className="w-3 h-3 bg-paw-secondary rounded-full animate-pulse border-2 border-white"></span>
                        Available right now
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/30 transition-colors cursor-pointer">
                      <Video
                        size={28}
                        className="text-white"
                        fill="currentColor"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Element 1 - Top Left */}
              <div
                className="absolute -top-4 -left-2 sm:left-4 bg-white p-4 pr-6 rounded-3xl shadow-xl shadow-orange-200/40 flex items-center gap-3 animate-float border border-orange-50"
                style={{ animationDelay: "0s" }}
              >
                <div className="bg-paw-primary/10 p-2.5 rounded-full">
                  <Sparkles
                    className="text-paw-primary"
                    size={24}
                    fill="currentColor"
                  />
                </div>
                <div>
                  <p className="font-bold text-paw-dark text-base">
                    AI Assistant
                  </p>
                  <p className="text-xs text-paw-text font-bold uppercase tracking-wide">
                    Always ready
                  </p>
                </div>
              </div>

              {/* Floating Element 2 - Bottom Right */}
              <div
                className="absolute -bottom-8 right-8 sm:-right-4 bg-white p-4 rounded-3xl shadow-xl shadow-orange-200/40 flex items-center gap-3 animate-float border border-orange-50"
                style={{ animationDelay: "1.5s" }}
              >
                <div className="w-12 h-12 rounded-full bg-paw-secondary/20 flex items-center justify-center text-2xl">
                  💊
                </div>
                <div>
                  <p className="font-bold text-paw-dark text-base">
                    Meds Delivery
                  </p>
                  <p className="text-xs text-paw-secondary font-bold uppercase tracking-wide">
                    Arrives Today
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
