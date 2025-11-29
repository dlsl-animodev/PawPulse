// app/pet-profile/page.tsx
import PetProfile from "@/components/pet/pet-profile-client";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PetProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ petId?: string }>;
}) {
  const petId = (await searchParams).petId;

  if (!petId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return <div className="p-6">Please log in to view your pets.</div>;
    }

    const { data: pets, error } = await supabase
      .from("pets")
      .select("*")
      .eq("owner_id", user.id);

    if (error) {
      console.error("Error fetching pets:", error);
      return <div className="p-6 text-red-500">Error loading pets</div>;
    }

    if (!pets || pets.length === 0) {
      return <div className="p-6">No pets found.</div>;
    }

    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">My Pets</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((pet) => (
            <Link
              href={`/pet-profile?petId=${pet.id}`}
              key={pet.id}
              className="block h-full"
            >
              <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{pet.name}</CardTitle>
                  <CardDescription>
                    {pet.species} {pet.breed ? `- ${pet.breed}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pet.profile_image_url ? (
                    <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                      <Image
                        src={pet.profile_image_url}
                        alt={pet.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 mb-4 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">Gender:</span>{" "}
                      {pet.gender || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Age:</span>{" "}
                      {pet.age || "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
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
