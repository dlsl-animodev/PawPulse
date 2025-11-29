import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Pet } from "@/lib/types/pet";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  ChevronRight,
} from "lucide-react";
import { fetchAllPets } from "@/app/pet-profile/actions";

type Reminder = {
  id: string;
  title: string;
  date: string;
  type: "medication" | "vaccine" | string;
  petId: string;
};

const reminders: Reminder[] = [
  {
    id: "r1",
    title: "Heartworm Pill",
    date: "Today",
    type: "medication",
    petId: "p1",
  },
  {
    id: "r2",
    title: "Annual Vaxx",
    date: "In 3 days",
    type: "vaccine",
    petId: "p2",
  },
];

export async function Reminders() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="py-8 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-3xl border border-orange-100 shadow-sm shadow-orange-50 text-center">
            <h3 className="text-2xl font-display font-bold text-paw-dark mb-2">
              Welcome to CareLink
            </h3>
            <p className="text-paw-text mb-6">
              Sign in to add your pets, view prescriptions, and manage
              reminders.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-paw-primary hover:bg-paw-secondary transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    );
  }
  // fetch pets for the current user (server-side)
  const pets: Pet[] = await fetchAllPets();

  return (
    <section className="py-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10">
          {/* Pets List - Horizontal Scroll on Mobile */}
          <div>
            <div className="flex justify-between items-end mb-5 px-1">
              <h3 className="text-2xl font-display font-bold text-paw-dark">
                My Pets
              </h3>
              <button className="text-paw-primary font-bold text-sm bg-paw-soft px-3 py-1 rounded-full hover:bg-orange-100 transition-colors flex items-center gap-1">
                See all <ChevronRight size={14} />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 snap-x scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {/* Add Pet Button */}
              <Link href="/register-pet" className="flex-shrink-0 snap-start">
                <button className="w-20 h-24 sm:w-28 sm:h-32 rounded-[2rem] border-2 border-dashed border-paw-primary/40 flex flex-col items-center justify-center text-paw-primary hover:bg-paw-soft transition-colors gap-2 group">
                  <div className="bg-orange-100 p-2 rounded-full group-hover:scale-110 transition-transform">
                    <Plus size={24} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Add
                  </span>
                </button>
              </Link>

              {pets.map((pet) => (
                <div
                  key={pet.id}
                  className="flex-shrink-0 snap-start group cursor-pointer relative w-20 sm:w-28"
                >
                  <div className="w-20 h-24 sm:w-28 sm:h-32 rounded-[2rem] p-1 border-2 border-transparent group-hover:border-paw-primary transition-colors overflow-hidden relative shadow-md shadow-orange-100 bg-white">
                    <img
                      src={pet.profile_image_url}
                      alt={pet.name}
                      className="w-full h-full rounded-[1.7rem] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>

                    <div className="absolute bottom-2 left-0 right-0 text-center">
                      <p className="font-bold text-white text-sm sm:text-base leading-tight drop-shadow-md">
                        {pet.name}
                      </p>
                    </div>
                  </div>

                  {pet.species === "Dog" && (
                    <span className="absolute top-2 right-2 bg-white shadow-sm rounded-full w-6 h-6 flex items-center justify-center text-xs border border-orange-50">
                      🐶
                    </span>
                  )}
                  {pet.species === "Cat" && (
                    <span className="absolute top-2 right-2 bg-white shadow-sm rounded-full w-6 h-6 flex items-center justify-center text-xs border border-orange-50">
                      🐱
                    </span>
                  )}
                  {pet.species === "Bird" && (
                    <span className="absolute top-2 right-2 bg-white shadow-sm rounded-full w-6 h-6 flex items-center justify-center text-xs border border-orange-50">
                      🐦
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reminders Panel */}
          <div>
            <h3 className="text-2xl font-display font-bold text-paw-dark mb-4 px-1">
              Up Next
            </h3>
            <div className="space-y-3">
              {reminders.map((rem) => (
                <div
                  key={rem.id}
                  className="bg-white p-4 rounded-3xl border border-orange-100 shadow-sm shadow-orange-50 flex items-center gap-4 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                      rem.type === "medication"
                        ? "bg-paw-pink/10 text-paw-pink"
                        : "bg-paw-secondary/10 text-paw-secondary"
                    }`}
                  >
                    {rem.type === "medication" ? (
                      <AlertCircle size={28} />
                    ) : (
                      <Clock size={28} />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-paw-dark text-lg leading-tight">
                        {rem.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                          rem.date === "Today"
                            ? "bg-red-100 text-red-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {rem.date}
                      </span>
                      <span className="text-sm text-paw-text font-medium">
                        • For {pets.find((p: Pet) => p.id === rem.petId)?.name}
                      </span>
                    </div>
                  </div>

                  <button className="w-12 h-12 rounded-full bg-paw-soft text-orange-200 flex items-center justify-center hover:bg-paw-secondary hover:text-white transition-all transform hover:rotate-12">
                    <CheckCircle2 size={24} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
