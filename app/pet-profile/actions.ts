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
