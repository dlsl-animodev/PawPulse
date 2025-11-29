import BookingPageClient from "./booking-page-client";
import { getDoctors } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { fetchAllPets } from "@/app/pet-profile/actions";

function splitName(name: string | null | undefined) {
  if (!name) return { firstName: "", lastName: "" };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export default async function BookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // allow unauthenticated users to view the booking page
  const isGuest = !user || user.is_anonymous === true;

  let contactInfo = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  };

  if (user && !user.is_anonymous) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const { firstName, lastName } = splitName(
      profile?.full_name || user.user_metadata?.full_name
    );

    contactInfo = {
      firstName: firstName || "",
      lastName: lastName || "",
      email: user.email || "",
      phone: profile?.phone || "",
    };
  }

  const doctors = await getDoctors();
  const pets = await fetchAllPets();

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <BookingPageClient
          doctors={doctors}
          pets={pets}
          contactInfo={contactInfo}
          isGuest={isGuest}
        />
      </div>
    </div>
  );
}
