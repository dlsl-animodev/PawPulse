import { Pet } from "@/lib/types/pet";
import { createClient } from "@/utils/supabase/server";

export async function getPetById(petId: string) {
  if (!petId) return null;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("pets")
      .select(
        "id, name, species, breed, gender, weight_kg, profile_image_url, notes, created_at"
      )
      .eq("id", petId)
      .single();

    if (error) {
      console.error("getPetById error:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("getPetById unexpected error:", err);
    return null;
  }
}

export async function fetchAllPets(): Promise<Pet[]> {
  const supabase = await createClient();

  // get current user from Supabase auth; only return pets owned by this user
  try {
    const { data: { user } = { user: null } } = await supabase.auth.getUser();

    if (!user) {
      // no logged in user -> return empty list
      return [];
    }

    const { data, error } = await supabase
      .from("pets")
      .select(
        "id, name, species, breed, gender, weight_kg, profile_image_url, notes, created_at, owner_id, color, age, is_active"
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchAllPets error:", error);
      return [];
    }

    return (data as Pet[]) ?? [];
  } catch (err) {
    console.error("fetchAllPets unexpected error:", err);
    return [];
  }
}
