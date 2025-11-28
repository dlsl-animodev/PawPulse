import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./profile-client";
import {
  getPatientDetails,
  getPatientAllergies,
  getPatientConditions,
  getPatientSurgeries,
} from "./actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // anonymous users should register first
  if (user.is_anonymous) {
    redirect("/signup");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const [detailsResult, allergiesResult, conditionsResult, surgeriesResult] =
    await Promise.all([
      getPatientDetails(),
      getPatientAllergies(),
      getPatientConditions(),
      getPatientSurgeries(),
    ]);

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 via-white to-white py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <p className="text-sm tracking-[0.35em] uppercase text-blue-500 font-semibold">
            Your Profile
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            Manage Your Health Profile
          </h1>
          <p className="text-base text-slate-500 max-w-2xl mx-auto">
            Keep your medical information up to date for better care
          </p>
        </div>

        <ProfileClient
          user={user}
          profile={profile}
          initialDetails={detailsResult.data || null}
          initialAllergies={allergiesResult.data || []}
          initialConditions={conditionsResult.data || []}
          initialSurgeries={surgeriesResult.data || []}
        />
      </div>
    </div>
  );
}