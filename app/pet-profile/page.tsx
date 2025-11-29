// app/pet-profile/page.tsx
import PetProfile from "@/components/pet/pet-profile-client";
import { createClient } from "@/utils/supabase/server";

export default async function PetProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ petId?: string }>;
}) {
  const petId = (await searchParams).petId;
  if (!petId) {
    return <div className="p-6 text-red-500">No petId provided. 
    </div>;
  }

  const data = await getPetById(petId);

  if (!data.pet) {
    return <div className="p-6 text-red-500">Pet not found.</div>;
  }

  // pass everything down so the client component doesn't need to fetch
  return <PetProfile pet={data} />;
}

async function getPetById(petId: string) {
  const supabase = await createClient();

  try {
    // fetch pet
    const petPromise = supabase
      .from("pets")
      .select(
        `
        id,
        name,
        species,
        breed,
        gender,
        age,
        weight_kg,
        color,
        profile_image_url,
        notes,
        owner_id
      `
      )
      .eq("id", petId)
      .single();

    // fetch related lists in parallel
    const appointmentsPromise = supabase
      .from("appointments")
      .select("*")
      .eq("pet_id", petId)
      .order("date", { ascending: false });

    const prescriptionsPromise = supabase
      .from("prescriptions")
      .select("*")
      .eq("pet_id", petId)
      .order("date_issued", { ascending: false });

    const historyPromise = supabase
      .from("pet_medical_history")
      .select("*")
      .eq("pet_id", petId)
      .order("date", { ascending: false });

    const [
      { data: pet, error: petError },
      { data: appointments, error: appointmentsError },
      { data: prescriptions, error: prescriptionsError },
      { data: history, error: historyError },
    ] = await Promise.all([
      petPromise,
      appointmentsPromise,
      prescriptionsPromise,
      historyPromise,
    ]);

    if (petError) {
      console.error("getPetById - petError:", petError);
    }
    if (appointmentsError) {
      console.error("getPetById - appointmentsError:", appointmentsError);
    }
    if (prescriptionsError) {
      console.error("getPetById - prescriptionsError:", prescriptionsError);
    }
    if (historyError) {
      console.error("getPetById - historyError:", historyError);
    }

    return {
      pet: pet || null,
      appointments: appointments || [],
      prescriptions: prescriptions || [],
      history: history || [],
    };
  } catch (err) {
    console.error("getPetById - unexpected error:", err);
    return { pet: null, appointments: [], prescriptions: [], history: [] };
  }
}
