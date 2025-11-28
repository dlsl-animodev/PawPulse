import BookingForm from "./[id]/booking-form";
import { getDoctors } from "./actions";
import { createClient } from "@/utils/supabase/server";

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

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 via-white to-white py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <p className="text-sm tracking-[0.35em] uppercase text-blue-500 font-semibold">
            CareLink Booking
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            Schedule your next consultation
          </h1>
          <p className="text-base text-slate-500 max-w-2xl mx-auto">
            Start by picking a date and time, tell us why you&apos;re visiting,
            then choose from {doctors.length} trusted specialists.
          </p>
        </div>

        <BookingForm
          doctors={doctors}
          contactInfo={contactInfo}
          isGuest={isGuest}
        />
      </div>
    </div>
  );
}
